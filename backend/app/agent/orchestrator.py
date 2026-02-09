"""Orchestrates Remotion video generation jobs."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    TextBlock,
    ThinkingBlock,
    ToolResultBlock,
    ToolUseBlock,
)

from app.agent.observability import get_logfire
from app.agent.prompt_enhancer import enhance_prompt
from app.agent.prompts import REMOTION_AGENT_SYSTEM_PROMPT
from app.agent.video_styles import VideoStyle
from app.config import settings

async def run(
    job_id: str,
    prompt: str,
    video_style: VideoStyle = VideoStyle.GENERAL,
) -> dict[str, str]:
    """Run a Remotion job and return output paths."""
    logfire = get_logfire()
    with logfire.span(
        "remotion_video_generation",
        job_id=job_id,
        user_prompt=prompt,
        video_style=video_style.value,
    ):
        job_dir, output_dir = _setup_job_directory(job_id)

        enhanced_prompt = await enhance_prompt(prompt, style=video_style)
        agent_prompt = _build_agent_prompt(enhanced_prompt)

        options = _build_agent_options(job_dir)

        job_output_path = await _run_agent(agent_prompt, options, output_dir)

        _validate_output(job_output_path)

        final_output_path = copy_output_to_final(job_output_path, job_id)

        logfire.info(
            "video_generation_complete",
            job_id=job_id,
            output_path=str(final_output_path),
        )

        return {
            "output_path": str(final_output_path),
            "job_project_path": str(job_dir),
        }


def _setup_job_directory(job_id: str) -> tuple[Path, Path]:
    """Create the job directory and output folder."""
    logfire = get_logfire()
    with logfire.span("setup_job_directory", job_id=job_id):
        job_dir = settings.remotion_jobs_path / job_id
        output_dir = job_dir / "output"

        shutil.copytree(
            settings.remotion_project_path,
            job_dir,
            symlinks=True,
            dirs_exist_ok=False,
        )

        output_dir.mkdir(parents=True, exist_ok=True)

        logfire.info(
            "job_directory_created",
            job_dir=str(job_dir),
            output_dir=str(output_dir),
        )

        return job_dir, output_dir


def _build_agent_prompt(user_prompt: str) -> str:
    """Construct the agent instruction prompt."""
    return (
        f"User request: {user_prompt}\n\n"
        "The Remotion project is in the current directory. "
        "Edit the source files, then render the video. "
        "The final output file MUST be saved to: output/video.mp4."
    )


def _build_agent_options(job_dir: Path) -> ClaudeAgentOptions:
    """Build agent configuration options."""
    return ClaudeAgentOptions(
        system_prompt=REMOTION_AGENT_SYSTEM_PROMPT,
        setting_sources=["user", "project"],
        allowed_tools=["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        cwd=str(job_dir),
        permission_mode="bypassPermissions",
        max_turns=30,
        model=settings.claude_model,
    )


async def _run_agent(
    prompt: str,
    options: ClaudeAgentOptions,
    output_dir: Path,
) -> Path:
    """Run the agent and return the expected output path."""
    logfire = get_logfire()
    with logfire.span("agent_execution"):
        turn_count = 0
        result_received = False

        # Set the API key in the environment for the SDK
        os.environ["ANTHROPIC_API_KEY"] = settings.anthropic_api_key

        async with ClaudeSDKClient(options=options) as client:
            await client.query(prompt)

            async for message in client.receive_response():
                if result_received:
                    continue

                if isinstance(message, AssistantMessage):
                    turn_count += 1
                    _log_assistant_message(message, turn_count)

                elif isinstance(message, ResultMessage):
                    _handle_result_message(message, turn_count, output_dir)
                    result_received = True

        return output_dir / "video.mp4"


def _log_assistant_message(message: AssistantMessage, turn_count: int) -> None:
    """Log assistant message content blocks."""
    logfire = get_logfire()
    with logfire.span(f"agent_turn_{turn_count}"):
        for block in message.content:
            if isinstance(block, TextBlock):
                logfire.info(
                    "agent_text",
                    turn=turn_count,
                    text=block.text,
                )

            elif isinstance(block, ThinkingBlock):
                logfire.info(
                    "agent_thinking",
                    turn=turn_count,
                    thinking=block.thinking,
                )

            elif isinstance(block, ToolUseBlock):
                logfire.info(
                    "tool_call",
                    turn=turn_count,
                    tool_name=block.name,
                    tool_input=block.input,
                )

            elif isinstance(block, ToolResultBlock):
                logfire.info(
                    "tool_result",
                    turn=turn_count,
                    content=str(block.content),
                    is_error=block.is_error,
                )


def _handle_result_message(
    message: ResultMessage, turn_count: int, output_dir: Path
) -> None:
    """Handle the final result message from the agent."""
    logfire = get_logfire()
    if message.is_error:
        video_exists = (output_dir / "video.mp4").exists()
        logfire.error(
            "agent_execution_failed",
            error=message.result,
            turn_count=turn_count,
            video_already_rendered=video_exists,
        )
        # If the video was already rendered before the error, treat as a
        # warning rather than a hard failure. The agent may have hit an
        # auth/quota error on a final summary turn after rendering.
        if not video_exists:
            raise RuntimeError(f"Agent failed: {message.result}")
        logfire.warn(
            "agent_error_after_render",
            message="Agent reported an error but the video was already rendered. Continuing.",
            error=message.result,
        )
        return

    logfire.info(
        "agent_execution_complete",
        result=message.result,
        turn_count=turn_count,
    )


def _validate_output(output_path: Path) -> None:
    """Validate that the output video was generated."""
    logfire = get_logfire()
    if not output_path.exists():
        logfire.error(
            "output_validation_failed",
            expected_path=str(output_path),
        )
        raise FileNotFoundError(
            f"Agent did not produce output at {output_path}"
        )


def copy_output_to_final(output_path: Path, job_id: str) -> Path:
    """Copy the job output video into the final output directory."""
    logfire = get_logfire()
    final_dir = settings.output_dir
    final_dir.mkdir(parents=True, exist_ok=True)
    final_path = final_dir / f"{job_id}.mp4"
    shutil.copy2(output_path, final_path)
    return final_path
