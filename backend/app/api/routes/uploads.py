"""File upload routes for managing user documents."""

import mimetypes
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["uploads"])


class UploadedFileInfo(BaseModel):
    name: str
    size: int
    type: str


@router.get("/uploads", response_model=list[UploadedFileInfo])
async def list_uploads():
    """List all files in the uploads directory."""
    upload_dir = settings.upload_dir
    if not upload_dir.exists():
        return []

    files: list[UploadedFileInfo] = []
    for item in sorted(upload_dir.iterdir()):
        if item.is_file() and not item.name.startswith("."):
            mime_type, _ = mimetypes.guess_type(item.name)
            files.append(
                UploadedFileInfo(
                    name=item.name,
                    size=item.stat().st_size,
                    type=mime_type or "application/octet-stream",
                )
            )
    return files


@router.post("/uploads", response_model=UploadedFileInfo)
async def upload_file(file: UploadFile):
    """Upload a file to the uploads directory."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    upload_dir = settings.upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename — keep only the basename to prevent path traversal
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

    mime_type, _ = mimetypes.guess_type(dest.name)
    return UploadedFileInfo(
        name=dest.name,
        size=len(contents),
        type=mime_type or "application/octet-stream",
    )


@router.delete("/uploads/{filename}")
async def delete_upload(filename: str):
    """Delete a file from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    file_path.unlink()
    return {"detail": "deleted"}


@router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    """Serve/download a file from the uploads directory."""
    safe_name = Path(filename).name
    file_path = settings.upload_dir / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
