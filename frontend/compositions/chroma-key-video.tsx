import { useCallback, useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig, Video } from "remotion";

type ChromaKeyConfig = {
  color: readonly [number, number, number];
  similarity: number;
  smoothness: number;
};

export function ChromaKeyVideo({
  src,
  chromaKey,
  style,
}: {
  src: string;
  chromaKey: ChromaKeyConfig;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return false;
    }

    const video = container.querySelector("video");
    if (!video || video.readyState < 2) {
      return false;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return false;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(video, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    const [kr, kg, kb] = chromaKey.color;
    const simThreshold = chromaKey.similarity * 441.67;
    const smoothRange = chromaKey.smoothness * 441.67;

    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - kr;
      const dg = data[i + 1] - kg;
      const db = data[i + 2] - kb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < simThreshold) {
        data[i + 3] = 0;
      } else if (dist < simThreshold + smoothRange) {
        data[i + 3] = Math.round(
          ((dist - simThreshold) / smoothRange) * 255
        );
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return true;
  }, [chromaKey, width, height]);

  useEffect(() => {
    let cancelled = false;

    function attempt(remaining: number) {
      if (cancelled || remaining <= 0) {
        return;
      }

      if (!processFrame()) {
        setTimeout(() => attempt(remaining - 1), 32);
      }
    }

    requestAnimationFrame(() => attempt(20));

    return () => {
      cancelled = true;
    };
  }, [frame, processFrame]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <Video
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={style}
      />
    </div>
  );
}
