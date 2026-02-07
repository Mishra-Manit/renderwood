"""Renderwood FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import videos
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    settings.remotion_jobs_path.mkdir(parents=True, exist_ok=True)
    props_dir = settings.remotion_project_path / "props"
    props_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Renderwood",
    description="AI-powered video creation backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
