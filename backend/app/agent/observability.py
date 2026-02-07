"""Observability configuration for Claude Agent SDK using Logfire.

This module provides centralized configuration for tracing and monitoring
Claude Agent SDK operations using Pydantic Logfire and OpenTelemetry.
"""

from __future__ import annotations

import os
import json
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import logfire as LogfireType

# Environment variables for OpenTelemetry integration
# These configure LangSmith to send traces to Logfire via OpenTelemetry
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
    """Configure Logfire observability for Claude Agent SDK.

    This function sets up comprehensive tracing for Claude Agent SDK operations,
    including all LLM calls, tool executions, and agent interactions.

    Args:
        service_name: Name of the service for trace identification
        environment: Environment name (e.g., "production", "development")
        console: Whether to also log to console (default: True)

    Returns:
        Configured Logfire instance

    Example:
        >>> from app.agent.observability import configure_observability
        >>> logfire = configure_observability(
        ...     service_name="my-agent",
        ...     environment="production"
        ... )
    """
    try:
        import logfire
        from langsmith.integrations.claude_agent_sdk import configure_claude_agent_sdk
    except ImportError as e:
        raise ImportError(
            "Missing required packages for observability. "
            "Install with: pip install logfire 'langsmith[claude-agent-sdk,otel]'"
        ) from e

    # Set OpenTelemetry environment variables
    for key, value in _OTEL_ENV_VARS.items():
        if key == "LANGSMITH_OTEL_ONLY":
            os.environ[key] = "true" if otel_only else "false"
        else:
            os.environ[key] = value

    # Configure Logfire
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

    # Instrument Claude Agent SDK with OpenTelemetry
    configure_claude_agent_sdk()
    _patch_langsmith_usage_metadata()

    return logfire


def get_logfire() -> Any:
    """Get the configured Logfire instance.

    This is a convenience function to import logfire after configuration.

    Returns:
        Configured Logfire instance

    Raises:
        RuntimeError: If logfire is not installed or not configured

    Example:
        >>> from app.agent.observability import get_logfire
        >>> logfire = get_logfire()
        >>> logfire.info("Agent started", job_id="abc123")
    """
    try:
        import logfire

        return logfire
    except ImportError as e:
        raise RuntimeError(
            "Logfire not installed. Install with: pip install logfire"
        ) from e


def _patch_langsmith_usage_metadata() -> None:
    """Flatten usage metadata to OpenTelemetry-safe attributes."""
    try:
        from langsmith.integrations.claude_agent_sdk import _client as ls_client
    except ImportError:
        return

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
