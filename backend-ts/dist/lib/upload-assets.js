import { existsSync, readdirSync, readFileSync, statSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";
export function isSidecar(filePath) {
    if (!filePath.endsWith(".json"))
        return false;
    const described = filePath.slice(0, -5); // strip ".json"
    return existsSync(described);
}
function isHiddenOrSidecar(dir, name) {
    return name.startsWith(".") || isSidecar(join(dir, name));
}
export function collectAssetSummaries() {
    const dir = config.uploadDir;
    if (!existsSync(dir))
        return [];
    const entries = readdirSync(dir).sort();
    const summaries = [];
    for (const name of entries) {
        const fullPath = join(dir, name);
        const stat = statSync(fullPath, { throwIfNoEntry: false });
        if (!stat?.isFile() || isHiddenOrSidecar(dir, name))
            continue;
        let description = "";
        let mime_type = "application/octet-stream";
        const metaPath = `${fullPath}.json`;
        if (existsSync(metaPath)) {
            try {
                const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
                description = meta.description ?? "";
                mime_type = meta.mime_type ?? mime_type;
            }
            catch {
                // ignore bad JSON
            }
        }
        summaries.push({ filename: name, description, mime_type });
    }
    return summaries;
}
export function formatAssetsContext(summaries) {
    if (summaries.length === 0)
        return "";
    const lines = ["Available uploaded assets:"];
    for (const a of summaries) {
        const desc = a.description || "no description";
        lines.push(`- ${a.filename} -- ${desc} (${a.mime_type})`);
    }
    return lines.join("\n");
}
export function copyUploadsToJob(jobDir) {
    const dir = config.uploadDir;
    if (!existsSync(dir))
        return;
    const publicDir = join(jobDir, "public");
    mkdirSync(publicDir, { recursive: true });
    const entries = readdirSync(dir).sort();
    for (const name of entries) {
        const fullPath = join(dir, name);
        const stat = statSync(fullPath, { throwIfNoEntry: false });
        if (!stat?.isFile() || isHiddenOrSidecar(dir, name))
            continue;
        copyFileSync(fullPath, join(publicDir, name));
    }
}
//# sourceMappingURL=upload-assets.js.map