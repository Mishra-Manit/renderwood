import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { configureObservability } from "./observability.js";
import { uploadRoutes } from "./routes/uploads.js";
import { videoRoutes } from "./routes/videos.js";
function ensureDirectories() {
    const dirs = [
        config.outputDir,
        config.remotionJobsPath,
        config.uploadDir,
        resolve(config.remotionProjectPath, "props"),
    ];
    for (const dir of dirs) {
        mkdirSync(dir, { recursive: true });
    }
}
configureObservability();
ensureDirectories();
const app = Fastify({ logger: true });
await app.register(cors, { origin: "*" });
await app.register(multipart);
await app.register(fastifyStatic, { root: config.uploadDir, serve: false });
app.get("/health", async () => ({ status: "ok" }));
await app.register(uploadRoutes);
await app.register(videoRoutes);
async function start() {
    await app.listen({ port: 8000, host: "0.0.0.0" });
}
function setupGracefulShutdown() {
    let closing = false;
    const gracefulClose = async (signal) => {
        if (closing)
            return;
        closing = true;
        console.log(`Received ${signal}, shutting down gracefully…`);
        try {
            await app.close();
        }
        catch (err) {
            console.error("Error closing Fastify:", err);
        }
    };
    // The Logfire SDK handles SIGTERM internally (flushes spans + shuts down).
    // We add our own handler to also close Fastify and release the port.
    process.on("SIGTERM", () => gracefulClose("SIGTERM"));
    // tsx watch sends SIGINT on restart. The SDK does NOT handle SIGINT.
    // Close Fastify, then re-raise as SIGTERM so the SDK flushes spans.
    process.on("SIGINT", async () => {
        await gracefulClose("SIGINT");
        process.kill(process.pid, "SIGTERM");
    });
}
setupGracefulShutdown();
start();
//# sourceMappingURL=server.js.map