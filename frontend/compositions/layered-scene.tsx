import { AbsoluteFill, Video } from "remotion";

type LayeredSceneProps = {
  backgroundUrl: string;
  characterUrl: string;
};

export function LayeredScene({
  backgroundUrl,
  characterUrl,
}: LayeredSceneProps) {
  return (
    <AbsoluteFill>
      <Video
        src={backgroundUrl}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill>
        <Video
          src={characterUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
