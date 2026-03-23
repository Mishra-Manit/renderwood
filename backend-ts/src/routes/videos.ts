import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import type { FastifyInstance } from "fastify";
import type { VideoCreateResponse } from "@shared/video-contract";
import { config } from "../config.js";
import { videoCreateRequestSchema } from "../schemas.js";
import { listStyles } from "../agent/video-styles.js";
import { generateJobId } from "../lib/job-ids.js";
import { run as runOrchestrator } from "../agent/orchestrator.js";

export async function videoRoutes(app: FastifyInstance) {
  app.get("/api/video-styles", async () => {
    return listStyles();
  });

  app.post("/api/videos/create", async (request) => {
    const body = videoCreateRequestSchema.parse(request.body);
    const jobId = generateJobId();

    try {
      const result = await runOrchestrator(jobId, body.prompt, body.video_style);

      const response: VideoCreateResponse = {
        job_id: jobId,
        status: "complete",
        output_path: result.output_path,
        job_project_path: result.job_project_path,
      };

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const response: VideoCreateResponse = {
        job_id: jobId,
        status: "failed",
        error: message,
      };

      return response;
    }
  });

  app.get<{ Params: { job_id: string } }>("/api/jobs/:job_id/video", async (request, reply) => {
    const jobId = basename(request.params.job_id);
    const videoPath = join(config.outputDir, `${jobId}.mp4`);

    if (!existsSync(videoPath)) {
      return reply.status(404).send({ detail: "Video not found" });
    }

    return reply.sendFile(`${jobId}.mp4`, config.outputDir);
  });
}
