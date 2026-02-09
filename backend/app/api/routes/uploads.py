"""File upload routes for managing user documents."""

import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["uploads"])


class UploadedFileInfo(BaseModel):
    name: str
    size: int
    type: str
    description: str = ""
    uploaded_at: str = ""


def _metadata_path(file_path: Path) -> Path:
    """Return the sidecar JSON metadata path for a given file."""
    return file_path.parent / f"{file_path.name}.json"


def _write_metadata(file_path: Path, *, original_name: str, description: str) -> dict:
    """Write sidecar JSON metadata for an uploaded file. Returns the metadata dict."""
    mime_type, _ = mimetypes.guess_type(file_path.name)
    metadata = {
        "original_name": original_name,
        "stored_name": file_path.name,
        "description": description,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "size": file_path.stat().st_size,
        "mime_type": mime_type or "application/octet-stream",
    }
    _metadata_path(file_path).write_text(json.dumps(metadata, indent=2))
    return metadata


def _read_metadata(file_path: Path) -> dict | None:
    """Read sidecar JSON metadata for a file, or None if missing."""
    meta_path = _metadata_path(file_path)
    if not meta_path.exists():
        return None
    try:
        return json.loads(meta_path.read_text())
    except (json.JSONDecodeError, OSError):
        return None


def _is_sidecar(path: Path) -> bool:
    """Check if a path is a sidecar metadata file (e.g. 'photo.jpg.json')."""
    return path.suffix == ".json" and (path.parent / path.stem).exists()


@router.get("/uploads", response_model=list[UploadedFileInfo])
async def list_uploads():
    """List all files in the uploads directory."""
    upload_dir = settings.upload_dir
    if not upload_dir.exists():
        return []

    files: list[UploadedFileInfo] = []
    for item in sorted(upload_dir.iterdir()):
        if not item.is_file() or item.name.startswith(".") or _is_sidecar(item):
            continue

        meta = _read_metadata(item)
        mime_type, _ = mimetypes.guess_type(item.name)
        files.append(
            UploadedFileInfo(
                name=item.name,
                size=item.stat().st_size,
                type=mime_type or "application/octet-stream",
                description=meta.get("description", "") if meta else "",
                uploaded_at=meta.get("uploaded_at", "") if meta else "",
            )
        )
    return files


@router.post("/uploads", response_model=UploadedFileInfo)
async def upload_file(file: UploadFile, description: str = Form("")):
    """Upload a file to the uploads directory."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    upload_dir = settings.upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename -- keep only the basename to prevent path traversal
    safe_name = Path(file.filename).name
    dest = upload_dir / safe_name

    # If a file with the same name exists, add a numeric suffix
    counter = 1
    stem = dest.stem
    suffix = dest.suffix
    while dest.exists():
        dest = upload_dir / f"{stem}_{counter}{suffix}"
        counter += 1

    contents = await file.read()
    dest.write_bytes(contents)

    meta = _write_metadata(dest, original_name=safe_name, description=description)

    return UploadedFileInfo(
        name=dest.name,
        size=len(contents),
        type=meta["mime_type"],
        description=meta["description"],
        uploaded_at=meta["uploaded_at"],
    )


@router.delete("/uploads/{filename}")
async def delete_upload(filename: str):
    """Delete a file and its sidecar metadata from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    file_path.unlink()

    meta_path = _metadata_path(file_path)
    if meta_path.exists():
        meta_path.unlink()

    return {"detail": "deleted"}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve/download a file from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
