"""Video creation routes for Remotion agent rendering."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.agent import orchestrator
from app.agent.job_ids import next_job_id
from app.agent.observability import get_logfire
from app.agent.video_styles import list_styles
from app.api.schemas import VideoCreateRequest, VideoCreateResponse
from app.config import settings

router = APIRouter(tags=["videos"])


@router.get("/video-styles")
async def get_video_styles():
    """Return the list of available video production styles."""
    return list_styles()


@router.post("/videos/create", response_model=VideoCreateResponse)
async def create_video(request: VideoCreateRequest):
    """Render a Remotion video from a prompt."""
    logfire = get_logfire()
    job_id = next_job_id(settings.remotion_jobs_path)

    try:
        result = await orchestrator.run(
            job_id,
            request.prompt,
            video_style=request.video_style,
        )

        if not result or not result.get("output_path"):
            raise RuntimeError("Agent execution returned no output")

    except Exception as exc:
        logfire.error(
            "video_creation_failed",
            job_id=job_id,
            error=str(exc),
            error_type=type(exc).__name__,
        )
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
    video_path = settings.output_dir / f"{job_id}.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(video_path)
