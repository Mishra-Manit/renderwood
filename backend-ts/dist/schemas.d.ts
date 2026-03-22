import { z } from "zod";
import { VideoStyle } from "./agent/video-styles.js";
export declare const videoCreateRequestSchema: z.ZodObject<{
    prompt: z.ZodString;
    video_style: z.ZodDefault<z.ZodEnum<typeof VideoStyle>>;
}, z.core.$strip>;
export declare const videoCreateResponseSchema: z.ZodObject<{
    job_id: z.ZodString;
    status: z.ZodString;
    output_path: z.ZodOptional<z.ZodString>;
    job_project_path: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const uploadedFileInfoSchema: z.ZodObject<{
    name: z.ZodString;
    size: z.ZodNumber;
    type: z.ZodString;
    description: z.ZodString;
    uploaded_at: z.ZodString;
    has_thumbnail: z.ZodBoolean;
}, z.core.$strip>;
export type VideoCreateRequest = z.infer<typeof videoCreateRequestSchema>;
export type VideoCreateResponse = z.infer<typeof videoCreateResponseSchema>;
export type UploadedFileInfo = z.infer<typeof uploadedFileInfoSchema>;
//# sourceMappingURL=schemas.d.ts.map