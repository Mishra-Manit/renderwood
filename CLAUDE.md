# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Renderwood is an AI-powered video creation platform that uses Claude Agent SDK to generate Remotion (React-based) videos. The system consists of:

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS (Windows 95-styled UI)
- **Backend**: FastAPI + Claude Agent SDK + Remotion rendering
- **Agent**: Claude Sonnet 4.5 orchestrates video generation with full observability via Logfire

## Architecture

### Request Flow

1. User submits prompt via frontend (optionally selects video style)
2. Frontend calls `/api/videos/create` with prompt and style
3. Backend enhances prompt using Fireworks AI (Kimi model)
4. Agent SDK creates isolated job directory from `remotion_project` template
5. Agent edits Remotion React components and renders video
6. Video output copied to `backend/final_vids/` and served to frontend

### Key Directories

```
renderwood/
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/ui/    # shadcn/ui components
│   ├── lib/api.ts        # Backend API client
│   └── hooks/            # React hooks
│
├── backend/
│   ├── app/
│   │   ├── agent/        # Claude Agent orchestration
│   │   │   ├── orchestrator.py    # Main job runner
│   │   │   ├── prompts.py         # System prompts for agent
│   │   │   ├── prompt_enhancer.py # Fireworks prompt enhancement
│   │   │   ├── video_styles.py    # Style enum and configs
│   │   │   ├── agent_factory.py   # Agent initialization
│   │   │   └── observability.py   # Logfire setup
│   │   ├── api/routes/   # FastAPI endpoints
│   │   ├── config.py     # Settings from .env
│   │   └── main.py       # FastAPI app
│   │
│   ├── remotion_project/ # Remotion template (copied per job)
│   │   ├── src/          # React components, templates, constants
│   │   ├── props/        # JSON props for video generation
│   │   └── package.json  # Remotion 4.0.419
│   │
│   ├── remotion_jobs/    # Per-job isolated directories (run_1, run_2, etc.)
│   ├── final_vids/       # Final rendered MP4s
│   ├── uploads/          # User-uploaded files
│   └── tests/            # Backend tests
│
└── package.json          # Root monorepo package (shared Next.js deps)
```

### Agent Workflow

The agent runs in an isolated job directory with access to:
- Bash commands (install deps, run Remotion render)
- File editing (modify React components in `src/`)
- Remotion CLI (`remotion render`, `remotion compositions`)

**Critical**: Agent must output video to `output/video.mp4` in the job directory.

## Development Commands

### Frontend

```bash
cd frontend
npm install
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Required: Authenticate with Logfire
logfire auth

# Start server
uvicorn app.main:app --reload  # http://localhost:8000
```

**Environment variables** (create `backend/.env`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
FIREWORKS_API_KEY=fw_...
LOGFIRE_TOKEN=...  # Set by `logfire auth`
```

### Remotion Project

```bash
cd backend/remotion_project
npm install
npm run dev          # Open Remotion Studio
npm run compositions # List available compositions
npm run render       # Render single video
```

### Testing

```bash
cd backend
pytest                    # Run all tests
pytest tests/test_file.py # Run specific test file
```

## Key Technologies

### Frontend Stack
- **Next.js 16**: App Router, Server Components
- **React 19**: Latest features (useFormStatus, etc.)
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: Radix UI components (50+ installed)
- **Sonner**: Toast notifications (global duration: 2500ms)
- **react-hook-form + zod**: Form validation
- **Vercel Analytics**: Usage tracking

### Backend Stack
- **FastAPI**: Async Python web framework
- **Claude Agent SDK**: Orchestrates agent turns with tool calls
- **Pydantic 2**: Data validation and settings
- **Logfire**: OpenTelemetry-based observability (traces, spans, logs)
- **Remotion 4**: Programmatic video generation via React
- **Fireworks AI**: Prompt enhancement (Kimi K2.5 model)

## Agent System Prompts

The agent receives specialized instructions in `backend/app/agent/prompts.py`:

- **REMOTION_AGENT_SYSTEM_PROMPT**: Core instructions for Remotion development, rendering, and output requirements
- Video style configurations in `video_styles.py` add style-specific guidance (trailer, general, etc.)

**Prompt Enhancement**: User prompts are enhanced via Fireworks AI before being sent to Claude, adding creative direction and technical requirements.

## Observability

All agent runs are traced end-to-end using Logfire:

- **Root span**: `remotion_video_generation` (includes job_id, prompt, style)
- **Agent turns**: Captured with thinking, text, tool calls, results
- **Query traces**: Use Logfire SQL explorer (see `backend/docs/README.md`)

Access traces at: `https://logfire.pydantic.dev/<your_username>/renderwood-agent`

## API Endpoints

### Videos
- `POST /api/videos/create` - Create video from prompt
  - Body: `{ "prompt": string, "video_style": "general" | "trailer" }`
  - Returns: `{ "job_id": string, "status": string, "output_path": string }`
- `GET /api/video-styles` - List available video styles

### Uploads
- `GET /api/uploads` - List uploaded files
- `POST /api/uploads` - Upload file (multipart/form-data)
- `DELETE /api/uploads/{filename}` - Delete uploaded file
- `GET /api/uploads/{filename}/download` - Download file

### Health
- `GET /health` - Health check

## Important Patterns

### Video Style System

Video styles are defined in `backend/app/agent/video_styles.py`:
- Enum: `VideoStyle` (GENERAL, TRAILER)
- Each style has prompt template and config
- Frontend fetches styles from `/api/video-styles`

### Job Isolation

Each video generation creates an isolated directory:
1. Copy `remotion_project/` → `remotion_jobs/run_{N}/`
2. Agent works in isolated copy (prevents conflicts)
3. Output rendered to `run_{N}/output/video.mp4`
4. Final video copied to `final_vids/{job_id}.mp4`

### Error Handling

- Frontend: Toast notifications for errors
- Backend: Structured logging with Logfire
- Agent: Captured in traces for debugging

### Immutability

Follow immutability patterns (see global rules in `~/.claude/rules/coding-style.md`):
- Never mutate objects/arrays
- Use spread operators for state updates
- Create new instances instead of modifying

## Common Tasks

### Add New Video Style

1. Add enum value to `VideoStyle` in `backend/app/agent/video_styles.py`
2. Add style config with prompt template and settings
3. Frontend automatically fetches updated styles

### Modify Agent Behavior

1. Edit system prompt in `backend/app/agent/prompts.py`
2. Or modify style-specific prompts in `video_styles.py`
3. Restart backend server

### Debug Agent Issues

1. Check Logfire traces for full execution history
2. Inspect job directory in `backend/remotion_jobs/run_{N}/`
3. Review agent thinking and tool calls in Logfire

### Update Remotion Template

1. Edit files in `backend/remotion_project/src/`
2. Test locally with `npm run dev`
3. New jobs will use updated template

## Testing Strategy

- **Unit tests**: Backend utilities and API logic
- **Integration tests**: Agent orchestration flows
- **Manual testing**: Frontend video generation flows
- **Trace analysis**: Use Logfire for performance debugging

## Configuration

### Frontend Config
- `NEXT_PUBLIC_API_BASE_URL`: Backend URL (default: http://localhost:8000)
- No other env vars required

### Backend Config (`.env`)
- `ANTHROPIC_API_KEY`: Required for agent
- `FIREWORKS_API_KEY`: Required for prompt enhancement
- `LOGFIRE_TOKEN`: Set by `logfire auth`
- `CLAUDE_MODEL`: Default `claude-sonnet-4-5`
- `MAX_RENDER_TIMEOUT`: Default 600 seconds
- `ENVIRONMENT`: `development` or `production`

## Notable Dependencies

### Frontend
- All Radix UI primitives installed (accordion, dialog, dropdown, etc.)
- Recharts for data visualization
- date-fns for date formatting
- embla-carousel-react for carousels

### Backend
- `claude-agent-sdk>=0.1.33`: Agent orchestration
- `logfire>=4.22.0`: Observability
- `pydantic-ai`: AI utilities
- `python-multipart`: File uploads

### Remotion
- `@remotion/cli@4.0.419`: Render commands
- `@remotion/transitions`: Video transitions
- `zod@4.3.6`: Schema validation

## Known Constraints

- Job directories accumulate in `remotion_jobs/` (manual cleanup required)
- Remotion requires Node.js and npm in backend environment
- Videos limited by `MAX_RENDER_TIMEOUT` (default 10 minutes)
- Agent has no internet access (works with local files only)
- Prompt enhancement requires Fireworks API key
