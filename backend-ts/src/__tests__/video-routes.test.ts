import { describe, expect, it, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { config } from "../config.js";
import { videoRoutes } from "../routes/videos.js";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

describe("video routes", () => {
  const app = Fastify();

  beforeAll(async () => {
    mkdirSync(config.outputDir, { recursive: true });
    await app.register(cors, { origin: "*" });
    await app.register(multipart);
    await app.register(fastifyStatic, { root: config.uploadDir, serve: false });
    await app.register(videoRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/video-styles", () => {
    it("returns an array of styles with correct shape", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/video-styles",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);

      for (const style of body) {
        expect(style).toHaveProperty("value");
        expect(style).toHaveProperty("label");
        expect(style).toHaveProperty("description");
      }
    });

    it("includes general and trailer styles", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/video-styles",
      });

      const values = response.json().map((s: any) => s.value);
      expect(values).toContain("general");
      expect(values).toContain("trailer");
    });
  });

  describe("GET /api/jobs/:job_id/video", () => {
    it("returns 404 for non-existent job", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/jobs/NONEXISTENT/video",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toHaveProperty("detail", "Video not found");
    });

    it("serves video when it exists", async () => {
      const jobId = "__test_serve_video__";
      const videoPath = join(config.outputDir, `${jobId}.mp4`);
      mkdirSync(config.outputDir, { recursive: true });
      writeFileSync(videoPath, "fake-video-data");

      try {
        const response = await app.inject({
          method: "GET",
          url: `/api/jobs/${jobId}/video`,
        });

        expect(response.statusCode).toBe(200);
      } finally {
        if (existsSync(videoPath)) rmSync(videoPath);
      }
    });
  });
});
