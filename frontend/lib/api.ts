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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

export async function createVideo(prompt: string, signal?: AbortSignal): Promise<VideoCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/videos/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt }),
    signal
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

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)

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

export function getVideoUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/video`
}
