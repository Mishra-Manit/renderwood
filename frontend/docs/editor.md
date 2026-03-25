# Video Editor — Architecture & Decisions

This document covers the design, file structure, key decisions, and bugs found/fixed during the initial build of the Renderwood video editor (`/editor` route).

---

## Overview

The editor is a browser-based, Remotion-powered scene composer. A user picks characters, places them on a stage, adjusts depth/scale, and previews a 6-second animated video composition in real time. Everything is wired to the demo assets in `public/demo/`.

---

## File Map

| File | Role |
|------|------|
| `lib/editor-scene.ts` | Types, constants, pure utility functions. No React. |
| `hooks/use-editor.ts` | All editor state and event logic. Single source of truth. |
| `compositions/layered-scene.tsx` | Remotion composition — renders background + character layers. |
| `app/editor/page.tsx` | UI shell — Player, stage handles, HUD panels, controls. |

---

## lib/editor-scene.ts

Single non-React file that everything imports from. Contains:

- **Composition constants** — `EDITOR_COMPOSITION_WIDTH = 1920`, `EDITOR_COMPOSITION_HEIGHT = 1080`, `EDITOR_FPS = 30`, `EDITOR_DURATION_SECONDS = 6`
- **Stage bounds** — `minX: 120, maxX: 1800, minY: 160, maxY: 990`. Keeps characters from being placed too close to the edge.
- **Types** — `CharacterAsset`, `DepthLane` (0–4), `SceneLayer`, `EditorSceneInputProps`
- **`DEPTH_LANES`** — Array of 5 lane configs. Each lane has a `scaleMultiplier`, `parallaxMultiplier`, accent color, and shadow values. Lane 2 (Mid) is the neutral default.
- **Utilities** — `clamp`, `clampToStage`, `getDepthLane`, `getDepthVisuals`, `clientPointToCompositionPoint`, `getDefaultInsertPoint`

### `getDefaultInsertPoint`
Places characters in a staggered grid on first insert. Column offset = `((count % 5) - 2) * 90`, row offset = `(count % 2) * 28`. This avoids all characters stacking at the exact same coordinate.

### `clientPointToCompositionPoint`
Converts a browser pointer event (clientX/clientY) into composition-space coordinates (0–1920, 0–1080) using the stage element's `getBoundingClientRect`. Result is clamped to stage bounds.

---

## hooks/use-editor.ts

All state lives here. The page is a thin renderer on top of this hook.

### DEMO_ASSETS
Hardcoded to the files in `public/demo/`:
```
background:   /demo/background.mp4
character A:  url=/demo/character-a.webm  thumbnail=/demo/thumb-a.png
character B:  url=/demo/character-b.webm  thumbnail=/demo/thumb-b.png
```
Swapping in dynamic/user-uploaded assets later means replacing this object.

### State
| State | Type | Purpose |
|-------|------|---------|
| `layers` | `SceneLayer[]` | The full layer stack |
| `selectedLayerId` | `string \| null` | Which layer the inspector controls |
| `activeCharacterId` | `string` | Which character card is highlighted |
| `isPlaying` | `boolean` | Playback state |
| `currentFrame` | `number` | Current frame from Player events |
| `isDraggingCharacter` | `boolean` | HTML drag from character card |
| `isDragOver` | `boolean` | Drag-over on stage drop zone |
| `isLayerDragging` | `boolean` | Pointer-drag on a stage handle |
| `dragState` | `LayerDragState \| null` | Active pointer drag origin data |
| `showFlash` | `boolean` | Brief white flash on character add |

### Preloading
On mount, `preloadVideo` (from `@remotion/preload`) is called for all character URLs and the background. This primes the browser's media cache before the Remotion Player requests them.

### Layer drag
Uses `pointermove` / `pointerup` / `pointercancel` on `window` (not on the element) to track drag even when the pointer leaves the stage. Delta is computed as a fraction of the stage rect and projected into composition coordinates.

### Player event bridge
The hook attaches `frameupdate`, `play`, `pause`, `ended` listeners to the Remotion `PlayerRef`. `frameupdate` keeps `currentFrame` in sync for the progress bar. This is the only place the Player ref is used directly.

### Computed / derived
- `sceneLayers` — layers sorted back-to-front (depth descending for painter's order), each annotated with `depthLabel`, `depthHint`, `accent`, `isSelected`
- `stageHandles` — sceneLayers mapped to percent positions (`leftPercent`, `topPercent`) for the CSS overlay markers
- `selectedDepthInfo` — the current depth lane config for the inspector

### Immutability
All state updates use spread/filter/map — no mutation. `setLayers((prev) => prev.map(...))` pattern throughout.

---

## compositions/layered-scene.tsx

The Remotion composition that gets passed to `<Player>`. Receives `EditorSceneInputProps` (`backgroundUrl`, `layers`).

### Camera drift
```ts
const driftX = Math.sin(frame / 34) * 24;
const driftY = Math.cos(frame / 48) * 8;
```
Slow sine/cosine oscillation drives a subtle parallax shift every frame. Different lanes have different `parallaxMultiplier` values so closer layers move more.

### Background
The background video is wrapped in its own `AbsoluteFill` with a slight scale(1.02) + drift transform to avoid edge gaps when drifting.

### Character layers
Layers are sorted back-to-front (ascending depth). Each layer:
1. Gets `getDepthVisuals()` — effective scale and parallax multiplier
2. `translateX = layer.x - compositionCenterX - driftX * parallaxMultiplier`
3. `translateY = layer.y - compositionCenterY - driftY * parallaxMultiplier`
4. Rendered in an `AbsoluteFill` with those transforms + drop-shadow

The AbsoluteFill approach means the `<Video>` inside it fills 1920x1080, but the transform moves the AbsoluteFill's origin so the character appears at `(layer.x, layer.y)` in composition space.

### Vignette overlay
A gradient `AbsoluteFill` on top of everything adds a darkened top and bottom edge. `pointerEvents: none` so it doesn't interfere with interaction.

---

## app/editor/page.tsx

### Layout
```
WindowFrame
  └── .ev2 (flex column)
        ├── .ev2-stage (flex: 1)
        │    ├── .ev2-viewport (flex: 1, overflow: hidden, position: relative)
        │    │    ├── [absolute wrapper div]
        │    │    │    └── <Player />
        │    │    ├── .ev2-markers (absolute overlay, z-index 6)
        │    │    ├── drop zone overlay (AnimatePresence)
        │    │    └── flash overlay (AnimatePresence)
        │    └── .video-controls-bar
        └── .ev2-hud
              ├── .ev2-panel (Select)
              ├── .ev2-panel (Layers)
              └── .ev2-panel.ev2-panel-grow (Inspector)
```

### Stage handles (markers)
`.ev2-markers` is an absolute overlay covering the Player, `pointer-events: none` on the container but `pointer-events: auto` on each button. Each button is positioned by `left: ${h.leftPercent}%` / `top: ${h.topPercent}%` with `transform: translate(-50%, -50%)` to center it on the layer coordinate.

### inputProps memoization
`inputProps` is memoized on `editor.backgroundUrl` and `editor.layers`. This is important — passing a new object reference every render would cause Remotion to re-mount the composition unnecessarily.

### charactersOnStage
A `Map<characterId, count>` computed per render from the layer list. Used to show the badge count on character cards.

---

## Bug: Player rendered black (height: 0px)

### Symptom
The Remotion Player rendered nothing — completely black stage. Videos were present in the DOM, `readyState: 4`, no errors. Background color from the composition (`#050511`) was visible but no video content.

### Root cause
`ev2-viewport` gets its height from flex layout (`flex: 1` inside `.ev2-stage`). Flex-computed heights do not resolve `height: 100%` on children in the same way as explicit CSS `height` values. The Remotion Player's outer container uses `height: 100%`, which resolved to `0px`. Remotion then rendered the 1920x1080 composition into a zero-height container with `overflow: hidden`, clipping all video content.

Confirmed via:
```js
getComputedStyle(playerOuterContainer).height // "0px"
```

### Fix
Wrapped the `<Player>` in a `position: absolute; inset: 0` div inside `ev2-viewport`:

```tsx
<div ref={editor.stageRef} className="ev2-viewport">
  <div style={{ position: "absolute", inset: 0 }}>
    <Player ... style={{ width: "100%", height: "100%" }} />
  </div>
  ...
```

`position: absolute; inset: 0` sizes the wrapper against `ev2-viewport` (which is `position: relative`), giving it a real pixel height. The Player's `height: 100%` then resolves correctly.

### Lesson
When placing a Remotion `<Player>` inside a flex-only height container, always give it an absolutely-positioned wrapper or an explicit pixel/vh height. `height: 100%` is unreliable when the parent's height is flex-derived with no explicit value.

---

## Asset conventions

All demo assets live in `public/demo/`:
- `background.mp4` — looping field/sky footage
- `character-a.webm` — Character A with alpha transparency
- `character-b.webm` — Character B with alpha transparency
- `thumb-a.png` / `thumb-b.png` — HUD thumbnail images

Asset paths are defined once in `DEMO_ASSETS` in `use-editor.ts`. To add a new character, add an entry there — the rest of the UI (cards, layers, stage) derives from that array.

---

## Composition dimensions

All coordinates in `SceneLayer` are in composition space (1920x1080). The Remotion Player scales the composition to fit the `ev2-viewport` container. The `clientPointToCompositionPoint` utility handles the conversion when the user drops or clicks on the stage.
