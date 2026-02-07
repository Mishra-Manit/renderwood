"""Remotion integration service for rendering a title slide."""

from __future__ import annotations

import asyncio
from pathlib import Path

from app.config import settings


async def render(job_id: str, props_path: Path) -> Path:
    output_path = settings.output_dir / f"{job_id}.mp4"
    command = [
        "npx",
        "remotion",
        "render",
        "TitleSlide",
        f"--props={props_path}",
        str(output_path),
    ]

    process = await asyncio.create_subprocess_exec(
        *command,
        cwd=str(settings.remotion_project_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=settings.max_render_timeout,
        )
    except asyncio.TimeoutError as exc:
        process.kill()
        await process.wait()
        raise RuntimeError("Remotion render timed out") from exc

    if process.returncode != 0:
        stdout_text = stdout.decode("utf-8", errors="ignore")
        stderr_text = stderr.decode("utf-8", errors="ignore")
        raise RuntimeError(
            "Remotion render failed\n"
            f"stdout:\n{stdout_text}\n"
            f"stderr:\n{stderr_text}"
        )

    return output_path
