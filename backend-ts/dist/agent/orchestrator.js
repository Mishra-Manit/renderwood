import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { cpSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { SpanStatusCode } from "@opentelemetry/api";
import { config } from "../config.js";
import { logfire, tracer, withSpan } from "../observability.js";
import { REMOTION_AGENT_SYSTEM_PROMPT } from "./prompts.js";
import { enhancePrompt } from "./prompt-enhancer.js";
import { collectAssetSummaries, formatAssetsContext, copyUploadsToJob, } from "../lib/upload-assets.js";
import { VideoStyle } from "./video-styles.js";
export async function run(jobId, prompt, videoStyle = VideoStyle.GENERAL) {
    return withSpan("remotion_video_generation", { job_id: jobId, user_prompt: prompt, video_style: videoStyle }, async () => {
        const { jobDir, outputDir } = setupJobDirectory(jobId);
        const summaries = collectAssetSummaries();
        const assetsContext = formatAssetsContext(summaries);
        if (summaries.length > 0) {
            copyUploadsToJob(jobDir);
        }
        const enhancedPrompt = await enhancePrompt(prompt, videoStyle, assetsContext);
        const agentPrompt = buildAgentPrompt(enhancedPrompt, assetsContext);
        const options = buildAgentOptions(jobDir);
        const jobOutputPath = await runAgent(agentPrompt, options, outputDir);
        validateOutput(jobOutputPath);
        const finalOutputPath = copyOutputToFinal(jobOutputPath, jobId);
        logfire.info("video_generation_complete", {
            job_id: jobId,
            output_path: finalOutputPath,
        });
        return {
            output_path: finalOutputPath,
            job_project_path: jobDir,
        };
    });
}
function setupJobDirectory(jobId) {
    const jobDir = join(config.remotionJobsPath, jobId);
    const outputDir = join(jobDir, "output");
    if (existsSync(jobDir)) {
        throw new Error(`Job directory already exists: ${jobDir}`);
    }
    // cpSync with dereference:false preserves symlinks (like Python's symlinks=True)
    cpSync(config.remotionProjectPath, jobDir, {
        recursive: true,
        dereference: false,
    });
    mkdirSync(outputDir, { recursive: true });
    logfire.info("job_directory_created", {
        job_dir: jobDir,
        output_dir: outputDir,
    });
    return { jobDir, outputDir };
}
function buildAgentPrompt(userPrompt, assetsContext = "") {
    let prompt = `User request: ${userPrompt}\n\n` +
        "The Remotion project is in the current directory. " +
        "Edit the source files, then render the video. " +
        "The final output file MUST be saved to: output/video.mp4.";
    if (assetsContext) {
        prompt +=
            "\n\nUploaded assets are available in public/ and can be " +
                "referenced using staticFile('filename.ext').\n\n" +
                assetsContext;
    }
    return prompt;
}
function buildAgentOptions(jobDir) {
    const opts = {
        systemPrompt: REMOTION_AGENT_SYSTEM_PROMPT,
        settingSources: ["user", "project"],
        allowedTools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        cwd: jobDir,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: 30,
        model: config.claudeModel,
        env: { ...process.env, ANTHROPIC_API_KEY: config.anthropicApiKey },
    };
    if (config.claudeCodePath) {
        opts.pathToClaudeCodeExecutable = config.claudeCodePath;
    }
    return opts;
}
async function runAgent(prompt, options, outputDir) {
    const conversation = query({ prompt, options });
    let turnCount = 0;
    let lastMessageId = null;
    try {
        for await (const message of conversation) {
            if (message.type === "assistant") {
                const msg = message;
                // The SDK emits one assistant message per content block, not per API
                // call. All blocks from the same API call share the same message.id.
                // Only trace once per unique API call to avoid duplicating token counts.
                if (msg.message.id !== lastMessageId) {
                    lastMessageId = msg.message.id;
                    turnCount++;
                    traceAssistantTurn(msg, turnCount);
                }
            }
            else if (message.type === "result") {
                traceResult(message, turnCount);
                handleResultMessage(message, turnCount, outputDir);
            }
        }
    }
    finally {
        conversation.close();
    }
    return join(outputDir, "video.mp4");
}
function traceAssistantTurn(message, turn) {
    const { model, usage, stop_reason, content } = message.message;
    const toolCalls = content
        .filter((b) => b.type === "tool_use")
        .map((b) => b.name);
    const span = tracer.startSpan("gen_ai.chat", {
        attributes: {
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": model,
            "gen_ai.response.model": model,
            "gen_ai.usage.input_tokens": usage.input_tokens,
            "gen_ai.usage.output_tokens": usage.output_tokens,
            "gen_ai.response.finish_reasons": stop_reason ? [stop_reason] : [],
            "claude.turn": turn,
            ...(usage.cache_read_input_tokens != null && {
                "gen_ai.usage.cache_read_input_tokens": usage.cache_read_input_tokens,
            }),
            ...(usage.cache_creation_input_tokens != null && {
                "gen_ai.usage.cache_creation_input_tokens": usage.cache_creation_input_tokens,
            }),
            ...(toolCalls.length > 0 && {
                "claude.tool_calls": toolCalls,
            }),
        },
    });
    if (message.error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: message.error });
    }
    span.end();
}
function traceResult(message, turnCount) {
    const span = tracer.startSpan("gen_ai.agent.result", {
        attributes: {
            "gen_ai.system": "anthropic",
            "gen_ai.usage.input_tokens": message.usage.input_tokens,
            "gen_ai.usage.output_tokens": message.usage.output_tokens,
            "claude.num_turns": message.num_turns,
            "claude.total_cost_usd": message.total_cost_usd,
            "claude.duration_ms": message.duration_ms,
            "claude.duration_api_ms": message.duration_api_ms,
            "claude.stop_reason": message.stop_reason ?? "",
            "claude.is_error": message.is_error,
        },
    });
    for (const [model, usage] of Object.entries(message.modelUsage)) {
        span.setAttribute(`claude.model_usage.${model}.input_tokens`, usage.inputTokens);
        span.setAttribute(`claude.model_usage.${model}.output_tokens`, usage.outputTokens);
        span.setAttribute(`claude.model_usage.${model}.cost_usd`, usage.costUSD);
    }
    if (message.is_error) {
        const errors = message.subtype === "success"
            ? "unknown error"
            : message.errors.join("; ");
        span.setStatus({ code: SpanStatusCode.ERROR, message: errors });
    }
    span.end();
}
function handleResultMessage(message, turnCount, outputDir) {
    if (message.is_error) {
        const videoExists = existsSync(join(outputDir, "video.mp4"));
        const errorText = message.subtype === "success"
            ? "unknown error"
            : message.errors.join("; ");
        logfire.error("agent_execution_failed", {
            error: errorText,
            turn_count: turnCount,
            video_already_rendered: videoExists,
        });
        if (!videoExists) {
            throw new Error(`Agent failed: ${errorText}`);
        }
        logfire.warning("agent_error_after_render", {
            message: "Agent reported an error but the video was already rendered. Continuing.",
            error: errorText,
        });
        return;
    }
    logfire.info("agent_execution_complete", {
        result: message.result,
        turn_count: turnCount,
    });
}
function validateOutput(outputPath) {
    if (!existsSync(outputPath)) {
        logfire.error("output_validation_failed", {
            expected_path: outputPath,
        });
        throw new Error(`Agent did not produce output at ${outputPath}`);
    }
}
function copyOutputToFinal(outputPath, jobId) {
    mkdirSync(config.outputDir, { recursive: true });
    const finalPath = join(config.outputDir, `${jobId}.mp4`);
    copyFileSync(outputPath, finalPath);
    return finalPath;
}
//# sourceMappingURL=orchestrator.js.map