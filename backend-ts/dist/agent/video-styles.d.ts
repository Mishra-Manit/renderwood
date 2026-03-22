export declare enum VideoStyle {
    GENERAL = "general",
    TRAILER = "trailer"
}
export interface StyleConfig {
    label: string;
    description: string;
    systemPromptAddendum: string;
}
export declare const STYLE_CONFIGS: Record<VideoStyle, StyleConfig>;
export declare function getStyleConfig(style: VideoStyle): StyleConfig;
export declare function listStyles(): Array<{
    value: string;
    label: string;
    description: string;
}>;
//# sourceMappingURL=video-styles.d.ts.map