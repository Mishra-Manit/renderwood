import { z } from "zod";
import { VideoStyle } from "./agent/video-styles.js";
export const videoCreateRequestSchema = z.object({
    prompt: z.string().min(1),
    video_style: z.nativeEnum(VideoStyle).default(VideoStyle.GENERAL),
});
export const videoCreateResponseSchema = z.object({
    job_id: z.string(),
    status: z.string(),
    output_path: z.string().optional(),
    job_project_path: z.string().optional(),
    error: z.string().optional(),
});
export const uploadedFileInfoSchema = z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    description: z.string(),
    uploaded_at: z.string(),
    has_thumbnail: z.boolean(),
});
//# sourceMappingURL=schemas.js.map