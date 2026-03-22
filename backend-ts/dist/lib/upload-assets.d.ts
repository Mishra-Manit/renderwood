export declare function isSidecar(filePath: string): boolean;
export interface AssetSummary {
    filename: string;
    description: string;
    mime_type: string;
}
export declare function collectAssetSummaries(): AssetSummary[];
export declare function formatAssetsContext(summaries: AssetSummary[]): string;
export declare function copyUploadsToJob(jobDir: string): void;
//# sourceMappingURL=upload-assets.d.ts.map