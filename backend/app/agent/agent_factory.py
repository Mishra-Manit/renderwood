"""Shared agent factory for prompt enhancement."""

from __future__ import annotations

from pydantic_ai import Agent  # type: ignore[import-not-found]
from pydantic_ai.models.openai import OpenAIModel  # type: ignore[import-not-found]
from pydantic_ai.providers.fireworks import (  # type: ignore[import-not-found]
    FireworksProvider,
)

from app.agent.video_styles import VideoStyle, get_style_config
from app.config import settings

_FIREWORKS_MODEL = OpenAIModel(
    settings.fireworks_model,
    provider=FireworksProvider(api_key=settings.fireworks_api_key),
)

_AGENT_CACHE: dict[tuple[VideoStyle, str], Agent[None, str]] = {}


def get_prompt_enhancer_agent(
    style: VideoStyle,
    base_system_prompt: str,
) -> Agent[None, str]:
    """Return (or create) a cached prompt enhancer Agent for the given style."""
    cache_key = (style, base_system_prompt)
    if cache_key not in _AGENT_CACHE:
        config = get_style_config(style)
        system_prompt = base_system_prompt
        if config.system_prompt_addendum:
            system_prompt = f"{base_system_prompt}\n\n{config.system_prompt_addendum}"
        _AGENT_CACHE[cache_key] = Agent(
            _FIREWORKS_MODEL,
            system_prompt=system_prompt,
            output_type=str,
        )
    return _AGENT_CACHE[cache_key]
