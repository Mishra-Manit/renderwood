"""File upload routes for managing user documents."""

import json
import mimetypes
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["uploads"])
THUMB_DIR_NAME = ".thumb"
THUMBNAIL_SEEK_SECONDS = 0.5


class UploadedFileInfo(BaseModel):
    name: str
    size: int
    type: str
    description: str = ""
    uploaded_at: str = ""
    has_thumbnail: bool = False


def _metadata_path(file_path: Path) -> Path:
    """Return the sidecar JSON metadata path for a given file."""
    return file_path.parent / f"{file_path.name}.json"


def _thumb_dir(upload_dir: Path) -> Path:
    """Return the thumbnail directory inside uploads."""
    return upload_dir / THUMB_DIR_NAME


def _thumbnail_path(file_path: Path) -> Path:
    """Return thumbnail path for a given uploaded file."""
    return _thumb_dir(file_path.parent) / f"{file_path.name}.jpg"


def _write_metadata(
    file_path: Path, *, original_name: str, description: str, thumbnail_name: str = ""
) -> dict:
    """Write sidecar JSON metadata for an uploaded file. Returns the metadata dict."""
    mime_type, _ = mimetypes.guess_type(file_path.name)
    metadata = {
        "original_name": original_name,
        "stored_name": file_path.name,
        "description": description,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "size": file_path.stat().st_size,
        "mime_type": mime_type or "application/octet-stream",
        "thumbnail_name": thumbnail_name,
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


def _has_thumbnail(file_path: Path, meta: dict | None) -> bool:
    """Check whether a file has a valid generated thumbnail."""
    if not meta:
        return False
    thumbnail_name = meta.get("thumbnail_name", "")
    if not thumbnail_name:
        return False
    return (_thumb_dir(file_path.parent) / Path(thumbnail_name).name).exists()


def _generate_video_thumbnail(file_path: Path, mime_type: str) -> str:
    """Generate thumbnail at 0.5s for video files. Returns thumbnail filename."""
    if not mime_type.startswith("video/"):
        return ""

    thumbnail_path = _thumbnail_path(file_path)
    thumbnail_path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg",
        "-y",
        "-ss",
        str(THUMBNAIL_SEEK_SECONDS),
        "-i",
        str(file_path),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        str(thumbnail_path),
    ]
    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.SubprocessError):
        return ""

    return thumbnail_path.name if thumbnail_path.exists() else ""


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
                has_thumbnail=_has_thumbnail(item, meta),
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

    mime_type = mimetypes.guess_type(dest.name)[0] or "application/octet-stream"
    thumbnail_name = _generate_video_thumbnail(dest, mime_type)
    meta = _write_metadata(
        dest,
        original_name=safe_name,
        description=description,
        thumbnail_name=thumbnail_name,
    )

    return UploadedFileInfo(
        name=dest.name,
        size=len(contents),
        type=meta["mime_type"],
        description=meta["description"],
        uploaded_at=meta["uploaded_at"],
        has_thumbnail=bool(meta.get("thumbnail_name")),
    )


@router.delete("/uploads/{filename}")
async def delete_upload(filename: str):
    """Delete a file and its sidecar metadata from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    meta = _read_metadata(file_path)
    thumbnail_name = meta.get("thumbnail_name", "") if meta else ""
    file_path.unlink()

    meta_path = _metadata_path(file_path)
    if meta_path.exists():
        meta_path.unlink()

    if thumbnail_name:
        thumbnail_path = _thumb_dir(settings.upload_dir) / Path(thumbnail_name).name
        if thumbnail_path.exists():
            thumbnail_path.unlink()

    return {"detail": "deleted"}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve/download a file from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.get("/uploads/{filename}/thumbnail")
async def serve_upload_thumbnail(filename: str):
    """Serve generated thumbnail for an uploaded video."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    meta = _read_metadata(file_path)
    thumbnail_name = meta.get("thumbnail_name", "") if meta else ""
    if not thumbnail_name:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    thumbnail_path = _thumb_dir(settings.upload_dir) / Path(thumbnail_name).name
    if not thumbnail_path.exists() or not thumbnail_path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(thumbnail_path)
