"""Pydantic schemas for minimal v1 endpoints."""

from pydantic import BaseModel, Field


class VideoCreateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class VideoCreateResponse(BaseModel):
    job_id: str
    status: str
    output_path: str | None = None
    job_project_path: str | None = None
    error: str | None = None
