"""Renderwood FastAPI application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.observability import configure_observability
from app.api.routes import uploads, videos
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_observability(
        service_name="renderwood-agent",
        environment=settings.environment,
    )
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    settings.remotion_jobs_path.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
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
app.include_router(uploads.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
