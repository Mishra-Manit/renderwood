export type VideoStyle = "general" | "trailer";

export interface VideoStyleOption {
  value: VideoStyle;
  label: string;
  description: string;
}

export type VideoJobStatus = "complete" | "failed";

export interface VideoCreateRequest {
  prompt: string;
  video_style?: VideoStyle;
}

export interface VideoCreateResponse {
  job_id: string;
  status: VideoJobStatus;
  output_path?: string | null;
  job_project_path?: string | null;
  error?: string | null;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  description: string;
  uploaded_at: string;
  has_thumbnail: boolean;
}
