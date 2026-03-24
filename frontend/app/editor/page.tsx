"use client";

import type { MouseEvent } from "react";
import { useMemo } from "react";
import { Player } from "@remotion/player";
import { AnimatePresence, motion } from "framer-motion";
import { WindowFrame } from "@/components/home/window-frame";
import { LayeredScene } from "@/compositions/layered-scene";
import { useEditor } from "@/hooks/use-editor";

export default function EditorPage() {
  const editor = useEditor();

  const inputProps = useMemo(
    () => ({
      backgroundUrl: editor.backgroundUrl,
      characterUrl: editor.selectedCharacterUrl,
    }),
    [editor.backgroundUrl, editor.selectedCharacterUrl]
  );

  function handleProgressClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    editor.seekToFraction(Math.max(0, Math.min(1, fraction)));
  }

  return (
    <div className="editor-page">
      <WindowFrame
        title="Renderwood Video Editor"
        menuItems={["File", "Edit", "View", "Help"]}
        statusLeft={
          editor.isDragging
            ? "Drop character on preview..."
            : editor.isPlaying
              ? "Playing"
              : "Ready"
        }
        statusRight={editor.timeDisplay}
      >
        <div className="editor-layout">
          {/* Character select panel */}
          <div className="editor-sidebar">
            <div className="editor-sidebar-title">Character Select</div>
            <div className="editor-sidebar-list">
              {editor.characters.map((character, index) => {
                const isActive = index === editor.selectedIndex;
                return (
                  <div
                    key={character.id}
                    draggable
                    onDragStart={(e) => editor.handleDragStart(e, index)}
                    onDragEnd={editor.handleDragEnd}
                    onClick={() => editor.selectCharacter(index)}
                    className={[
                      "editor-character-card",
                      isActive ? "active" : "",
                    ].join(" ")}
                  >
                    <img
                      src={character.thumbnail}
                      alt={character.name}
                      className="editor-character-thumb"
                      draggable={false}
                    />
                    <span className="editor-character-name">
                      {character.name}
                    </span>
                    <span className="editor-character-hint">
                      {isActive ? "SELECTED" : "Drag to swap"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video preview + drop zone */}
          <div
            className="editor-player-area"
            onDragOver={editor.handleDropZoneDragOver}
            onDragLeave={editor.handleDropZoneDragLeave}
            onDrop={editor.handleDrop}
          >
            <div className="video-viewer-area">
              <div className="video-player-wrapper" style={{ position: "relative" }}>
                <Player
                  ref={editor.playerRef}
                  component={LayeredScene}
                  inputProps={inputProps}
                  durationInFrames={editor.durationInFrames}
                  fps={editor.fps}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  style={{ width: "100%", height: "100%" }}
                />

                {/* Drop zone overlay */}
                <AnimatePresence>
                  {editor.isDragging && (
                    <motion.div
                      className={`editor-drop-zone ${editor.isDragOver ? "hovering" : ""}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="editor-drop-zone-inner">
                        <span className="editor-drop-zone-icon">
                          {editor.isDragOver ? "\u2B07" : "\u2195"}
                        </span>
                        <span className="editor-drop-zone-text">
                          {editor.isDragOver
                            ? "Release to swap character"
                            : "Drop character here"}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Flash on swap */}
                <AnimatePresence>
                  {editor.showFlash && (
                    <motion.div
                      className="editor-flash"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="video-controls-bar">
                <div className="video-controls-left">
                  <button
                    type="button"
                    className="video-ctrl-btn"
                    aria-label={editor.isPlaying ? "Pause" : "Play"}
                    onClick={editor.togglePlayPause}
                  >
                    {editor.isPlaying ? "\u275A\u275A" : "\u25B6"}
                  </button>
                  <button
                    type="button"
                    className="video-ctrl-btn"
                    aria-label="Stop"
                    onClick={editor.stop}
                  >
                    &#9632;
                  </button>
                  <span className="video-time-display">
                    {editor.timeDisplay}
                  </span>
                </div>
                <div className="video-progress">
                  <div
                    className="video-progress-track"
                    onClick={handleProgressClick}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="video-progress-fill"
                      style={{ width: `${editor.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
}
