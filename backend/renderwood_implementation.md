# Renderwood: AI-Powered Video Editor & Creator — Implementation Plan

## Vision

Renderwood is an AI agent-powered video creation backend. Users provide a text prompt describing the video they want (e.g., "create a product launch video for my SaaS platform") along with screenshots and clips. The system uses Claude (via the Anthropic Python SDK's agentic tool-use loop) to plan the video structure, compose scenes from a library of Remotion templates, generate custom JSX when needed, and render the final video — all orchestrated as an autonomous agent workflow.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                          │
│  POST /api/videos/create   — start video creation job          │
│  POST /api/assets/upload   — upload screenshots/clips          │
│  GET  /api/jobs/{id}       — poll job status                   │
│  GET  /api/jobs/{id}/video — download rendered video           │
└─────────────┬───────────────────────────────────┬───────────────┘
              │                                   │
              ▼                                   ▼
┌──────────────────────┐            ┌──────────────────────────┐
│   Agent Orchestrator │            │     Asset Manager        │
│   (Claude + Tools)   │            │  - File uploads          │
│                      │            │  - Local path refs       │
│  Uses @beta_tool +   │            │  - Copy to Remotion      │
│  tool_runner loop    │            │    public/ directory     │
└──────────┬───────────┘            └──────────────────────────┘
           │
           │  Claude calls tools in an agentic loop:
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Agent Tools                              │
│                                                              │
│  1. plan_video_structure    — Define scenes, timing, flow    │
│  2. select_template         — Pick from pre-built templates  │
│  3. customize_template      — Set props/colors/text/images   │
│  4. generate_custom_scene   — Write new JSX for unique needs │
│  5. compose_video           — Assemble scenes into Root.jsx  │
│  6. list_available_assets   — See uploaded screenshots/clips │
│  7. preview_scene           — Render a single frame as PNG   │
│  8. render_video            — Trigger full Remotion render   │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│              Remotion Project (Node.js)                       │
│                                                              │
│  /backend/remotion_project/                                  │
│  ├── src/                                                    │
│  │   ├── Root.jsx              (dynamically generated)       │
│  │   ├── templates/            (pre-built scene templates)   │
│  │   │   ├── HeroIntro.jsx                                   │
│  │   │   ├── FeatureShowcase.jsx                             │
│  │   │   ├── ScreenshotWalkthrough.jsx                       │
│  │   │   ├── TestimonialQuote.jsx                            │
│  │   │   ├── StatsCounter.jsx                                │
│  │   │   ├── LogoReveal.jsx                                  │
│  │   │   ├── CallToAction.jsx                                │
│  │   │   └── TextOverlay.jsx                                 │
│  │   ├── components/           (shared UI components)        │
│  │   │   ├── AppWindow.jsx                                   │
│  │   │   ├── AnimatedText.jsx                                │
│  │   │   ├── ImageFrame.jsx                                  │
│  │   │   └── GradientBackground.jsx                          │
│  │   ├── constants/                                          │
│  │   │   ├── themes.js         (color palettes)              │
│  │   │   └── timing.js         (standard durations)          │
│  │   └── generated/            (agent-generated custom JSX)  │
│  ├── public/                   (user assets copied here)     │
│  ├── package.json                                            │
│  └── remotion.config.js                                      │
│                                                              │
│  Rendering: `npx remotion render <CompositionId> <output>`   │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API Server | **Python 3.11+ / FastAPI** | REST API, job management, file uploads |
| AI Agent | **Anthropic Python SDK** (`anthropic` package) | Claude agentic loop with `@beta_tool` + `tool_runner` |
| Model | **Claude Sonnet 4** | Prompt understanding, video planning, JSX generation |
| Video Engine | **Remotion 4.x** (Node.js) | React-based video composition & rendering |
| Rendering | **Remotion CLI** (`npx remotion render`) | Invoked from Python via `subprocess` |
| Task Queue | **asyncio** + background tasks | Async render job management |
| Storage | **Local filesystem** | Assets, generated code, rendered videos |

## Detailed Implementation

---

### Phase 1: Project Foundation

#### 1.1 Python Backend Setup

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Environment config (API keys, paths)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── videos.py        # POST /api/videos/create, GET /api/jobs/{id}
│   │   │   └── assets.py        # POST /api/assets/upload
│   │   └── schemas.py           # Pydantic models for request/response
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── orchestrator.py      # Main agent loop using tool_runner
│   │   ├── tools.py             # @beta_tool definitions for Claude
│   │   ├── prompts.py           # System prompts for video planning
│   │   └── video_plan.py        # VideoStoryboard data models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── asset_manager.py     # File upload, path resolution, copy to public/
│   │   ├── remotion_service.py  # Generate JSX, trigger renders via subprocess
│   │   ├── template_engine.py   # Template selection & customization logic
│   │   └── job_manager.py       # Background job tracking & status
│   └── models/
│       ├── __init__.py
│       └── job.py               # Job status model
├── remotion_project/            # Remotion Node.js project
├── requirements.txt
├── .env.example
└── renderwood_implementation.md
```

#### 1.2 Remotion Project Setup

A self-contained Remotion project inside `backend/remotion_project/` that:
- Has a parameterized `Root.jsx` that reads scene configuration from a JSON file
- Contains pre-built scene templates as React components
- Accepts `inputProps` via CLI `--props` flag for dynamic configuration
- Renders via `npx remotion render <CompositionId> <output.mp4> --props=<config.json>`

---

### Phase 2: Pre-Built Scene Templates

Each template is a self-contained Remotion component that accepts props for customization.

#### 2.1 Template Catalog

| Template | Description | Key Props |
|----------|-------------|-----------|
| **HeroIntro** | Full-screen title with animated subtitle, gradient bg | `title`, `subtitle`, `theme`, `backgroundGradient` |
| **FeatureShowcase** | Screenshot with feature callouts and text | `screenshot`, `features[]`, `title`, `theme` |
| **ScreenshotWalkthrough** | Pan/zoom through a product screenshot | `screenshot`, `zoomPoints[]`, `captions[]` |
| **TestimonialQuote** | Quote card with avatar and attribution | `quote`, `author`, `avatar`, `role` |
| **StatsCounter** | Animated number counters with labels | `stats[]` (value, label, prefix, suffix) |
| **LogoReveal** | Animated logo entrance with particles | `logoUrl`, `tagline`, `theme` |
| **CallToAction** | CTA with URL, button text, urgency | `headline`, `ctaText`, `url`, `theme` |
| **TextOverlay** | Cinematic text on gradient/image bg | `text`, `fontSize`, `position`, `background` |
| **SplitScreen** | Side-by-side comparison or before/after | `leftImage`, `rightImage`, `labels[]` |
| **VideoClipScene** | Embed and trim a user-provided video clip | `clipSrc`, `startFrom`, `endAt`, `overlay` |

#### 2.2 Template Props Schema

Each template exports a Zod schema for validation (following Remotion best practices):

```jsx
// Example: FeatureShowcase.jsx
import { z } from 'zod';

export const FeatureShowcaseSchema = z.object({
  screenshot: z.string(),           // path in public/ or URL
  title: z.string(),
  features: z.array(z.object({
    icon: z.string(),
    label: z.string(),
    description: z.string(),
  })),
  theme: z.object({
    primary: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  animationStyle: z.enum(['slide-in', 'fade', 'spring-bounce']).default('spring-bounce'),
});
```

#### 2.3 Template Design Principles

- All animations driven by `useCurrentFrame()` + `spring()`/`interpolate()` (never CSS transitions)
- Use `<Img>` from `remotion` for all images (not native `<img>`)
- Use `staticFile()` for local assets in `public/`
- Use `<TransitionSeries>` from `@remotion/transitions` for scene-to-scene transitions
- Support `1920x1080` (landscape) and `1080x1920` (portrait/mobile) via props
- Consistent spring config: `{ damping: 200 }` for smooth, `{ damping: 8 }` for bouncy

---

### Phase 3: Agent Orchestrator

#### 3.1 System Prompt

The agent receives a carefully crafted system prompt that:
- Defines its role as a professional video editor/motion designer
- Describes available templates and their capabilities
- Explains the tool-calling workflow (plan → select → customize → compose → render)
- Provides guidelines for good video structure (pacing, transitions, visual hierarchy)
- Includes Remotion JSX rules for when generating custom scenes

#### 3.2 Agent Tools (using `@beta_tool`)

```python
from anthropic import beta_tool

@beta_tool
def plan_video_structure(
    title: str,
    description: str,
    target_duration_seconds: int,
    aspect_ratio: str,
    num_scenes: int
) -> str:
    """Plan the video structure — define scene order, timing, and transitions.
    
    Args:
        title: Video title
        description: Detailed description of the desired video content and style
        target_duration_seconds: Target video length in seconds
        aspect_ratio: Either "16:9" (landscape) or "9:16" (portrait)
        num_scenes: Suggested number of scenes (3-12)
    
    Returns:
        JSON storyboard with scene definitions, timing, and transitions
    """

@beta_tool
def list_available_assets() -> str:
    """List all user-uploaded assets (screenshots, clips) available for the video.
    
    Returns:
        JSON array of assets with filename, type, and dimensions
    """

@beta_tool
def select_template(
    scene_index: int,
    template_name: str,
    duration_seconds: float
) -> str:
    """Select a pre-built template for a specific scene in the storyboard.
    
    Args:
        scene_index: Scene position (0-indexed)
        template_name: One of: HeroIntro, FeatureShowcase, ScreenshotWalkthrough,
                       TestimonialQuote, StatsCounter, LogoReveal, CallToAction,
                       TextOverlay, SplitScreen, VideoClipScene
        duration_seconds: How long this scene should last
    
    Returns:
        Template schema showing available props for customization
    """

@beta_tool
def customize_template(
    scene_index: int,
    props: dict
) -> str:
    """Set the props for a previously selected template scene.
    
    Args:
        scene_index: Scene position (0-indexed)
        props: JSON object matching the template's prop schema
    
    Returns:
        Confirmation with validated props
    """

@beta_tool
def generate_custom_scene(
    scene_index: int,
    jsx_code: str,
    duration_seconds: float,
    description: str
) -> str:
    """Generate a custom Remotion scene from JSX code when no template fits.
    
    Args:
        scene_index: Scene position (0-indexed)
        jsx_code: Valid Remotion React JSX code for the scene component.
                  Must use useCurrentFrame(), interpolate(), spring() for animations.
                  Must use <Img> from 'remotion' for images.
                  Must NOT use CSS transitions or animations.
        duration_seconds: How long this scene should last
        description: Brief description of what the custom scene shows
    
    Returns:
        Confirmation that the custom scene was saved
    """

@beta_tool
def set_transition(
    between_scenes: list[int],
    transition_type: str,
    duration_frames: int
) -> str:
    """Set the transition effect between two adjacent scenes.
    
    Args:
        between_scenes: Pair of scene indices [from_scene, to_scene]
        transition_type: One of: fade, slide-left, slide-right, slide-up, wipe, flip, clock-wipe, none
        duration_frames: Transition duration in frames (at 30fps). Recommended: 15-30
    
    Returns:
        Confirmation of transition setup
    """

@beta_tool
def compose_video(
    video_title: str,
    width: int,
    height: int,
    fps: int
) -> str:
    """Assemble all configured scenes into a final Remotion composition.
    Generates Root.jsx and the composition configuration.
    
    Args:
        video_title: Title/ID for the composition
        width: Video width in pixels (e.g., 1920 or 1080)
        height: Video height in pixels (e.g., 1080 or 1920)
        fps: Frames per second (default 30)
    
    Returns:
        Composition summary with total duration and scene list
    """

@beta_tool
def render_video(
    output_filename: str,
    codec: str,
    quality: int
) -> str:
    """Trigger the final Remotion render to produce the output video.
    
    Args:
        output_filename: Output file name (e.g., "launch-video.mp4")
        codec: Video codec — "h264" (recommended), "h265", "vp8", "vp9"
        quality: CRF quality (0-51, lower = better, 18 recommended)
    
    Returns:
        Render result with output file path and duration
    """
```

#### 3.3 Agent Loop Flow

```python
import anthropic
from anthropic import Anthropic, beta_tool

client = Anthropic()

# The agent loop
runner = client.beta.messages.tool_runner(
    model="claude-sonnet-4-5-20250929",
    max_tokens=8192,
    system=VIDEO_EDITOR_SYSTEM_PROMPT,
    tools=[
        plan_video_structure,
        list_available_assets,
        select_template,
        customize_template,
        generate_custom_scene,
        set_transition,
        compose_video,
        render_video,
    ],
    messages=[
        {
            "role": "user",
            "content": user_prompt_with_asset_info
        }
    ],
)

for message in runner:
    # Each iteration: Claude calls tools, gets results, decides next step
    # Loop continues until Claude stops calling tools (video is rendered)
    log_agent_step(message)
```

#### 3.4 Agent Decision Flow

```
User Prompt → Agent receives prompt + asset list
    │
    ├─→ Calls plan_video_structure() 
    │     → Returns storyboard with scene descriptions
    │
    ├─→ Calls list_available_assets()
    │     → Sees what screenshots/clips are available
    │
    ├─→ For each scene, calls select_template() or generate_custom_scene()
    │     → Picks best template or writes custom JSX
    │
    ├─→ For each template scene, calls customize_template()
    │     → Sets text, images, colors, animation style
    │
    ├─→ Calls set_transition() between adjacent scenes
    │     → Adds fade/slide/wipe transitions
    │
    ├─→ Calls compose_video()
    │     → Generates Root.jsx and composition config
    │
    └─→ Calls render_video()
          → Triggers `npx remotion render` and returns output path
```

---

### Phase 4: Remotion Integration Service

#### 4.1 Code Generation

The `remotion_service.py` module:

1. **Scene Assembly**: Takes the agent's storyboard (list of scenes with templates/custom JSX + props) and generates:
   - A `Root.jsx` that imports all scene components and arranges them in a `<TransitionSeries>`
   - Any custom scene files in `src/generated/`
   - A `video-config.json` with input props for all scenes

2. **Template Resolution**: Maps template names to actual component imports and validates props against Zod schemas

3. **Asset Linking**: Copies/symlinks user assets into `public/` so they're accessible via `staticFile()`

#### 4.2 Render Execution

```python
import subprocess
import json

async def render_video(config: VideoConfig) -> RenderResult:
    # Write props to file
    props_path = REMOTION_PROJECT / "video-config.json"
    props_path.write_text(json.dumps(config.input_props))
    
    # Run Remotion render
    result = subprocess.run(
        [
            "npx", "remotion", "render",
            config.composition_id,
            str(config.output_path),
            f"--props={props_path}",
            f"--codec={config.codec}",
            f"--crf={config.crf}",
        ],
        cwd=str(REMOTION_PROJECT),
        capture_output=True,
        text=True,
        timeout=600,  # 10 min timeout
    )
    
    if result.returncode != 0:
        raise RenderError(result.stderr)
    
    return RenderResult(
        output_path=config.output_path,
        duration_seconds=config.total_duration / config.fps,
    )
```

---

### Phase 5: API Layer

#### 5.1 Endpoints

```
POST /api/assets/upload
  - Accepts multipart file uploads (images, video clips)
  - Stores in backend/uploads/{job_id}/
  - Returns asset IDs and metadata

POST /api/videos/create
  Body: {
    "prompt": "Create a launch video for our AI writing tool...",
    "assets": ["asset_id_1", "asset_id_2"],      // uploaded asset refs
    "local_paths": ["/path/to/screenshot.png"],   // local file refs
    "aspect_ratio": "16:9",                       // or "9:16"
    "target_duration": 30,                        // seconds
    "style_preferences": {                        // optional
      "theme": "dark",
      "primary_color": "#6366f1",
      "font": "Inter"
    }
  }
  Response: { "job_id": "uuid", "status": "queued" }

GET /api/jobs/{job_id}
  Response: {
    "job_id": "uuid",
    "status": "queued|planning|generating|rendering|complete|failed",
    "progress": {
      "current_step": "Customizing scene 3/6",
      "percent": 45
    },
    "storyboard": { ... },        // populated after planning
    "error": null
  }

GET /api/jobs/{job_id}/video
  - Returns the rendered video file
  - 404 if not yet complete

GET /api/templates
  - Lists available scene templates with descriptions and schemas
```

#### 5.2 Job Lifecycle

```
queued → planning → generating → rendering → complete
                                           → failed (with error details)
```

Jobs run as asyncio background tasks. The agent loop executes in a background task while the API returns immediately with a job ID for polling.

---

### Phase 6: Generated Root.jsx Pattern

The system generates a Root.jsx like this for each video:

```jsx
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

// Template imports
import { HeroIntro } from './templates/HeroIntro';
import { FeatureShowcase } from './templates/FeatureShowcase';
import { CallToAction } from './templates/CallToAction';
// Custom scene imports
import { CustomScene2 } from './generated/CustomScene2';

const VideoComposition = (props) => {
  const { scenes, transitions } = props;
  
  return (
    <TransitionSeries>
      {scenes.map((scene, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={scene.durationInFrames}>
            {renderScene(scene)}
          </TransitionSeries.Sequence>
          {transitions[i] && (
            <TransitionSeries.Transition
              presentation={getPresentation(transitions[i].type)}
              timing={linearTiming({ durationInFrames: transitions[i].duration })}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="GeneratedVideo"
      component={VideoComposition}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={require('../video-config.json')}
    />
  );
};

registerRoot(RemotionRoot);
```

---

### Phase 7: Error Handling & Resilience

| Scenario | Handling |
|----------|----------|
| Claude generates invalid JSX | Validate with a quick `npx remotion compositions` check; retry with error feedback |
| Render fails | Capture stderr, feed back to agent for self-correction |
| Asset file not found | Validate all asset references before render; return clear error |
| Render timeout | 10-minute timeout with progress polling |
| Agent infinite loop | Max 20 tool calls per job; abort if exceeded |
| Invalid template props | Zod schema validation before writing config |

---

## Implementation Todos

### Phase 1: Foundation
- **setup-python-project**: Initialize Python project with FastAPI, uvicorn, anthropic SDK, pydantic. Create `requirements.txt` and basic app structure.
- **setup-remotion-project**: Create `remotion_project/` inside backend with Remotion 4.x, React, zod, @remotion/transitions, @remotion/cli. Configure `remotion.config.js`.
- **create-config-module**: Build `config.py` with env var loading (ANTHROPIC_API_KEY, paths, render settings).

### Phase 2: Scene Templates
- **build-shared-components**: Create reusable components: AppWindow, AnimatedText, ImageFrame, GradientBackground.
- **build-hero-intro-template**: HeroIntro scene with title, subtitle, gradient background, spring animations.
- **build-feature-showcase-template**: FeatureShowcase with screenshot display and animated feature callouts.
- **build-screenshot-walkthrough-template**: ScreenshotWalkthrough with pan/zoom Ken Burns effect on screenshots.
- **build-remaining-templates**: TestimonialQuote, StatsCounter, LogoReveal, CallToAction, TextOverlay, SplitScreen, VideoClipScene.
- **build-theme-system**: Color palettes, font loading, and consistent design tokens across templates.

### Phase 3: Agent Core
- **implement-agent-tools**: Define all `@beta_tool` functions with real implementations (plan_video_structure, select_template, customize_template, generate_custom_scene, set_transition, compose_video, render_video, list_available_assets).
- **write-system-prompt**: Craft the video editor system prompt with template catalog, Remotion rules, and creative guidelines.
- **build-orchestrator**: Implement the `tool_runner` agent loop in `orchestrator.py` with state tracking and error handling.
- **build-video-plan-models**: Pydantic models for Storyboard, Scene, Transition, and VideoConfig.

### Phase 4: Services
- **build-asset-manager**: File upload handling, local path resolution, copy-to-public logic, metadata extraction (image dimensions via PIL).
- **build-remotion-service**: Root.jsx generation, custom scene file writing, render invocation via subprocess, output management.
- **build-template-engine**: Template registry, prop validation against Zod schemas, template-to-import mapping.
- **build-job-manager**: Background job tracking with status updates, progress reporting, result storage.

### Phase 5: API Layer
- **build-api-routes**: FastAPI routes for /api/videos/create, /api/assets/upload, /api/jobs/{id}, /api/jobs/{id}/video, /api/templates.
- **build-api-schemas**: Pydantic request/response models for all endpoints.
- **add-cors-and-middleware**: CORS, error handling middleware, request validation.

### Phase 6: Integration & Testing
- **end-to-end-test**: Test full flow: upload assets → create video → poll status → download output.
- **test-template-rendering**: Verify each template renders correctly with sample props.
- **test-agent-loop**: Test agent produces valid storyboards from various prompts.

---

## Key Design Decisions

1. **Python backend + Remotion CLI**: Python orchestrates the agent and API; Remotion renders via `npx remotion render` subprocess calls. This keeps the agent logic in Python (best Anthropic SDK support) while leveraging Remotion's full rendering power.

2. **Hybrid template system**: Pre-built templates handle 80% of scenes (reliable, fast). Custom JSX generation via Claude handles unique/creative requests. The agent decides which to use per scene.

3. **Props-driven composition**: The Remotion project reads all scene configuration from a JSON props file. The Python backend generates this JSON — no manual JSX editing needed for template-based scenes.

4. **TransitionSeries for scene flow**: All scenes are composed using `<TransitionSeries>` from `@remotion/transitions`, enabling professional fade/slide/wipe transitions between scenes.

5. **Agentic loop with tool_runner**: Claude autonomously plans the video, selects templates, customizes props, and triggers rendering through multiple tool calls in a single conversation. No human-in-the-loop required during the creation process.

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
REMOTION_PROJECT_PATH=./remotion_project
UPLOAD_DIR=./uploads
OUTPUT_DIR=./final_vids
MAX_RENDER_TIMEOUT=600
CLAUDE_MODEL=claude-sonnet-4-5-20250929
DEFAULT_FPS=30
DEFAULT_WIDTH=1920
DEFAULT_HEIGHT=1080
```

---

## Getting Started (after implementation)

```bash
# 1. Install Python dependencies
cd backend
pip install -r requirements.txt

# 2. Install Remotion dependencies  
cd remotion_project
npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# 4. Start the server
cd ..
uvicorn app.main:app --reload --port 8000

# 5. Create a video
curl -X POST http://localhost:8000/api/videos/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 30-second launch video for Acme AI, a writing assistant. Show the clean interface, highlight the auto-complete feature, and end with a call to action.",
    "local_paths": ["./screenshots/dashboard.png", "./screenshots/editor.png"],
    "aspect_ratio": "16:9",
    "target_duration": 30
  }'
```
