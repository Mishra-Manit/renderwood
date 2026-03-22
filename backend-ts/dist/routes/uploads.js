import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, createWriteStream } from "node:fs";
import { join, basename, parse as parsePath } from "node:path";
import { pipeline } from "node:stream/promises";
import { execFileSync } from "node:child_process";
import { lookup as mimeLookup } from "mime-types";
import { config } from "../config.js";
import { isSidecar } from "../lib/upload-assets.js";
const THUMB_DIR_NAME = ".thumb";
const THUMBNAIL_SEEK_SECONDS = "0.5";
function metadataPath(filePath) {
    return `${filePath}.json`;
}
function thumbDir(uploadDir) {
    return join(uploadDir, THUMB_DIR_NAME);
}
function thumbnailPath(filePath) {
    return join(thumbDir(join(filePath, "..")), `${basename(filePath)}.jpg`);
}
function readMetadata(filePath) {
    const mp = metadataPath(filePath);
    if (!existsSync(mp))
        return null;
    try {
        return JSON.parse(readFileSync(mp, "utf-8"));
    }
    catch {
        return null;
    }
}
function writeMetadata(filePath, originalName, description, thumbnailName) {
    const mime = mimeLookup(filePath) || "application/octet-stream";
    const stat = statSync(filePath);
    const metadata = {
        original_name: originalName,
        stored_name: basename(filePath),
        description,
        uploaded_at: new Date().toISOString(),
        size: stat.size,
        mime_type: mime,
        thumbnail_name: thumbnailName,
    };
    writeFileSync(metadataPath(filePath), JSON.stringify(metadata, null, 2));
    return metadata;
}
function hasThumbnail(filePath, meta) {
    if (!meta)
        return false;
    const tn = meta.thumbnail_name;
    if (!tn)
        return false;
    return existsSync(join(thumbDir(join(filePath, "..")), basename(tn)));
}
function generateVideoThumbnail(filePath, mimeType) {
    if (!mimeType.startsWith("video/"))
        return "";
    const tp = thumbnailPath(filePath);
    mkdirSync(join(tp, ".."), { recursive: true });
    try {
        execFileSync("ffmpeg", [
            "-y", "-ss", THUMBNAIL_SEEK_SECONDS,
            "-i", filePath,
            "-frames:v", "1", "-q:v", "2",
            tp,
        ], { stdio: "ignore" });
    }
    catch {
        return "";
    }
    return existsSync(tp) ? basename(tp) : "";
}
function deduplicateName(dir, name) {
    const { name: stem, ext } = parsePath(name);
    let dest = join(dir, name);
    let counter = 1;
    while (existsSync(dest)) {
        dest = join(dir, `${stem}_${counter}${ext}`);
        counter++;
    }
    return dest;
}
export async function uploadRoutes(app) {
    app.get("/api/uploads", async () => {
        const dir = config.uploadDir;
        if (!existsSync(dir))
            return [];
        const entries = readdirSync(dir).sort();
        const files = [];
        for (const name of entries) {
            const fp = join(dir, name);
            const stat = statSync(fp, { throwIfNoEntry: false });
            if (!stat?.isFile() || name.startsWith(".") || isSidecar(fp))
                continue;
            const meta = readMetadata(fp);
            const mime = mimeLookup(name) || "application/octet-stream";
            files.push({
                name,
                size: stat.size,
                type: mime,
                description: meta?.description ?? "",
                uploaded_at: meta?.uploaded_at ?? "",
                has_thumbnail: hasThumbnail(fp, meta),
            });
        }
        return files;
    });
    app.post("/api/uploads", async (request, reply) => {
        const data = await request.file();
        if (!data || !data.filename) {
            return reply.status(400).send({ detail: "No filename provided" });
        }
        mkdirSync(config.uploadDir, { recursive: true });
        const safeName = basename(data.filename);
        const dest = deduplicateName(config.uploadDir, safeName);
        await pipeline(data.file, createWriteStream(dest));
        const mime = mimeLookup(dest) || "application/octet-stream";
        const thumbnailName = generateVideoThumbnail(dest, mime);
        const meta = writeMetadata(dest, safeName, data.fields.description?.value ?? "", thumbnailName);
        return {
            name: basename(dest),
            size: meta.size,
            type: meta.mime_type,
            description: meta.description,
            uploaded_at: meta.uploaded_at,
            has_thumbnail: Boolean(meta.thumbnail_name),
        };
    });
    app.delete("/api/uploads/:filename", async (request, reply) => {
        const safeName = basename(request.params.filename);
        const fp = join(config.uploadDir, safeName);
        if (!existsSync(fp) || !statSync(fp).isFile()) {
            return reply.status(404).send({ detail: "File not found" });
        }
        const meta = readMetadata(fp);
        const tn = meta?.thumbnail_name ?? "";
        unlinkSync(fp);
        const mp = metadataPath(fp);
        if (existsSync(mp))
            unlinkSync(mp);
        if (tn) {
            const tp = join(thumbDir(config.uploadDir), basename(tn));
            if (existsSync(tp))
                unlinkSync(tp);
        }
        return { detail: "deleted" };
    });
    app.get("/api/uploads/:filename/thumbnail", async (request, reply) => {
        const safeName = basename(request.params.filename);
        const fp = join(config.uploadDir, safeName);
        if (!existsSync(fp) || !statSync(fp).isFile()) {
            return reply.status(404).send({ detail: "File not found" });
        }
        const meta = readMetadata(fp);
        const tn = meta?.thumbnail_name ?? "";
        if (!tn) {
            return reply.status(404).send({ detail: "Thumbnail not found" });
        }
        const tp = join(thumbDir(config.uploadDir), basename(tn));
        if (!existsSync(tp)) {
            return reply.status(404).send({ detail: "Thumbnail not found" });
        }
        return reply.sendFile(basename(tn), thumbDir(config.uploadDir));
    });
    app.get("/api/uploads/:filename", async (request, reply) => {
        const safeName = basename(request.params.filename);
        const fp = join(config.uploadDir, safeName);
        if (!existsSync(fp) || !statSync(fp).isFile()) {
            return reply.status(404).send({ detail: "File not found" });
        }
        return reply.sendFile(safeName, config.uploadDir);
    });
}
//# sourceMappingURL=uploads.js.map