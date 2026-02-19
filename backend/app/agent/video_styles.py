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

1) **Fast pacing & dynamic editing**: Keep momentum high with rapid cuts and
   energetic transitions. Do not let any single moment linger too long unless
   intentionally used as a dramatic pause before a payoff.
2) **Establish story immediately**: The opening 2-3 seconds must clearly set
   the inciting incident, central conflict, or emotional hook.
3) **Show, don't tell**: Prioritize visual storytelling over exposition.
   Dialogue/text overlays should support key beats, not replace visuals.
4) **Highlight unique strengths**: Identify and foreground what makes the film
   special (action, emotion, spectacle, mystery, character, worldbuilding).
5) **Strategic intentionality**: Every second should have a purpose. Avoid
   filler moments.
6) **Dramatic pacing arc**: Use a clear three-act structure for 15-30 seconds:
   hook (0-3s), escalation (middle), climax + title/tagline (final beat).
7) **Timeline specificity (REQUIRED)**: In Implementation details, provide a
   second-by-second or timestamp-range breakdown for the full runtime. For each
   segment, define: scene content, transition in/out and duration, motion notes,
   text overlays, and key effects.
8) **Transitions (REQUIRED)**: Specify exact transition types and timing between
   scenes (for example hard cut, 0.3s cross-dissolve, 0.2s flash-to-white).
9) **Color treatment (REQUIRED)**: Specify exact CSS filter values for the
   intended cinematic grade (not just mood words).
10) **Letterbox framing**: For cinematic look, specify target ratio and explicit
    top/bottom bar dimensions in pixels (for example 2.39:1 with 140px bars).
11) **Title cards & typography**: Include bold title/tagline cards and specify
    font family + fallback, size range, weight, tracking, color, text shadow,
    and entrance animation style (scale, glitch, fade-through-black, etc.).
    If text is placed over video footage, require large bold typography with a
    clearly visible shadow for legibility.
12) **Rhythm & sync points**: Mark explicit timestamps where visual impacts
    should land on music beats/crescendos (for example 8.0s and 12.0s).
13) **Final beat**: End with a logo/title/tagline reveal that lingers for
    1-2 seconds, then hard cut to black.
14) **Background music (REQUIRED)**: Every trailer MUST include background music.
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
