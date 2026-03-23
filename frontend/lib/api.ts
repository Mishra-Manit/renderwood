import type {
  UploadedFile,
  VideoCreateRequest,
  VideoCreateResponse,
  VideoStyle,
  VideoStyleOption,
} from "@shared/video-contract";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;

    if (json?.detail) {
      return json.detail;
    }
  }

  return (await response.text().catch(() => "")).trim();
}

async function requestJson<T>(
  path: string,
  init: RequestInit | undefined,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message ? `${fallbackError}: ${message}` : fallbackError);
  }

  return (await response.json()) as T;
}

export async function listVideoStyles(): Promise<VideoStyleOption[]> {
  return requestJson<VideoStyleOption[]>(
    "/api/video-styles",
    undefined,
    "Failed to fetch video styles",
  );
}

export async function createVideo(
  prompt: string,
  videoStyle: VideoStyle = "general",
  signal?: AbortSignal,
): Promise<VideoCreateResponse> {
  const payload: VideoCreateRequest = {
    prompt,
    video_style: videoStyle,
  };

  return requestJson<VideoCreateResponse>(
    "/api/videos/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    },
    "Video request failed",
  );
}

export async function listUploads(): Promise<UploadedFile[]> {
  return requestJson<UploadedFile[]>(
    "/api/uploads",
    undefined,
    "Failed to list uploads",
  );
}

export async function uploadFile(
  file: File,
  description = "",
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);

  return requestJson<UploadedFile>(
    "/api/uploads",
    {
      method: "POST",
      body: formData,
    },
    "Upload failed",
  );
}

export async function deleteUpload(filename: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message ? `Delete failed: ${message}` : "Delete failed");
  }
}

export function getUploadUrl(filename: string): string {
  return `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}`;
}

export function getUploadThumbnailUrl(filename: string): string {
  return `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}/thumbnail`;
}

export function getVideoUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/video`;
}

export type {
  UploadedFile,
  VideoCreateResponse,
  VideoStyle,
  VideoStyleOption,
};
