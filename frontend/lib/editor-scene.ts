export const EDITOR_COMPOSITION_WIDTH = 1920;
export const EDITOR_COMPOSITION_HEIGHT = 1080;
export const EDITOR_FPS = 30;
export const EDITOR_DURATION_SECONDS = 6;
export const EDITOR_DURATION_FRAMES = EDITOR_FPS * EDITOR_DURATION_SECONDS;

export const EDITOR_STAGE_BOUNDS = {
  minX: 120,
  maxX: EDITOR_COMPOSITION_WIDTH - 120,
  minY: 160,
  maxY: EDITOR_COMPOSITION_HEIGHT - 90,
} as const;

export type CharacterAsset = {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
};

export type DepthLane = 0 | 1 | 2 | 3 | 4;

export type SceneLayer = {
  id: string;
  characterId: string;
  name: string;
  url: string;
  x: number;
  y: number;
  depth: DepthLane;
  scale: number;
};

export type EditorSceneInputProps = {
  backgroundUrl: string;
  layers: SceneLayer[];
};

export const DEPTH_LANES = [
  {
    value: 0 as DepthLane,
    label: "Back",
    hint: "Small scale, soft parallax.",
    scaleMultiplier: 0.55,
    parallaxMultiplier: 0.12,
    accent: "#6a76c9",
    shadowBlur: 6,
    shadowOffsetY: 6,
    shadowOpacity: 0.08,
  },
  {
    value: 1 as DepthLane,
    label: "Mid-Back",
    hint: "Sits behind the action.",
    scaleMultiplier: 0.75,
    parallaxMultiplier: 0.35,
    accent: "#7f87e6",
    shadowBlur: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.12,
  },
  {
    value: 2 as DepthLane,
    label: "Mid",
    hint: "Balanced default placement.",
    scaleMultiplier: 1,
    parallaxMultiplier: 0.65,
    accent: "#c2a84c",
    shadowBlur: 14,
    shadowOffsetY: 14,
    shadowOpacity: 0.16,
  },
  {
    value: 3 as DepthLane,
    label: "Mid-Front",
    hint: "Closer with stronger drift.",
    scaleMultiplier: 1.30,
    parallaxMultiplier: 1.0,
    accent: "#f0c85a",
    shadowBlur: 20,
    shadowOffsetY: 20,
    shadowOpacity: 0.22,
  },
  {
    value: 4 as DepthLane,
    label: "Front",
    hint: "Largest scale, strongest parallax.",
    scaleMultiplier: 1.60,
    parallaxMultiplier: 1.4,
    accent: "#ffd978",
    shadowBlur: 28,
    shadowOffsetY: 28,
    shadowOpacity: 0.3,
  },
] as const;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampToStage(x: number, y: number) {
  return {
    x: clamp(x, EDITOR_STAGE_BOUNDS.minX, EDITOR_STAGE_BOUNDS.maxX),
    y: clamp(y, EDITOR_STAGE_BOUNDS.minY, EDITOR_STAGE_BOUNDS.maxY),
  };
}

export function getDepthLane(depth: DepthLane) {
  return DEPTH_LANES[depth] ?? DEPTH_LANES[2];
}

export function getDepthVisuals(layer: Pick<SceneLayer, "depth" | "scale">) {
  const lane = getDepthLane(layer.depth);

  return {
    lane,
    effectiveScale: Number((layer.scale * lane.scaleMultiplier).toFixed(3)),
    parallaxMultiplier: lane.parallaxMultiplier,
    shadowBlur: lane.shadowBlur,
    shadowOffsetY: lane.shadowOffsetY,
    shadowOpacity: lane.shadowOpacity,
  };
}

export function clientPointToCompositionPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect
) {
  const xFraction = clamp((clientX - rect.left) / rect.width, 0, 1);
  const yFraction = clamp((clientY - rect.top) / rect.height, 0, 1);

  return clampToStage(
    xFraction * EDITOR_COMPOSITION_WIDTH,
    yFraction * EDITOR_COMPOSITION_HEIGHT
  );
}

export function getDefaultInsertPoint(existingLayerCount: number) {
  const columnOffset = ((existingLayerCount % 5) - 2) * 90;
  const rowOffset = (existingLayerCount % 2) * 28;

  return clampToStage(
    EDITOR_COMPOSITION_WIDTH / 2 + columnOffset,
    EDITOR_COMPOSITION_HEIGHT * 0.7 - rowOffset
  );
}
