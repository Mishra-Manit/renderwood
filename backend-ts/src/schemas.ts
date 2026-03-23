import { z } from "zod";
import type {
  UploadedFile,
  VideoCreateRequest,
  VideoCreateResponse,
} from "@shared/video-contract";
import { VideoStyle } from "./agent/video-styles.js";

const videoStyleValues = [VideoStyle.GENERAL, VideoStyle.TRAILER] as const;

export const videoCreateRequestSchema: z.ZodType<VideoCreateRequest> = z.object({
  prompt: z.string().min(1),
  video_style: z.enum(videoStyleValues).default(VideoStyle.GENERAL),
});

export const videoCreateResponseSchema: z.ZodType<VideoCreateResponse> = z.object({
  job_id: z.string(),
  status: z.enum(["complete", "failed"]),
  output_path: z.string().nullable().optional(),
  job_project_path: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const uploadedFileInfoSchema: z.ZodType<UploadedFile> = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  description: z.string(),
  uploaded_at: z.string(),
  has_thumbnail: z.boolean(),
});

export type { VideoCreateRequest, VideoCreateResponse, UploadedFile };
