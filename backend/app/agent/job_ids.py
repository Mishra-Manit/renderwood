"""Helpers for Remotion job identifiers."""

from __future__ import annotations

from pathlib import Path


def next_job_id(jobs_path: Path) -> str:
    """Return the next sequential job id in the form run_<n>."""
    if not jobs_path.exists():
        return "run_1"

    max_id = 0
    for path in jobs_path.iterdir():
        if not path.is_dir():
            continue
        if not path.name.startswith("run_"):
            continue
        suffix = path.name[4:]
        if not suffix.isdigit():
            continue
        max_id = max(max_id, int(suffix))

    return f"run_{max_id + 1}"
