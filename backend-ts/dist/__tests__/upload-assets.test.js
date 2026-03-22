import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";
import { isSidecar, collectAssetSummaries, formatAssetsContext, copyUploadsToJob, } from "../lib/upload-assets.js";
const TEST_UPLOAD_DIR = config.uploadDir;
const TEST_JOB_DIR = join(config.remotionJobsPath, "__test_job__");
function setup() {
    mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
}
function teardown() {
    if (existsSync(TEST_UPLOAD_DIR))
        rmSync(TEST_UPLOAD_DIR, { recursive: true });
    if (existsSync(TEST_JOB_DIR))
        rmSync(TEST_JOB_DIR, { recursive: true });
}
describe("upload-assets", () => {
    beforeEach(() => {
        teardown();
        setup();
    });
    afterEach(teardown);
    describe("isSidecar", () => {
        it("returns true for .json file whose described file exists", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, "photo.jpg"), "img");
            writeFileSync(join(TEST_UPLOAD_DIR, "photo.jpg.json"), "{}");
            expect(isSidecar(join(TEST_UPLOAD_DIR, "photo.jpg.json"))).toBe(true);
        });
        it("returns false for .json file without corresponding file", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, "orphan.json"), "{}");
            expect(isSidecar(join(TEST_UPLOAD_DIR, "orphan.json"))).toBe(false);
        });
        it("returns false for non-json files", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, "photo.jpg"), "img");
            expect(isSidecar(join(TEST_UPLOAD_DIR, "photo.jpg"))).toBe(false);
        });
    });
    describe("collectAssetSummaries", () => {
        it("returns empty array for empty dir", () => {
            expect(collectAssetSummaries()).toEqual([]);
        });
        it("skips dotfiles and sidecars", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, ".hidden"), "x");
            writeFileSync(join(TEST_UPLOAD_DIR, "real.txt"), "hello");
            writeFileSync(join(TEST_UPLOAD_DIR, "real.txt.json"), JSON.stringify({
                description: "A real file",
                mime_type: "text/plain",
            }));
            const summaries = collectAssetSummaries();
            expect(summaries).toHaveLength(1);
            expect(summaries[0].filename).toBe("real.txt");
            expect(summaries[0].description).toBe("A real file");
            expect(summaries[0].mime_type).toBe("text/plain");
        });
        it("uses defaults when no sidecar exists", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, "bare.bin"), "data");
            const summaries = collectAssetSummaries();
            expect(summaries[0].description).toBe("");
            expect(summaries[0].mime_type).toBe("application/octet-stream");
        });
    });
    describe("formatAssetsContext", () => {
        it("returns empty string for no summaries", () => {
            expect(formatAssetsContext([])).toBe("");
        });
        it("formats summaries correctly", () => {
            const result = formatAssetsContext([
                { filename: "img.png", description: "a logo", mime_type: "image/png" },
            ]);
            expect(result).toContain("Available uploaded assets:");
            expect(result).toContain("- img.png -- a logo (image/png)");
        });
        it("uses 'no description' for empty descriptions", () => {
            const result = formatAssetsContext([
                { filename: "x.bin", description: "", mime_type: "application/octet-stream" },
            ]);
            expect(result).toContain("-- no description (");
        });
    });
    describe("copyUploadsToJob", () => {
        it("copies non-sidecar files to job public dir", () => {
            writeFileSync(join(TEST_UPLOAD_DIR, "asset.png"), "imgdata");
            writeFileSync(join(TEST_UPLOAD_DIR, "asset.png.json"), "{}");
            writeFileSync(join(TEST_UPLOAD_DIR, ".hidden"), "x");
            mkdirSync(TEST_JOB_DIR, { recursive: true });
            copyUploadsToJob(TEST_JOB_DIR);
            expect(existsSync(join(TEST_JOB_DIR, "public", "asset.png"))).toBe(true);
            expect(existsSync(join(TEST_JOB_DIR, "public", "asset.png.json"))).toBe(false);
            expect(existsSync(join(TEST_JOB_DIR, "public", ".hidden"))).toBe(false);
        });
    });
});
//# sourceMappingURL=upload-assets.test.js.map