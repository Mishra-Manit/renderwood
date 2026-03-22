declare function loadConfig(): {
    remotionProjectPath: string;
    remotionJobsPath: string;
    uploadDir: string;
    outputDir: string;
    anthropicApiKey: string;
    fireworksApiKey: string;
    fireworksModel: string;
    environment: string;
    maxRenderTimeout: number;
    claudeCodePath: string;
    claudeModel: string;
    defaultFps: number;
    defaultWidth: number;
    defaultHeight: number;
};
export type Config = ReturnType<typeof loadConfig>;
export declare const config: {
    remotionProjectPath: string;
    remotionJobsPath: string;
    uploadDir: string;
    outputDir: string;
    anthropicApiKey: string;
    fireworksApiKey: string;
    fireworksModel: string;
    environment: string;
    maxRenderTimeout: number;
    claudeCodePath: string;
    claudeModel: string;
    defaultFps: number;
    defaultWidth: number;
    defaultHeight: number;
};
export {};
//# sourceMappingURL=config.d.ts.map