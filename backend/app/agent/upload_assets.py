"""Utilities for collecting upload metadata and copying assets into job directories."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from app.config import settings


def _is_sidecar(path: Path) -> bool:
    """Check if a path is a sidecar metadata file (e.g. 'photo.jpg.json')."""
    return path.suffix == ".json" and (path.parent / path.stem).exists()


def collect_asset_summaries() -> list[dict[str, str]]:
    """Read all upload sidecar metadata and return a list of asset summaries."""
    upload_dir = settings.upload_dir
    if not upload_dir.exists():
        return []

    summaries: list[dict[str, str]] = []
    for item in sorted(upload_dir.iterdir()):
        if not item.is_file() or item.name.startswith(".") or _is_sidecar(item):
            continue

        meta_path = upload_dir / f"{item.name}.json"
        description = ""
        mime_type = "application/octet-stream"
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text())
                description = meta.get("description", "")
                mime_type = meta.get("mime_type", mime_type)
            except (json.JSONDecodeError, OSError):
                pass

        summaries.append({
            "filename": item.name,
            "description": description,
            "mime_type": mime_type,
        })

    return summaries


def format_assets_context(summaries: list[dict[str, str]]) -> str:
    """Render asset summaries into a plain-text block for prompt injection."""
    if not summaries:
        return ""

    lines = ["Available uploaded assets:"]
    for asset in summaries:
        desc = asset["description"] or "no description"
        lines.append(f"- {asset['filename']} -- {desc} ({asset['mime_type']})")

    return "\n".join(lines)


def copy_uploads_to_job(job_dir: Path) -> None:
    """Copy all uploaded files (excluding sidecars) into *job_dir*/public/."""
    upload_dir = settings.upload_dir
    if not upload_dir.exists():
        return

    public_dir = job_dir / "public"
    public_dir.mkdir(parents=True, exist_ok=True)

    for item in sorted(upload_dir.iterdir()):
        if not item.is_file() or item.name.startswith(".") or _is_sidecar(item):
            continue
        shutil.copy2(item, public_dir / item.name)
