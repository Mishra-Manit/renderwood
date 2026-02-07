# Backend Observability Guide

This backend uses Pydantic Logfire with OpenTelemetry to trace Claude Agent SDK runs end to end.
The goal is to capture full prompts, tool calls, and results without truncation, and to make
debugging and performance analysis queryable.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
logfire auth
uvicorn app.main:app --reload
```

Make a request and look for the Logfire URL in the console:

```
Logfire project URL: https://logfire.pydantic.dev/<your_username>/renderwood-agent
```

## What Gets Captured

- Root span for each job: `remotion_video_generation` with `job_id` and `user_prompt`
- Agent turns with full text and thinking content
- Tool calls and tool results with full inputs/outputs
- Output validation and error events

## Configuration

### Environment Variables

`logfire auth` stores your token in `~/.logfire/token` and sets `LOGFIRE_TOKEN` for you.

```bash
LOGFIRE_TOKEN=...                 # required (set by logfire auth)
LOGFIRE_SERVICE_NAME=renderwood-agent
LOGFIRE_ENVIRONMENT=production
ENVIRONMENT=production            # app config for environment
```

### Programmatic Configuration

```python
from app.agent.observability import configure_observability

configure_observability(
    service_name="renderwood-agent",
    environment="production",
    console=True,
)
```

To disable console output:

```python
configure_observability(console=False)
```

## Querying Traces (Logfire -> Explore)

```sql
-- Slow jobs
SELECT
  attributes->>'job_id' AS job_id,
  extract(epoch FROM (end_timestamp - start_timestamp)) AS seconds
FROM records
WHERE message = 'remotion_video_generation'
ORDER BY seconds DESC
LIMIT 20;

-- Tool usage
SELECT
  attributes->>'tool_name' AS tool,
  count(*) AS calls
FROM records
WHERE message = 'tool_call'
GROUP BY tool
ORDER BY calls DESC;

-- Errors
SELECT *
FROM records
WHERE level = 'error'
ORDER BY start_timestamp DESC;

-- A specific job
SELECT *
FROM records
WHERE attributes->>'job_id' = 'abc123'
ORDER BY start_timestamp;
```

## Troubleshooting

### Import errors

```bash
pip install -r requirements.txt
```

### Authentication errors

```bash
logfire auth
```

### No traces appearing

1. Check that the Logfire URL prints on startup.
2. Verify the token exists at `~/.logfire/token`.
3. Confirm OpenTelemetry flags are set:

```bash
python -c "import os; print(os.environ.get('LANGSMITH_OTEL_ENABLED'))"
```

### Missing ClaudeSDKClient

```bash
pip install --upgrade claude-agent-sdk
```

## Performance and Security

- Typical overhead is a few milliseconds per operation.
- Data is sent asynchronously over HTTPS.
- Do not log PII or secrets in attributes unless required.

## Architecture

See `ARCHITECTURE.md` for the stack diagram, data flow, and integration points.

## External References

- Logfire docs: https://logfire.pydantic.dev/
- Claude Agent SDK docs: https://docs.claude.com/docs/en/agent-sdk/python
