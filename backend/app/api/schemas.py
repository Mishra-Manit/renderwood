"""Pydantic schemas for minimal v1 endpoints."""

from pydantic import BaseModel, Field

from app.agent.video_styles import VideoStyle


class VideoCreateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    video_style: VideoStyle = Field(
        default=VideoStyle.GENERAL,
        description="The video production style to apply during prompt enhancement.",
    )


class VideoCreateResponse(BaseModel):
    job_id: str
    status: str
    output_path: str | None = None
    job_project_path: str | None = None
    error: str | None = None
