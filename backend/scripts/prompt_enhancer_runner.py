"""Run the prompt enhancer with a hardcoded prompt."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.agent.prompt_enhancer import enhance_prompt

HARDCODED_PROMPT = """Create a hype trailer video for a new CLI tool named 'opencode'
releasing soon. Its a product that is an open source competitor to
Claude Code."""


async def run_enhancer(prompt: str = HARDCODED_PROMPT) -> str:
    """Return the enhanced prompt for the provided input."""
    return await enhance_prompt(prompt)


def main() -> None:
    result = asyncio.run(run_enhancer())
    print(result)


if __name__ == "__main__":
    main()
