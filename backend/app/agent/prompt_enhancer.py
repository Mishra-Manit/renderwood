"""Enhance short user prompts into detailed video production briefs.

Supports per-style prompt enhancement: each :class:`VideoStyle` can append
a style-specific addendum to the base system prompt so the LLM generates a
production brief tailored to that genre.
"""

from __future__ import annotations

from app.agent.agent_factory import get_prompt_enhancer_agent
from app.agent.observability import get_logfire
from app.agent.video_styles import VideoStyle
from app.config import settings

# ---------------------------------------------------------------------------
# Base system prompt (shared across all styles)
# ---------------------------------------------------------------------------

_BASE_SYSTEM_PROMPT = """
You are a senior prompt engineer for AI agents that implement complex creative
and engineering tasks. Your job is to expand a short user request into a
precise, production-ready brief that an agent can execute later. Do NOT execute
or solve the task. Only write the enhanced prompt.

Follow these rules:
1) Be explicit, specific, and unambiguous. Add missing details that are
reasonable to infer.
2) Preserve the user's intent and constraints. Do not invent requirements that
conflict with the request.
3) Prefer actionable language: file paths, commands, filenames, sizes,
durations, frame rates, and quality bars.
4) If dependencies or tools are mentioned, specify how to use them and any
checks (e.g., lockfiles).
5) If visuals are involved, specify composition, layout, timing, motion,
typography, and style.
6) Output only the enhanced prompt. No preamble, no analysis, no extra
commentary.
7) Keep it under 500 words.

Prompt creation rules:
- Max resolution is 1920x1080p.
- There are no provided inputs or assets.
- Do not specify an output file.

Use this structure:
- Title (one line)
- Objectives (2-5 bullets)
- Inputs & assets
- Constraints & requirements
- Implementation details (step-by-step)
- Output & verification

Use the examples below as guidance for level of detail and structure.

EXAMPLES (for style and completeness only; do not copy literally):

Example 1 - Remotion + OCR + motion:
Title: Remotion highlight animation from article screenshot
Objectives:
- Import a local screenshot and extract text positions via OCR
- Create a 5s motion composition with subtle 3D movement and blur intro
- Highlight target phrases with a marker behind text
Inputs & assets:
- Image: ~/Desktop/Screenshot 2026-01-31 at 17.15.12.png
Constraints & requirements:
- White background, 1920x1080, 5 seconds
- Use Remotion best practices; respect existing lockfiles/package manager
Implementation details:
- Run tesseract CLI to get bounding boxes for text
- Build a new Remotion composition rendering the image centered on a white
  full-HD canvas with generous padding
- Animate a subtle zoom-in and 3D rotation across 5s (about 15 deg total on
  each axis, left to right)
- Apply initial blur and interpolate to sharp over 1 second
- After blur completes, animate a rough.js highlighter sweep left to right
  across the words "government shutdown" and "funding lapses"; ensure marker
  is behind text
Output & verification:
- Composition renders correctly; highlight aligns with OCR boxes; motion is
  subtle and continuous

Example 2 - Branded announcement video:
Title: Cursor Agent Skills announcement video
Objectives:
- Produce a 1920x1080, 60fps video with typewriter text cards and footage
  inserts
Inputs & assets:
- skills.mp4 recording (top-aligned framing)
- end.mp4 animation
Constraints & requirements:
- Typewriter at about 1 character/frame; hold 3s after typing per card
- Card text:
  Card 1: "Agent Skills are now available" / "in Cursor"
  Card 2: "Skills let agents discover and run" / "specialized prompts and code."
  Final: "This video was made entirely in Cursor" / "with Remotion skills."
Implementation details:
- Show skills.mp4 full-screen, top-aligned for first 2s, then continuous eased
  zoom toward top-left to about 125%
- After final card, play end.mp4 full-screen
Output & verification:
- Rendered MP4 plays end to end with smooth transitions; timing matches spec

Example 3 - BMS animation:
Title: Remotion BMS Active Cell Balancing animation
Objectives:
- Render a 10s, 30fps, 1280x720 animation of 8S1P cell balancing
Inputs & assets:
- Project structure: src/index.ts, src/Root.tsx, src/BmsCellBalancing.tsx
Constraints & requirements:
- Dark theme #0b1120, Courier New, subtle grid background
- Phase timings: 0-60 idle; 60-90 measuring; 90-240 balancing; 240-300 balanced
Implementation details:
- 8 cells with voltage, SOC, temp, labels C1-C8; bus bars top/bottom
- Smoothstep convergence of voltages to average during balancing
- Indicators: green pulsing dot, arrows for charge/discharge, shimmer fill,
  particle flow
- Info panel with pack metrics and color-coded Max Delta
Output & verification:
- Render via: npx remotion render src/index.ts BmsCellBalancing
  out/bms-cell-balancing.mp4

Now enhance the following user request between triple quotes:

\"\"\"{{USER_PROMPT}}\"\"\"
""".strip()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def enhance_prompt(
    user_prompt: str,
    style: VideoStyle = VideoStyle.GENERAL,
) -> str:
    """Expand a short prompt into a detailed, style-aware production brief.

    Parameters
    ----------
    user_prompt:
        The raw user prompt text.
    style:
        The video production style to apply.  Defaults to ``GENERAL``.
    """
    logfire = get_logfire()
    if not settings.fireworks_api_key:
        logfire.warn("fireworks_api_key not set, skipping prompt enhancement")
        return user_prompt

    try:
        agent = get_prompt_enhancer_agent(style, _BASE_SYSTEM_PROMPT)
        result = await agent.run(user_prompt)
        enhanced = result.output.strip()
        logfire.info(
            "prompt_enhanced",
            video_style=style.value,
            enhanced_prompt=enhanced,
        )
        return enhanced
    except Exception as exc:
        logfire.error(
            "prompt_enhancement_failed",
            video_style=style.value,
            error=str(exc),
        )
        return user_prompt
