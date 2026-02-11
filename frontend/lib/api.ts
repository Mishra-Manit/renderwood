// ---------------------------------------------------------------------------
// Video styles
// ---------------------------------------------------------------------------

/** Mirrors the backend `VideoStyle` enum values. */
export type VideoStyle = "general" | "trailer"

export type VideoStyleOption = {
  value: VideoStyle
  label: string
  description: string
}

// ---------------------------------------------------------------------------
// Response / entity types
// ---------------------------------------------------------------------------

export type VideoCreateResponse = {
  job_id: string
  status: string
  output_path?: string | null
  job_project_path?: string | null
  error?: string | null
}

export type UploadedFile = {
  name: string
  size: number
  type: string
  description: string
  uploaded_at: string
  has_thumbnail: boolean
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export async function listVideoStyles(): Promise<VideoStyleOption[]> {
  const response = await fetch(`${API_BASE_URL}/api/video-styles`)
  if (!response.ok) {
    throw new Error(`Failed to fetch video styles (${response.status})`)
  }
  return response.json()
}

export async function createVideo(
  prompt: string,
  videoStyle: VideoStyle = "general",
  signal?: AbortSignal,
): Promise<VideoCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/videos/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, video_style: videoStyle }),
    signal,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(`Video request failed (${response.status}). ${message}`.trim())
  }

  return response.json()
}

export async function listUploads(): Promise<UploadedFile[]> {
  const response = await fetch(`${API_BASE_URL}/api/uploads`)
  if (!response.ok) {
    throw new Error(`Failed to list uploads (${response.status})`)
  }
  return response.json()
}

export async function uploadFile(file: File, description = ""): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("description", description)

  const response = await fetch(`${API_BASE_URL}/api/uploads`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(`Upload failed (${response.status}). ${message}`.trim())
  }

  return response.json()
}

export async function deleteUpload(filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`Delete failed (${response.status})`)
  }
}

export function getUploadUrl(filename: string): string {
  return `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}`
}

export function getUploadThumbnailUrl(filename: string): string {
  return `${API_BASE_URL}/api/uploads/${encodeURIComponent(filename)}/thumbnail`
}

export function getVideoUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/video`
}
