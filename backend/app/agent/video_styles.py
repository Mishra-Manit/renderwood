"""Video style definitions and style-specific prompt enhancement configurations.

Each VideoStyle maps to a distinct prompt engineering strategy that tailors the
enhanced prompt for a particular genre of video output.
"""

from __future__ import annotations

from enum import StrEnum
from typing import NamedTuple


class VideoStyle(StrEnum):
    """Supported video production styles."""

    GENERAL = "general"
    TRAILER = "trailer"


class StyleConfig(NamedTuple):
    """Configuration for a single video style."""

    label: str
    description: str
    system_prompt_addendum: str


# ---------------------------------------------------------------------------
# Style-specific prompt addenda
# ---------------------------------------------------------------------------
# Each addendum is appended to the base enhancer system prompt so the LLM
# generates a production brief tuned for that particular video genre.

_GENERAL_ADDENDUM = ""

_TRAILER_ADDENDUM = """
Additional style directive — **Trailer**:
You are enhancing this prompt for a *cinematic trailer* video.  Ensure the
enhanced brief follows trailer conventions:

1) **Dramatic pacing**: Structure the video with a clear three-act arc —
   opening hook (first 2-3 seconds), rising tension in the middle, and a
   climactic reveal or title card at the end.
2) **Title cards & typography**: Include bold, impactful title cards with
   cinematic fonts (e.g., Bebas Neue, Montserrat Black).  Specify entrance
   animations such as scale-up, glitch, or fade-through-black.
3) **Quick cuts & transitions**: Use rapid scene transitions — hard cuts,
   flash-to-white, or cross-dissolves — to build energy.
4) **Cinematic color grading**: Specify a dramatic color palette (e.g., teal
   and orange, high-contrast desaturated, dark moody tones).
5) **Motion & camera work**: Include camera movements like slow push-ins,
   dramatic zooms, or parallax depth effects on static elements.
6) **Rhythm**: Align visual beats to an implied soundtrack tempo.  Mark beat
   points in the timeline for key visual hits.
7) **Final beat**: End with a logo reveal or tagline card that lingers for
   1-2 seconds before a hard cut to black.
8) **Background music (REQUIRED)**: Every trailer MUST include background music.
   Built-in tracks are available at `public/music/`:
   - `music/dramatic.mp3` — intense cinematic score (default choice)
   - `music/mysterious.mp3` — dark, atmospheric, suspenseful
   - `music/speeding_up_dramatic.mp3` — escalating tempo, great for build-ups
   The enhanced prompt MUST specify which track to use and instruct the agent to
   add an `<Audio>` component with fade-in/fade-out and low volume (0.15–0.3).
   Pick the track that best matches the mood. When in doubt, use `music/dramatic.mp3`.

Keep all other base rules.  The output must still be a single enhanced prompt
(no preamble or commentary).
""".strip()

# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

STYLE_CONFIGS: dict[VideoStyle, StyleConfig] = {
    VideoStyle.GENERAL: StyleConfig(
        label="General",
        description="Default video style — versatile production brief.",
        system_prompt_addendum=_GENERAL_ADDENDUM,
    ),
    VideoStyle.TRAILER: StyleConfig(
        label="Trailer",
        description="Cinematic trailer with dramatic pacing, title cards, and quick cuts.",
        system_prompt_addendum=_TRAILER_ADDENDUM,
    ),
}


def get_style_config(style: VideoStyle) -> StyleConfig:
    """Return the configuration for a given video style."""
    return STYLE_CONFIGS[style]


def list_styles() -> list[dict[str, str]]:
    """Return a serialisable list of all available video styles."""
    return [
        {
            "value": style.value,
            "label": config.label,
            "description": config.description,
        }
        for style, config in STYLE_CONFIGS.items()
    ]
