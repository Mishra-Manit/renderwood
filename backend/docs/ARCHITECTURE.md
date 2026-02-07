# Observability Architecture

This document describes the observability stack, data flow, and core integration points.

## Stack Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       Your Application                        │
│                                                              │
│  app/agent/orchestrator.py                                   │
│   - creates root span: remotion_video_generation             │
│   - logs agent turns, tool calls, and results                │
│                                                              │
│  app/agent/observability.py                                  │
│   - sets OTEL env vars                                       │
│   - logfire.configure()                                      │
│   - configure_claude_agent_sdk()                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ OpenTelemetry Protocol (OTLP)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                          Logfire                              │
│   - trace storage and visualization                           │
│   - SQL querying                                               │
│   - real-time monitoring                                       │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### Startup

1. `configure_observability()` sets OpenTelemetry env vars.
2. `logfire.configure()` initializes the Logfire client.
3. `configure_claude_agent_sdk()` instruments the Claude SDK.

### Request Execution

1. `run(job_id, prompt)` creates the root span: `remotion_video_generation`.
2. The agent runs with `ClaudeSDKClient`.
3. Agent messages and tool calls are logged as structured events.
4. OTLP exports traces to Logfire.

## Trace Hierarchy (Example)

```
remotion_video_generation [root span]
├── setup_job_directory [span]
│   └── job_directory_created [log]
├── agent_execution [span]
│   ├── agent_turn_1 [span]
│   │   ├── agent_text [log]
│   │   ├── agent_thinking [log]
│   │   └── tool_call [log]
│   ├── agent_turn_2 [span]
│   │   └── tool_result [log]
│   └── agent_execution_complete [log]
└── video_generation_complete [log]
```

## Integration Points

- `app/agent/observability.py` configures Logfire and OTEL.
- `app/agent/orchestrator.py` creates spans and logs per agent turn.
- The Claude SDK instrumentation auto-traces LLM calls.

## Key Files

| File | Purpose |
|------|---------|
| `app/agent/observability.py` | Centralized Logfire configuration |
| `app/agent/orchestrator.py` | Root span, agent turn logging |
| `app/config.py` | Environment settings |
| `requirements.txt` | Observability dependencies |

## Dependencies

Direct:
- `logfire>=4.22.0`
- `langsmith[claude-agent-sdk,otel]>=0.6.9`

Transitive:
- `opentelemetry-api`
- `opentelemetry-sdk`
- `opentelemetry-exporter-otlp`
