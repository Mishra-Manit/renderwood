"""Logfire observability setup for Claude Agent SDK."""

from __future__ import annotations

import json
import os
from typing import Any

from app.config import settings
import logfire  # type: ignore[import-not-found]
from langsmith.integrations.claude_agent_sdk import (  # type: ignore[import-not-found]
    _client as ls_client,
    configure_claude_agent_sdk,
)


_OTEL_ENV_VARS = {
    "LANGSMITH_OTEL_ENABLED": "true",
    "LANGSMITH_OTEL_ONLY": "true",
    "LANGSMITH_TRACING": "true",
}


def configure_observability(
    *,
    service_name: str = "renderwood-agent",
    environment: str | None = None,
    console: bool = True,
    otel_only: bool = True,
) -> Any:
    """Configure Logfire observability for the agent."""
    for key, value in _OTEL_ENV_VARS.items():
        if key == "LANGSMITH_OTEL_ONLY":
            os.environ[key] = "true" if otel_only else "false"
        else:
            os.environ[key] = value

    logfire.configure(
        service_name=service_name,
        environment=environment,
        console=logfire.ConsoleOptions(
            min_log_level="info",
            verbose=False,
        )
        if console
        else False,
    )

    logfire.instrument_pydantic_ai()
    logfire.instrument_anthropic()
    configure_claude_agent_sdk()
    _patch_langsmith_usage_metadata()

    return logfire


def get_logfire() -> Any:
    """Return a configured Logfire instance."""
    return logfire


def _patch_langsmith_usage_metadata() -> None:
    """Flatten usage metadata to OpenTelemetry-safe attributes."""
    if getattr(ls_client.TurnLifecycle, "_renderwood_usage_patched", False):
        return

    def flatten(prefix: str, value: Any, out: dict[str, Any]) -> None:
        if value is None:
            return
        if isinstance(value, dict):
            for key, nested in value.items():
                next_prefix = f"{prefix}_{key}" if prefix else str(key)
                flatten(next_prefix, nested, out)
            return
        if isinstance(value, (list, tuple)):
            if all(isinstance(item, (str, int, float, bool, bytes)) for item in value):
                out[prefix] = list(value)
            else:
                out[prefix] = json.dumps(value, default=str)
            return
        if isinstance(value, (str, int, float, bool, bytes)):
            out[prefix] = value
            return
        out[prefix] = str(value)

    def patched_add_usage(self: Any, metrics: dict[str, Any]) -> None:
        if not (self.current_run and metrics):
            return
        flattened: dict[str, Any] = {}
        flatten("usage", metrics, flattened)
        if not flattened:
            return
        metadata = self.current_run.extra.get("metadata") or {}
        self.current_run.extra["metadata"] = {**metadata, **flattened}

    ls_client.TurnLifecycle.add_usage = patched_add_usage
    setattr(ls_client.TurnLifecycle, "_renderwood_usage_patched", True)
