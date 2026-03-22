import { describe, expect, it, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { config } from "../config.js";
import { uploadRoutes } from "../routes/uploads.js";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import FormData from "form-data";
const TEST_UPLOAD_DIR = config.uploadDir;
function cleanup() {
    if (existsSync(TEST_UPLOAD_DIR))
        rmSync(TEST_UPLOAD_DIR, { recursive: true });
}
describe("upload routes", () => {
    const app = Fastify();
    beforeAll(async () => {
        await app.register(cors, { origin: "*" });
        await app.register(multipart);
        await app.register(fastifyStatic, { root: TEST_UPLOAD_DIR, serve: false });
        await app.register(uploadRoutes);
        await app.ready();
    });
    beforeEach(() => {
        cleanup();
        mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
    });
    afterEach(cleanup);
    afterAll(async () => {
        await app.close();
    });
    describe("GET /api/uploads", () => {
        it("returns empty array when no uploads exist", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/uploads",
            });
            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual([]);
        });
    });
    describe("POST /api/uploads", () => {
        it("uploads a file successfully", async () => {
            const form = new FormData();
            form.append("file", Buffer.from("hello world"), {
                filename: "test.txt",
                contentType: "text/plain",
            });
            const response = await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form.getHeaders(),
                payload: form.getBuffer(),
            });
            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.name).toBe("test.txt");
            expect(body).toHaveProperty("size");
            expect(body).toHaveProperty("type");
            expect(body).toHaveProperty("uploaded_at");
            // Verify file exists on disk
            expect(existsSync(join(TEST_UPLOAD_DIR, "test.txt"))).toBe(true);
            // Verify sidecar exists
            expect(existsSync(join(TEST_UPLOAD_DIR, "test.txt.json"))).toBe(true);
        });
        it("deduplicates filename with _1, _2 suffix", async () => {
            // Upload first file
            const form1 = new FormData();
            form1.append("file", Buffer.from("first"), {
                filename: "dup.txt",
                contentType: "text/plain",
            });
            await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form1.getHeaders(),
                payload: form1.getBuffer(),
            });
            // Upload duplicate
            const form2 = new FormData();
            form2.append("file", Buffer.from("second"), {
                filename: "dup.txt",
                contentType: "text/plain",
            });
            const response = await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form2.getHeaders(),
                payload: form2.getBuffer(),
            });
            expect(response.statusCode).toBe(200);
            const body = response.json();
            expect(body.name).toBe("dup_1.txt");
            expect(existsSync(join(TEST_UPLOAD_DIR, "dup.txt"))).toBe(true);
            expect(existsSync(join(TEST_UPLOAD_DIR, "dup_1.txt"))).toBe(true);
        });
    });
    describe("DELETE /api/uploads/:filename", () => {
        it("deletes file, sidecar, and returns success", async () => {
            // Upload first
            const form = new FormData();
            form.append("file", Buffer.from("to delete"), {
                filename: "deleteme.txt",
                contentType: "text/plain",
            });
            await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form.getHeaders(),
                payload: form.getBuffer(),
            });
            expect(existsSync(join(TEST_UPLOAD_DIR, "deleteme.txt"))).toBe(true);
            const response = await app.inject({
                method: "DELETE",
                url: "/api/uploads/deleteme.txt",
            });
            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty("detail", "deleted");
            expect(existsSync(join(TEST_UPLOAD_DIR, "deleteme.txt"))).toBe(false);
            expect(existsSync(join(TEST_UPLOAD_DIR, "deleteme.txt.json"))).toBe(false);
        });
        it("returns 404 for non-existent file", async () => {
            const response = await app.inject({
                method: "DELETE",
                url: "/api/uploads/noexist.txt",
            });
            expect(response.statusCode).toBe(404);
        });
    });
    describe("GET /api/uploads/:filename", () => {
        it("serves uploaded file", async () => {
            const form = new FormData();
            form.append("file", Buffer.from("serve me"), {
                filename: "served.txt",
                contentType: "text/plain",
            });
            await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form.getHeaders(),
                payload: form.getBuffer(),
            });
            const response = await app.inject({
                method: "GET",
                url: "/api/uploads/served.txt",
            });
            expect(response.statusCode).toBe(200);
            expect(response.body).toBe("serve me");
        });
        it("returns 404 for non-existent file", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/uploads/nope.txt",
            });
            expect(response.statusCode).toBe(404);
        });
    });
    describe("GET /api/uploads/:filename/thumbnail", () => {
        it("returns 404 for non-video file without thumbnail", async () => {
            const form = new FormData();
            form.append("file", Buffer.from("text"), {
                filename: "notavideo.txt",
                contentType: "text/plain",
            });
            await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form.getHeaders(),
                payload: form.getBuffer(),
            });
            const response = await app.inject({
                method: "GET",
                url: "/api/uploads/notavideo.txt/thumbnail",
            });
            expect(response.statusCode).toBe(404);
        });
    });
    describe("full CRUD lifecycle", () => {
        it("upload → list → serve → delete → list empty", async () => {
            // 1. Upload
            const form = new FormData();
            form.append("file", Buffer.from("lifecycle data"), {
                filename: "lifecycle.txt",
                contentType: "text/plain",
            });
            const uploadRes = await app.inject({
                method: "POST",
                url: "/api/uploads",
                headers: form.getHeaders(),
                payload: form.getBuffer(),
            });
            expect(uploadRes.statusCode).toBe(200);
            // 2. List
            const listRes = await app.inject({ method: "GET", url: "/api/uploads" });
            const files = listRes.json();
            expect(files).toHaveLength(1);
            expect(files[0].name).toBe("lifecycle.txt");
            // 3. Serve
            const serveRes = await app.inject({ method: "GET", url: "/api/uploads/lifecycle.txt" });
            expect(serveRes.statusCode).toBe(200);
            expect(serveRes.body).toBe("lifecycle data");
            // 4. Delete
            const delRes = await app.inject({ method: "DELETE", url: "/api/uploads/lifecycle.txt" });
            expect(delRes.statusCode).toBe(200);
            // 5. List again — empty
            const listRes2 = await app.inject({ method: "GET", url: "/api/uploads" });
            expect(listRes2.json()).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=upload-routes.test.js.map