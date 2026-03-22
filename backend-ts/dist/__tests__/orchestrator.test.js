import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readlinkSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";
// Mock the claude-agent-sdk before importing orchestrator
vi.mock("@anthropic-ai/claude-agent-sdk", () => {
    return {
        query: vi.fn(({ prompt, options }) => {
            // Create the output video file to simulate a successful agent run
            const outputDir = join(options.cwd, "output");
            mkdirSync(outputDir, { recursive: true });
            writeFileSync(join(outputDir, "video.mp4"), "fake-rendered-video");
            // Return an async generator that yields assistant + result messages
            const messages = [
                {
                    type: "assistant",
                    message: {
                        content: [
                            { type: "text", text: "I will create the video now." },
                            { type: "tool_use", name: "Bash", input: { command: "npx remotion render" } },
                        ],
                    },
                },
                {
                    type: "result",
                    is_error: false,
                    subtype: "success",
                    result: "the video is done generating!",
                },
            ];
            const generator = {
                async *[Symbol.asyncIterator]() {
                    for (const msg of messages)
                        yield msg;
                },
                close: vi.fn(),
            };
            return generator;
        }),
    };
});
// Mock prompt enhancer to avoid real Fireworks API calls
vi.mock("../agent/prompt-enhancer.js", () => ({
    enhancePrompt: vi.fn(async (prompt) => `Enhanced: ${prompt}`),
}));
// Mock upload-assets to avoid dependency on real upload dir
vi.mock("../lib/upload-assets.js", () => ({
    collectAssetSummaries: vi.fn(() => []),
    formatAssetsContext: vi.fn(() => ""),
    copyUploadsToJob: vi.fn(),
}));
// Mock logfire to avoid needing real observability config
vi.mock("@pydantic/logfire-node", () => ({
    configure: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    span: vi.fn((_name, opts) => {
        if (opts && typeof opts.callback === "function")
            return opts.callback();
        return undefined;
    }),
    startSpan: vi.fn(),
    reportError: vi.fn(),
}));
import { run } from "../agent/orchestrator.js";
import { VideoStyle } from "../agent/video-styles.js";
const TEST_TEMPLATE_DIR = config.remotionProjectPath;
const TEST_JOBS_DIR = config.remotionJobsPath;
const TEST_OUTPUT_DIR = config.outputDir;
function setupTemplate() {
    // Create a minimal remotion project template
    mkdirSync(join(TEST_TEMPLATE_DIR, "src"), { recursive: true });
    mkdirSync(join(TEST_TEMPLATE_DIR, ".claude", "skills"), { recursive: true });
    mkdirSync(join(TEST_TEMPLATE_DIR, "public", "music"), { recursive: true });
    writeFileSync(join(TEST_TEMPLATE_DIR, "package.json"), '{"name":"test"}');
    writeFileSync(join(TEST_TEMPLATE_DIR, "src", "index.js"), "// entry");
    writeFileSync(join(TEST_TEMPLATE_DIR, "src", "Root.jsx"), "// root");
    writeFileSync(join(TEST_TEMPLATE_DIR, ".claude", "skills", "remotion-best-practices.md"), "# skill");
}
function cleanup() {
    for (const dir of [TEST_JOBS_DIR, TEST_OUTPUT_DIR, TEST_TEMPLATE_DIR]) {
        if (existsSync(dir))
            rmSync(dir, { recursive: true });
    }
}
describe("orchestrator", () => {
    beforeEach(() => {
        cleanup();
        setupTemplate();
        mkdirSync(TEST_JOBS_DIR, { recursive: true });
        mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    });
    afterEach(cleanup);
    it("runs a full job and produces output", async () => {
        const result = await run("test-job-001", "make a sunset video", VideoStyle.GENERAL);
        expect(result).toHaveProperty("output_path");
        expect(result).toHaveProperty("job_project_path");
        expect(result.output_path).toContain("test-job-001.mp4");
        expect(existsSync(result.output_path)).toBe(true);
    });
    it("creates job directory from template", async () => {
        await run("test-job-002", "test prompt", VideoStyle.GENERAL);
        const jobDir = join(TEST_JOBS_DIR, "test-job-002");
        expect(existsSync(jobDir)).toBe(true);
        expect(existsSync(join(jobDir, "src", "index.js"))).toBe(true);
        expect(existsSync(join(jobDir, "src", "Root.jsx"))).toBe(true);
        expect(existsSync(join(jobDir, ".claude", "skills", "remotion-best-practices.md"))).toBe(true);
    });
    it("creates output directory inside job dir", async () => {
        await run("test-job-003", "test prompt", VideoStyle.GENERAL);
        const outputDir = join(TEST_JOBS_DIR, "test-job-003", "output");
        expect(existsSync(outputDir)).toBe(true);
    });
    it("copies final video to output dir", async () => {
        await run("test-job-004", "test prompt", VideoStyle.TRAILER);
        const finalPath = join(TEST_OUTPUT_DIR, "test-job-004.mp4");
        expect(existsSync(finalPath)).toBe(true);
    });
    it("throws if job directory already exists", async () => {
        mkdirSync(join(TEST_JOBS_DIR, "dup-job"), { recursive: true });
        await expect(run("dup-job", "test", VideoStyle.GENERAL)).rejects.toThrow(/already exists/);
    });
    it("preserves symlinks when copying template", async () => {
        // Create a symlink in the template
        const linkTarget = join(TEST_TEMPLATE_DIR, "src", "index.js");
        const linkPath = join(TEST_TEMPLATE_DIR, "src", "link.js");
        symlinkSync(linkTarget, linkPath);
        await run("test-job-symlink", "test", VideoStyle.GENERAL);
        const copiedLink = join(TEST_JOBS_DIR, "test-job-symlink", "src", "link.js");
        expect(existsSync(copiedLink)).toBe(true);
        // Verify it's still a symlink (readlinkSync throws if not a symlink)
        expect(() => readlinkSync(copiedLink)).not.toThrow();
    });
});
//# sourceMappingURL=orchestrator.test.js.map