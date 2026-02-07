"""Video creation routes for Remotion agent rendering."""

from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.agent import orchestrator
from app.api.schemas import VideoCreateRequest, VideoCreateResponse
from app.config import settings

router = APIRouter(tags=["videos"])


@router.post("/videos/create", response_model=VideoCreateResponse)
async def create_video(request: VideoCreateRequest):
    """Render a Remotion video from a prompt."""
    job_id = uuid4().hex[:12]
    try:
        result = await orchestrator.run(job_id, request.prompt)
    except Exception as exc:
        return VideoCreateResponse(
            job_id=job_id,
            status="failed",
            error=str(exc),
        )

    return VideoCreateResponse(
        job_id=job_id,
        status="complete",
        output_path=result["output_path"],
        job_project_path=result["job_project_path"],
    )


@router.get("/jobs/{job_id}/video")
async def download_video(job_id: str):
    """Download the rendered video file."""
    video_path = settings.remotion_jobs_path / job_id / "output" / "video.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(video_path)
