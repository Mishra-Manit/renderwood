import type { MouseEvent, RefObject } from "react";
import { VIDEO_WINDOW_MENU } from "@/components/home/constants";
import { formatTime } from "@/components/home/utils";
import { WindowFrame } from "@/components/home/window-frame";

type VideoPreviewWindowProps = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  progressPercent: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  onEnded: () => void;
  onFullscreen: () => void;
  onLoadedMetadata: (duration: number) => void;
  onPause: () => void;
  onPlay: () => void;
  onProgressClick: (event: MouseEvent<HTMLDivElement>) => void;
  onStop: () => void;
  onTimeUpdate: (currentTime: number) => void;
  onTogglePlayPause: () => void;
};

export function VideoPreviewWindow({
  currentTime,
  duration,
  isPlaying,
  progressPercent,
  videoRef,
  videoUrl,
  onEnded,
  onFullscreen,
  onLoadedMetadata,
  onPause,
  onPlay,
  onProgressClick,
  onStop,
  onTimeUpdate,
  onTogglePlayPause,
}: VideoPreviewWindowProps) {
  return (
    <main className="main-container">
      <WindowFrame
        title="Output - Video Preview"
        menuItems={VIDEO_WINDOW_MENU}
        statusLeft={
          videoUrl ? (isPlaying ? "Playing" : "Video loaded") : "No video loaded"
        }
        statusRight="RenderWood Player"
      >
        <div className="video-viewer-area">
          <div className="video-player-wrapper">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                onPlay={onPlay}
                onPause={onPause}
                onTimeUpdate={(event) =>
                  onTimeUpdate(event.currentTarget.currentTime)
                }
                onLoadedMetadata={(event) =>
                  onLoadedMetadata(event.currentTarget.duration)
                }
                onEnded={onEnded}
              />
            ) : (
              <div className="video-placeholder">
                <div className="video-placeholder-icon">
                  <img
                    src="https://win98icons.alexmeub.com/icons/png/media_player_stream_sun-4.png"
                    alt="Video"
                    style={{
                      width: "64px",
                      height: "64px",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
                <p className="video-placeholder-text">
                  Your generated video will appear here.
                </p>
                <p className="video-placeholder-hint">
                  Enter a prompt above and click send to generate.
                </p>
              </div>
            )}
          </div>
          <div className="video-controls-bar">
            <div className="video-controls-left">
              <button
                type="button"
                className="video-ctrl-btn"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={onTogglePlayPause}
                disabled={!videoUrl}
              >
                {isPlaying ? "\u275A\u275A" : "\u25B6"}
              </button>
              <button
                type="button"
                className="video-ctrl-btn"
                aria-label="Stop"
                onClick={onStop}
                disabled={!videoUrl}
              >
                &#9632;
              </button>
              <span className="video-time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="video-progress">
              <div
                className="video-progress-track"
                onClick={onProgressClick}
                style={{ cursor: videoUrl ? "pointer" : "default" }}
              >
                <div
                  className="video-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="video-controls-right">
              <button
                type="button"
                className="video-ctrl-btn"
                aria-label="Fullscreen"
                onClick={onFullscreen}
              >
                &#9634;
              </button>
            </div>
          </div>
        </div>
      </WindowFrame>
    </main>
  );
}
