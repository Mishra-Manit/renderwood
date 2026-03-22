import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const BACKEND_DIR = resolve(import.meta.dirname, "..");

loadEnv({ path: resolve(BACKEND_DIR, ".env") });

const envSchema = z.object({
  anthropicApiKey: z.string().default(""),
  fireworksApiKey: z.string().default(""),
  fireworksModel: z.string().default("accounts/fireworks/models/kimi-k2p5"),
  environment: z.string().default("development"),
  remotionProjectPath: z.string().default("./remotion_project"),
  remotionJobsPath: z.string().default("./remotion_jobs"),
  uploadDir: z.string().default("./uploads"),
  outputDir: z.string().default("./final_vids"),
  maxRenderTimeout: z.coerce.number().int().default(600),
  claudeCodePath: z.string().default(""),
  claudeModel: z.string().default("claude-sonnet-4-6"),
  defaultFps: z.coerce.number().int().default(30),
  defaultWidth: z.coerce.number().int().default(1920),
  defaultHeight: z.coerce.number().int().default(1080),
});

function loadConfig() {
  const raw = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    fireworksApiKey: process.env.FIREWORKS_API_KEY,
    fireworksModel: process.env.FIREWORKS_MODEL,
    environment: process.env.ENVIRONMENT,
    remotionProjectPath: process.env.REMOTION_PROJECT_PATH,
    remotionJobsPath: process.env.REMOTION_JOBS_PATH,
    uploadDir: process.env.UPLOAD_DIR,
    outputDir: process.env.OUTPUT_DIR,
    maxRenderTimeout: process.env.MAX_RENDER_TIMEOUT,
    claudeCodePath: process.env.CLAUDE_CODE_PATH,
    claudeModel: process.env.CLAUDE_MODEL,
    defaultFps: process.env.DEFAULT_FPS,
    defaultWidth: process.env.DEFAULT_WIDTH,
    defaultHeight: process.env.DEFAULT_HEIGHT,
  };

  const parsed = envSchema.parse(raw);

  return {
    ...parsed,
    remotionProjectPath: resolve(BACKEND_DIR, parsed.remotionProjectPath),
    remotionJobsPath: resolve(BACKEND_DIR, parsed.remotionJobsPath),
    uploadDir: resolve(BACKEND_DIR, parsed.uploadDir),
    outputDir: resolve(BACKEND_DIR, parsed.outputDir),
  };
}

export type Config = ReturnType<typeof loadConfig>;
export const config = loadConfig();
