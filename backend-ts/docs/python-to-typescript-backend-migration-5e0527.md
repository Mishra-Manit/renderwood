# Renderwood Backend: Python → TypeScript Migration Plan

Migrate the Renderwood backend from Python/FastAPI to TypeScript/Fastify as a parallel `backend-ts/` directory, preserving all current behavior, then cut over and remove the Python backend.

---

## Decisions locked in

- **Strategy**: Parallel backend (`backend-ts/` alongside `backend/`)
- **Framework**: Fastify
- **Job IDs**: Switch from sequential `run_N` to ULIDs (via `ulid` package)
- **Monorepo restructure**: Deferred — not part of this migration

---

## Current backend inventory (what we're porting)

| Python source | Lines | Complexity | TS destination |
|---|---|---|---|
| `app/config.py` | 43 | Low | `src/config.ts` |
| `app/main.py` | 50 | Low | `src/server.ts` |
| `app/api/schemas.py` | 22 | Low | `src/schemas.ts` |
| `app/api/routes/videos.py` | 66 | Medium | `src/routes/videos.ts` |
| `app/api/routes/uploads.py` | 239 | Medium | `src/routes/uploads.ts` |
| `app/agent/video_styles.py` | 119 | Low | `src/agent/video-styles.ts` |
| `app/agent/job_ids.py` | 25 | Low | `src/lib/job-ids.ts` (replaced with ULID) |
| `app/agent/upload_assets.py` | 74 | Low | `src/lib/upload-assets.ts` |
| `app/agent/agent_factory.py` | 39 | Medium | Folded into `src/agent/prompt-enhancer.ts` |
| `app/agent/prompt_enhancer.py` | 215 | Medium | `src/agent/prompt-enhancer.ts` |
| `app/agent/prompts.py` | 516 | Low (big string) | `src/agent/prompts.ts` |
| `app/agent/observability.py` | 98 | High | `src/observability.ts` |
| `app/agent/orchestrator.py` | 252 | High | `src/agent/orchestrator.ts` |
| `scripts/prompt_enhancer_runner.py` | 32 | Low | `scripts/prompt-enhancer-runner.ts` |

**Total**: ~1,800 lines of Python → estimated ~1,500 lines of TypeScript.

---

## Critical behaviors to preserve exactly

These are the subtle behaviors discovered by reading the code that must survive the port:

1. **Error-after-render tolerance** (`orchestrator.py:204-222`): If `ResultMessage.is_error` is true but `output/video.mp4` already exists, treat it as a warning and continue — don't throw.

2. **Upload filename deduplication** (`uploads.py:157-163`): When a file with the same name exists, append `_1`, `_2`, etc. to the stem (before the extension).

3. **Sidecar detection** (`upload_assets.py:12-14`): A `.json` file is a sidecar only if the file it describes (same name minus `.json`) also exists in the directory.

4. **Hidden file + sidecar filtering**: Both `list_uploads` and `collect_asset_summaries` skip files starting with `.` and sidecar JSON files.

5. **Thumbnail generation**: Only for `video/*` MIME types, using `ffmpeg -ss 0.5 -frames:v 1 -q:v 2`. Thumbnails go in `.thumb/` subdirectory. Failure is silent (returns empty string).

6. **Thumbnail cleanup on delete** (`uploads.py:196-206`): Deleting an upload also removes its sidecar JSON and thumbnail.

7. **`shutil.copytree` with `symlinks=True`** (`orchestrator.py:83-88`): The job directory copy preserves symlinks. This matters because `node_modules` may contain symlinks.

8. **Agent options specifics** (`orchestrator.py:120-131`):
   - `setting_sources=["user", "project"]`
   - 7 specific allowed tools: `Skill, Read, Write, Edit, Bash, Glob, Grep`
   - `permission_mode="bypassPermissions"`
   - `max_turns=30`
   - Only `ANTHROPIC_API_KEY` passed as env

9. **`.claude/skills/` directory** is part of the Remotion template and must be copied into every job directory — the agent explicitly loads `remotion-best-practices` skill.

10. **Prompt enhancement fallback**: If `FIREWORKS_API_KEY` is empty or the call throws, silently fall back to the raw user prompt.

11. **Agent factory caching** (`agent_factory.py:19-38`): Prompt enhancer agents are cached by `(style, base_system_prompt)` tuple. In TS this becomes a simple Map cache of OpenAI client instances.

12. **Upload assets → prompt injection**: Asset summaries are formatted as `"- filename -- description (mime_type)"` and injected into the agent prompt, not the system prompt.

13. **`copytree dirs_exist_ok=False`**: Job directory creation fails if the directory already exists — no overwriting.

14. **Music files in `public/music/`**: 3 bundled tracks (`dramatic.mp3`, `mysterious.mp3`, `speeding_up_dramatic.mp3`) are part of the template.

15. **LangSmith usage metadata flattening** (`observability.py:62-97`): A monkey-patch that flattens nested `dict`/`list` usage metrics into OTEL-safe flat attributes.

---

## Phase 0 — Scaffold & config (no behavior yet)

**Goal**: Empty Fastify app that starts and responds to `GET /health`.

### Steps
1. Create `backend-ts/` directory
2. Initialize `package.json` with:
   - `typescript`, `tsx`, `@types/node`
   - `fastify`, `@fastify/cors`, `@fastify/multipart`, `@fastify/static`
   - `zod` (schemas + config validation)
   - `ulid` (job IDs)
   - `dotenv` (env loading)
3. Create `tsconfig.json` (strict mode, ESM, `src/` → `dist/`)
4. Create `src/config.ts`:
   - Validate env with Zod (mirror every field in Python `Settings`)
   - Load from `backend-ts/.env`
   - Export singleton `config` object
5. Create `src/server.ts`:
   - Fastify app with CORS (`origin: '*'`)
   - `GET /health` → `{ status: "ok" }`
   - Lifespan: ensure `output_dir`, `remotion_jobs_path`, `upload_dir`, and `remotion_project_path/props` directories exist
6. Add dev script: `tsx watch src/server.ts`
7. Add `.env.example` mirroring the Python one

### Verification
- `npm run dev` starts on port 8000
- `curl localhost:8000/health` returns `{ "status": "ok" }`

---

## Phase 1 — Schemas, video styles, job IDs

**Goal**: Shared types and pure utility modules with no I/O dependencies.

### Steps
1. Create `src/schemas.ts`:
   - `VideoCreateRequest` (Zod schema): `{ prompt: string (min 1), video_style: enum }`
   - `VideoCreateResponse` (Zod schema): `{ job_id, status, output_path?, job_project_path?, error? }`
   - `UploadedFileInfo` (Zod schema): `{ name, size, type, description, uploaded_at, has_thumbnail }`
   - Export inferred TS types from each schema

2. Create `src/agent/video-styles.ts`:
   - `VideoStyle` enum: `GENERAL = "general"`, `TRAILER = "trailer"`
   - `StyleConfig` type: `{ label, description, systemPromptAddendum }`
   - `STYLE_CONFIGS` map (preserve exact addendum text from Python)
   - `getStyleConfig()` and `listStyles()` functions

3. Create `src/lib/job-ids.ts`:
   - `generateJobId()`: returns a ULID string (no filesystem scanning)
   - Simple, no race conditions

### Verification
- Unit tests for `listStyles()` output shape
- Unit test that `generateJobId()` returns unique values

---

## Phase 2 — Upload routes

**Goal**: Full upload CRUD + thumbnails, byte-for-byte compatible with current API.

### Steps
1. Create `src/lib/upload-assets.ts`:
   - `isSidecar(filePath)`: check `.json` suffix + corresponding file exists
   - `collectAssetSummaries()`: read upload dir, skip dotfiles/sidecars, read sidecar JSON for description/mime
   - `formatAssetsContext(summaries)`: format as `"- filename -- desc (mime)"` text block
   - `copyUploadsToJob(jobDir)`: copy non-sidecar files to `jobDir/public/`

2. Create `src/routes/uploads.ts` (Fastify plugin):
   - `GET /api/uploads` → list uploads (skip dotfiles, sidecars, `.thumb/`)
   - `POST /api/uploads` → multipart upload:
     - Sanitize filename (basename only)
     - Deduplicate with `_1`, `_2` suffix
     - Write file to disk (use streams, not buffer-all-in-memory)
     - Generate video thumbnail via `ffmpeg` child process (silent failure)
     - Write sidecar JSON metadata
   - `DELETE /api/uploads/{filename}` → remove file + sidecar + thumbnail
   - `GET /api/uploads/{filename}` → serve file (sendFile / stream)
   - `GET /api/uploads/{filename}/thumbnail` → serve thumbnail JPG

3. Register plugin in `src/server.ts`

### Quirks to preserve
- Thumbnail directory: `.thumb/` inside uploads dir
- Thumbnail naming: `{original_name}.jpg`
- Sidecar JSON fields: `original_name, stored_name, description, uploaded_at (ISO), size, mime_type, thumbnail_name`
- `ffmpeg` command: `-y -ss 0.5 -i <file> -frames:v 1 -q:v 2 <thumb_path>`
- MIME detection: Node `mime-types` package or `mime` package

### Verification
- Upload a file, verify sidecar JSON written
- Upload duplicate name, verify `_1` suffix
- Upload a video, verify `.thumb/` thumbnail generated
- Delete upload, verify file + sidecar + thumbnail removed
- GET upload, verify file served
- GET thumbnail, verify JPEG served

---

## Phase 3 — Prompt enhancer + prompts

**Goal**: Fireworks-powered prompt enhancement with fallback.

### Steps
1. Create `src/agent/prompts.ts`:
   - Export `REMOTION_AGENT_SYSTEM_PROMPT` as a string constant (copy verbatim from Python `prompts.py`)

2. Create `src/agent/prompt-enhancer.ts`:
   - `_BASE_SYSTEM_PROMPT` constant (copy verbatim from Python `prompt_enhancer.py`)
   - Cache of OpenAI client instances keyed by `(style, basePrompt)` (Map)
   - Use `openai` SDK with `baseURL: "https://api.fireworks.ai/inference/v1"` and Fireworks API key
   - `enhancePrompt(userPrompt, style, assetsContext)`:
     - If no `FIREWORKS_API_KEY` → return raw prompt
     - Build system prompt = base + style addendum
     - Call chat completion with `model: config.fireworksModel`
     - Return enhanced text, or fall back to raw prompt on any error
   - Log via observability spans

3. Create `scripts/prompt-enhancer-runner.ts`:
   - CLI script with hardcoded test prompt
   - `tsx scripts/prompt-enhancer-runner.ts`

### Verification
- With Fireworks key: verify enhanced prompt returned
- Without Fireworks key: verify raw prompt returned
- With bad key: verify fallback (no crash)

---

## Phase 4 — Observability

**Goal**: Logfire + OpenTelemetry tracing matching current span hierarchy.

### `@pydantic/logfire-node` API (confirmed from SDK docs + repo)

The Node SDK (`@pydantic/logfire-node`) provides these APIs we'll use:

```ts
import * as logfire from '@pydantic/logfire-node';

// Configure once at startup (must happen before other imports for auto-instrumentation)
logfire.configure({
  token: process.env.LOGFIRE_TOKEN,      // write token (from `logfire auth` or env)
  serviceName: 'renderwood-agent',
  serviceVersion: '1.0.0',
});

// Structured logging (each creates a span at the given level)
logfire.info('message', { key: 'value' }, { tags: ['optional'] });
logfire.warn('message', { key: 'value' });
logfire.error('message', { key: 'value' });
logfire.debug('message', { key: 'value' });

// Nesting spans (callback-based, auto-ends parent when callback completes)
logfire.span('parent_span_name', {
  callback: async (span) => {
    logfire.info('nested child span');
    // ... do work ...
  },
});

// Manual spans (for cases where callback pattern doesn't fit)
const span = logfire.startSpan('manual_span');
logfire.info('child', {}, { parentSpan: span });
span.end();

// Error reporting
logfire.reportError('description', error);
```

### Python → TS observability mapping

| Python pattern | TS equivalent |
|---|---|
| `logfire.configure(service_name=..., environment=..., console=...)` | `logfire.configure({ token, serviceName, serviceVersion })` |
| `logfire.instrument_fastapi(app)` | `logfire.configure()` called before Fastify import (auto-instruments via OTEL Node SDK) |
| `logfire.instrument_pydantic_ai()` | Not needed — prompt enhancer uses OpenAI SDK which OTEL auto-instruments |
| `logfire.instrument_anthropic()` | OTEL auto-instrumentation picks up Anthropic HTTP calls |
| `with logfire.span('name', **attrs):` | `logfire.span('name', { callback: async (span) => { ... } })` |
| `logfire.info('msg', key=val)` | `logfire.info('msg', { key: val })` |
| `logfire.warn(...)` | `logfire.warn(...)` |
| `logfire.error(...)` | `logfire.error(...)` |
| `configure_claude_agent_sdk()` (LangSmith) | See LangSmith note below |

### Steps
1. Install `@pydantic/logfire-node`
2. Create `src/instrumentation.ts` (loaded before all other imports):
   ```ts
   import * as logfire from '@pydantic/logfire-node';
   import 'dotenv/config';
   logfire.configure({
     serviceName: 'renderwood-agent',
     serviceVersion: '1.0.0',
   });
   ```
   The dev/start script must preload this: `node --require ./src/instrumentation.ts src/server.ts`
   (or use `tsx --require ./src/instrumentation.ts src/server.ts`)

3. Create `src/observability.ts` with thin wrappers:
   - Re-export `logfire` for use throughout the app
   - `withSpan(name, attributes, fn)` helper that wraps `logfire.span` callback pattern for cleaner async usage:
     ```ts
     export async function withSpan<T>(
       name: string, attrs: Record<string, unknown>, fn: () => Promise<T>
     ): Promise<T> {
       return logfire.span(name, { ...attrs, callback: async () => fn() });
     }
     ```
   - Set LangSmith OTEL env vars (`LANGSMITH_OTEL_ENABLED`, `LANGSMITH_OTEL_ONLY`, `LANGSMITH_TRACING`)

4. **LangSmith / Claude Agent SDK tracing**: The Python backend uses `langsmith[claude-agent-sdk,otel]` to auto-trace Claude Agent SDK turns. In TS:
   - Check if `@langchain/langsmith` or equivalent TS package provides Claude Agent SDK integration
   - If available, configure it similarly
   - If not, implement manual span logging in the orchestrator's message loop (already planned in Phase 5 — each `AssistantMessage` / `ResultMessage` gets its own `logfire.span` / `logfire.info` call)
   - The LangSmith usage-metadata flattening monkey-patch (`_patch_langsmith_usage_metadata`) is unlikely to be needed in TS since we'll log usage attributes directly as flat objects in our manual spans

5. **Fastify request tracing**: `@pydantic/logfire-node`'s `configure()` sets up the OTEL Node SDK which auto-instruments HTTP. For richer per-route spans, add a Fastify `onRequest`/`onResponse` hook that creates a logfire span with route info.

### Risk assessment (updated)
This phase is **lower risk than originally estimated** because:
- The Node SDK API is clean and well-documented
- `logfire.span` callback pattern maps directly to Python's `with logfire.span()`
- Auto-instrumentation handles HTTP/Anthropic calls without explicit `instrument_*` calls
- The only gap is LangSmith Claude Agent SDK auto-tracing, which we compensate for with manual spans in the orchestrator

### Verification
- Start server, make a request, verify spans appear in Logfire dashboard
- Check trace hierarchy matches: `remotion_video_generation > setup_job_directory > agent_execution > agent_turn_N`
- Verify structured attributes (job_id, user_prompt, video_style) appear on spans

---

## Phase 5 — Orchestrator + agent execution

**Goal**: The core job lifecycle — the most critical phase.

### `@anthropic-ai/claude-agent-sdk` API (confirmed from official TS SDK reference)

Package: `npm install @anthropic-ai/claude-agent-sdk`

The TS SDK API is **structurally different** from the Python SDK, but functionally equivalent:

```ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKMessage, SDKAssistantMessage, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk';

// query() returns an AsyncGenerator<SDKMessage> — no separate client class
const conversation = query({
  prompt: "Edit the Remotion project and render the video.",
  options: {
    systemPrompt: REMOTION_AGENT_SYSTEM_PROMPT,
    settingSources: ['user', 'project'],
    allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    cwd: '/path/to/job/dir',
    permissionMode: 'bypassPermissions',
    maxTurns: 30,
    model: 'claude-sonnet-4-5',
    env: { ANTHROPIC_API_KEY: '...' },
  },
});

// Iterate messages directly — no client.query() + client.receive_response() split
for await (const message of conversation) {
  if (message.type === 'assistant') {
    // SDKAssistantMessage — content blocks are in message.message.content
    // (message.message is a BetaMessage from the Anthropic SDK)
  } else if (message.type === 'result') {
    // SDKResultMessage — check message.is_error and message.subtype
  }
}

conversation.close(); // cleanup
```

### Python → TS SDK mapping

| Python | TypeScript | Notes |
|---|---|---|
| `ClaudeSDKClient(options=opts)` | `query({ prompt, options })` | No client class; `query()` is the entry point |
| `async with client:` + `client.query(prompt)` + `client.receive_response()` | `for await (const msg of query({...}))` | Single async generator, no two-step pattern |
| `ClaudeAgentOptions(...)` | `Options` object literal | Same fields, camelCase: `systemPrompt`, `allowedTools`, `permissionMode`, `maxTurns`, `settingSources`, `cwd`, `env`, `model` |
| `AssistantMessage` | `SDKAssistantMessage` | `type: "assistant"`, content blocks in `.message.content` (BetaMessage) |
| `ResultMessage` | `SDKResultMessage` | `type: "result"`, discriminated by `.subtype`: `"success"` vs `"error_max_turns"` / `"error_during_execution"` / etc. |
| `message.is_error` | `message.is_error` | Same field name |
| `message.result` (str) | Success: `message.result` (str). Error: `message.errors` (str[]) | Different field for error text |
| `TextBlock` | `BetaTextBlock` in `message.message.content` | Check `block.type === 'text'` |
| `ThinkingBlock` | `BetaThinkingBlock` in `message.message.content` | Check `block.type === 'thinking'` |
| `ToolUseBlock` | `BetaToolUseBlock` in `message.message.content` | Check `block.type === 'tool_use'` |
| `ToolResultBlock` | N/A — tool results come as `SDKUserMessage` with `tool_use_result` | Different message type entirely |

### Steps
1. Create `src/agent/orchestrator.ts`:
   - `run(jobId, prompt, videoStyle)`:
     - Create logfire span `remotion_video_generation`
     - Call `setupJobDirectory(jobId)`
     - Call `collectAssetSummaries()` + `formatAssetsContext()`
     - If summaries exist, `copyUploadsToJob(jobDir)`
     - Call `enhancePrompt(prompt, style, assetsContext)`
     - Build agent prompt (same format: user request + assets context)
     - Build options object
     - Run agent via `query()`
     - Validate output exists
     - Copy output to final dir
     - Return `{ output_path, job_project_path }`

2. `setupJobDirectory(jobId)`:
   - Use `fs-extra` `copy()` with `dereference: false` (preserves symlinks, like Python's `symlinks=True`)
   - Target: `config.remotionJobsPath / jobId`
   - Fail if directory already exists
   - Create `output/` subdirectory

3. `buildAgentOptions(jobDir)` → returns `Options` object:
   ```ts
   const options: Options = {
     systemPrompt: REMOTION_AGENT_SYSTEM_PROMPT,
     settingSources: ['user', 'project'],
     allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
     cwd: jobDir,
     permissionMode: 'bypassPermissions',
     maxTurns: 30,
     model: config.claudeModel,
     env: { ANTHROPIC_API_KEY: config.anthropicApiKey },
   };
   ```

4. `runAgent(prompt, options, outputDir)` — the core agent loop:
   ```ts
   async function runAgent(prompt: string, options: Options, outputDir: string) {
     const conversation = query({ prompt, options });
     let turnCount = 0;

     for await (const message of conversation) {
       if (message.type === 'assistant') {
         turnCount++;
         // message.message is BetaMessage from Anthropic SDK
         for (const block of message.message.content) {
           if (block.type === 'text') {
             logfire.info('agent_text', { turn: turnCount, text: block.text });
           } else if (block.type === 'thinking') {
             logfire.info('agent_thinking', { turn: turnCount, thinking: block.thinking });
           } else if (block.type === 'tool_use') {
             logfire.info('tool_call', { turn: turnCount, tool_name: block.name, tool_input: block.input });
           }
         }
       } else if (message.type === 'result') {
         handleResultMessage(message, turnCount, outputDir);
       }
       // Ignore other message types (system, user, stream_event, etc.)
     }

     conversation.close();
     return path.join(outputDir, 'video.mp4');
   }
   ```

5. `handleResultMessage` — preserving error-after-render tolerance:
   ```ts
   function handleResultMessage(message: SDKResultMessage, turnCount: number, outputDir: string) {
     if (message.is_error) {
       const videoExists = fs.existsSync(path.join(outputDir, 'video.mp4'));
       const errorText = message.subtype === 'success'
         ? 'unknown error'
         : (message.errors ?? []).join('; ');

       logfire.error('agent_execution_failed', {
         error: errorText, turn_count: turnCount, video_already_rendered: videoExists,
       });

       if (!videoExists) throw new Error(`Agent failed: ${errorText}`);

       logfire.warn('agent_error_after_render', {
         message: 'Agent reported an error but the video was already rendered. Continuing.',
         error: errorText,
       });
       return;
     }

     logfire.info('agent_execution_complete', {
       result: message.result, turn_count: turnCount,
     });
   }
   ```

6. `validateOutput(outputPath)`: throw if missing

7. `copyOutputToFinal(outputPath, jobId)`: copy to `config.outputDir / "${jobId}.mp4"`

### Key differences from Python orchestrator
- **No context manager**: Python uses `async with ClaudeSDKClient(options=options) as client:`. TS just calls `query()` and iterates.
- **No two-step query**: Python does `client.query(prompt)` then `client.receive_response()`. TS combines these into one `query({ prompt, options })` call.
- **Content blocks access**: Python has top-level `message.content`. TS has `message.message.content` (extra `.message` because `SDKAssistantMessage` wraps a `BetaMessage`).
- **Tool results**: Python gets `ToolResultBlock` in assistant messages. TS sends tool results as separate `SDKUserMessage` with `tool_use_result` — we can either log these or skip them (the Python code logged them in the assistant message handler).
- **Result message errors**: Python has `message.result` (str) for both success and error. TS has `message.result` for success, `message.errors` (string array) for errors, discriminated by `message.subtype`.
- **Cleanup**: Call `conversation.close()` when done.

### Risk assessment (updated)
This phase is **lower risk than originally estimated** because:
- The TS SDK API is well-documented with full type definitions
- The `query()` function maps cleanly to the Python `ClaudeSDKClient` pattern
- All critical options (`systemPrompt`, `allowedTools`, `permissionMode`, `cwd`, `env`, `maxTurns`, `model`, `settingSources`) exist with identical semantics
- Message type discrimination is straightforward via `.type` field
- The error-after-render tolerance logic maps directly

### Verification
- End-to-end: POST to `/api/videos/create`, verify video renders to `final_vids/`
- Error-after-render: manually test agent error scenario
- Job directory structure matches expectations (including `.claude/skills/`)

---

## Phase 6 — Video routes

**Goal**: Wire up the final API endpoints.

### Steps
1. Create `src/routes/videos.ts` (Fastify plugin):
   - `GET /api/video-styles` → `listStyles()`
   - `POST /api/videos/create`:
     - Validate body with Zod `VideoCreateRequest`
     - Generate ULID job ID
     - Call `orchestrator.run()`
     - On success: return `{ job_id, status: "complete", output_path, job_project_path }`
     - On error: return `{ job_id, status: "failed", error }` (200, not 500 — matching Python behavior)
   - `GET /api/jobs/{job_id}/video`:
     - Serve `config.outputDir / "${jobId}.mp4"`
     - 404 if not found

2. Register plugin in `src/server.ts`

### Verification
- Full round-trip: frontend → TS backend → video returned
- Style selection works
- Error responses match Python format

---

## Phase 7 — Integration testing & cutover

**Goal**: Validate TS backend against the existing frontend, then switch.

### Steps
1. **Smoke tests**: Run the frontend against `backend-ts/` (just change `NEXT_PUBLIC_API_BASE_URL`)
   - Upload files (single, duplicate name, video with thumbnail)
   - List uploads
   - Delete uploads
   - Serve uploads + thumbnails
   - List video styles
   - Create video (general + trailer style)
   - Download video

2. **Write integration tests** (Vitest or similar):
   - Upload CRUD lifecycle
   - Video create contract test (mock agent SDK)
   - Job directory setup (verify `.claude/skills/` copied, `output/` created)
   - Prompt enhancement fallback
   - ULID job ID uniqueness

3. **Side-by-side comparison**: Run both backends, send same requests, compare responses

4. **Cutover**:
   - Rename `backend/` → `backend-python/` (keep temporarily)
   - Rename `backend-ts/` → `backend/`
   - Update `CLAUDE.md` to reflect new stack
   - Update `backend/docs/` documentation
   - Update `.gitignore` if needed
   - Remove Python venv, requirements.txt, etc.

5. **Cleanup** (after validation period):
   - Delete `backend-python/`

---

## Phase 8 — Post-migration improvements (optional, not blocking)

These are improvements unlocked by the TS rewrite but not required for parity:

- [ ] **Optimize job template copying**: Symlink `node_modules/` instead of copying
- [ ] **Enforce `MAX_RENDER_TIMEOUT`**: Actually use `AbortSignal.timeout()` or similar
- [ ] **Stream uploads**: Fastify multipart already supports streaming; wire it up
- [ ] **Convert Remotion template to TSX**: `src/index.js` → `.ts`, `Root.jsx` → `.tsx`
- [ ] **Shared types package**: Move schemas to `packages/shared` when monorepo happens
- [ ] **Async job API**: `POST /videos/create` returns immediately, poll via `GET /jobs/:id/status`
- [ ] **Config cleanup**: Actually use `default_fps`, `default_width`, `default_height` from config

---

## Dependency manifest for `backend-ts/`

```json
{
  "dependencies": {
    "fastify": "^5",
    "@fastify/cors": "^11",
    "@fastify/multipart": "^9",
    "@fastify/static": "^8",
    "zod": "^3.23",
    "ulid": "^2.3",
    "dotenv": "^16",
    "openai": "^4",
    "fs-extra": "^11",
    "mime-types": "^2.1",
    "@pydantic/logfire-node": "latest",
    "@anthropic-ai/claude-agent-sdk": "latest"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "tsx": "^4",
    "@types/node": "^22",
    "@types/fs-extra": "^11",
    "@types/mime-types": "^2.1",
    "vitest": "^3"
  }
}
```

> Both package names are confirmed: `@pydantic/logfire-node` and `@anthropic-ai/claude-agent-sdk`.

---

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| TS Claude Agent SDK API differs from Python | **Low** (reduced) | SDK confirmed: `query()` function, `Options` type with all needed fields (`systemPrompt`, `allowedTools`, `permissionMode`, `cwd`, `env`, `maxTurns`, `model`, `settingSources`). Message types map cleanly: `SDKAssistantMessage`, `SDKResultMessage`. |
| Logfire Node SDK feature gap | **Low** (reduced) | SDK confirmed: `@pydantic/logfire-node` has `span`, `info/warn/error`, `startSpan`, `reportError`. Only LangSmith auto-tracing gap remains, covered by manual spans. |
| `fs-extra` copy doesn't preserve symlinks identically | Medium | Test with actual `node_modules/` symlinks |
| LangSmith TS SDK lacks `TurnLifecycle` for patching | Low | Log flattening manually in orchestrator |
| Fastify multipart edge cases vs FastAPI | Low | Test with same files used in Python backend |

---

## Estimated effort per phase

| Phase | Effort | Blocking? |
|---|---|---|
| 0 — Scaffold | ~1 hour | No |
| 1 — Schemas/styles/IDs | ~1 hour | No |
| 2 — Upload routes | ~3 hours | No |
| 3 — Prompt enhancer | ~2 hours | No |
| 4 — Observability | ~2 hours | No (SDK confirmed) |
| 5 — Orchestrator | ~3 hours | No (SDK confirmed) |
| 6 — Video routes | ~1 hour | No |
| 7 — Testing & cutover | ~3 hours | Yes (validation) |
| **Total** | **~16 hours** | |
