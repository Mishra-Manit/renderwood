import { AbsoluteFill, Video, useCurrentFrame } from "remotion";
import {
  EDITOR_COMPOSITION_HEIGHT,
  EDITOR_COMPOSITION_WIDTH,
  getDepthVisuals,
  type EditorSceneInputProps,
} from "@/lib/editor-scene";

export function LayeredScene({
  backgroundUrl,
  layers,
}: EditorSceneInputProps) {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 34) * 24;
  const driftY = Math.cos(frame / 48) * 8;

  const sortedLayers = [...layers].sort((a, b) => a.depth - b.depth);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050511", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate3d(${driftX * 0.14}px, ${driftY * 0.08}px, 0) scale(1.02)`,
          transformOrigin: "center center",
        }}
      >
        <Video
          src={backgroundUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {sortedLayers.map((layer) => {
        const visuals = getDepthVisuals(layer);
        const translateX =
          layer.x -
          EDITOR_COMPOSITION_WIDTH / 2 -
          driftX * visuals.parallaxMultiplier;
        const translateY =
          layer.y -
          EDITOR_COMPOSITION_HEIGHT / 2 -
          driftY * visuals.parallaxMultiplier;

        return (
          <AbsoluteFill
            key={layer.id}
            style={{
              zIndex: layer.depth + 1,
              transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${visuals.effectiveScale})`,
              transformOrigin: "center center",
              filter: `drop-shadow(0 ${visuals.shadowOffsetY}px ${visuals.shadowBlur}px rgba(0, 0, 0, ${visuals.shadowOpacity}))`,
            }}
          >
            <Video
              src={layer.url}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        );
      })}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(18, 14, 40, 0.18), transparent 30%, transparent 72%, rgba(4, 3, 12, 0.35))",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}
