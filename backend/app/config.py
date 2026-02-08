"""Application configuration loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings


_BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # Anthropic
    anthropic_api_key: str = ""

    # Fireworks (prompt enhancement)
    fireworks_api_key: str = ""
    fireworks_model: str = "accounts/fireworks/models/kimi-k2p5"

    # Environment
    environment: str = "development"

    # Paths
    remotion_project_path: Path = _BACKEND_DIR / "remotion_project"
    remotion_jobs_path: Path = _BACKEND_DIR / "remotion_jobs"
    upload_dir: Path = _BACKEND_DIR / "uploads"
    output_dir: Path = _BACKEND_DIR / "final_vids"

    # Rendering
    max_render_timeout: int = 600
    claude_model: str = "claude-sonnet-4-5"
    default_fps: int = 30
    default_width: int = 1920
    default_height: int = 1080

    model_config = {
        "env_file": _BACKEND_DIR / ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
