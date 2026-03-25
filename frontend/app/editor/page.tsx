"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useMemo } from "react";
import { Player } from "@remotion/player";
import { AnimatePresence, motion } from "framer-motion";
import { WindowFrame } from "@/components/home/window-frame";
import { LayeredScene } from "@/compositions/layered-scene";
import { useEditor } from "@/hooks/use-editor";
import { DEPTH_LANES } from "@/lib/editor-scene";

export default function EditorPage() {
  const editor = useEditor();

  const inputProps = useMemo(
    () => ({ backgroundUrl: editor.backgroundUrl, layers: editor.layers }),
    [editor.backgroundUrl, editor.layers]
  );

  const charactersOnStage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const layer of editor.layers) {
      counts.set(layer.characterId, (counts.get(layer.characterId) ?? 0) + 1);
    }
    return counts;
  }, [editor.layers]);

  function handleProgressClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    editor.seekToFraction(
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    );
  }

  const statusLeft = editor.isDraggingCharacter
    ? "Drop onto the stage..."
    : editor.isLayerDragging
      ? "Repositioning..."
      : editor.selectedLayer
        ? `${editor.selectedLayer.name} \u00b7 ${editor.selectedDepthLabel}`
        : "Select a character to begin.";

  const statusRight = `${editor.layerCount} layer${
    editor.layerCount === 1 ? "" : "s"
  } \u00b7 ${editor.timeDisplay}`;

  return (
    <div className="editor-page">
      <WindowFrame
        title="Renderwood Video Editor"
        menuItems={["File", "Edit", "View", "Help"]}
        statusLeft={statusLeft}
        statusRight={statusRight}
      >
        <div className="ev2">
          {/* Stage */}
          <div
            className="ev2-stage"
            onDragOver={editor.handleDropZoneDragOver}
            onDragLeave={editor.handleDropZoneDragLeave}
            onDrop={editor.handleDrop}
          >
            <div ref={editor.stageRef} className="ev2-viewport">
              <div style={{ position: "absolute", inset: 0 }}>
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
              </div>

              <div className="ev2-markers">
                {editor.stageHandles.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`ev2-mk${h.isSelected ? " on" : ""}`}
                    style={
                      {
                        left: `${h.leftPercent}%`,
                        top: `${h.topPercent}%`,
                        zIndex: h.zIndex,
                        "--c": h.accent,
                      } as CSSProperties
                    }
                    onClick={() => editor.selectLayer(h.id)}
                    onPointerDown={(e) =>
                      editor.handleLayerPointerDown(h.id, e)
                    }
                  >
                    <span className="ev2-mk-ring" />
                    <span className="ev2-mk-char">{h.name.slice(-1)}</span>
                  </button>
                ))}
              </div>

              {editor.layerCount === 0 && (
                <div className="ev2-nil">
                  Pick a character below to begin
                </div>
              )}

              <AnimatePresence>
                {editor.isDraggingCharacter && (
                  <motion.div
                    className={`ev2-drop${editor.isDragOver ? " over" : ""}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {editor.isDragOver ? "Release to place" : "Drop here"}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {editor.showFlash && (
                  <motion.div
                    className="ev2-flash"
                    initial={{ opacity: 0.45 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
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
                  {editor.isPlaying ? "\u275a\u275a" : "\u25b6"}
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

          {/* Bottom HUD */}
          <div className="ev2-hud">
            {/* Character select */}
            <div className="ev2-panel">
              <span className="ev2-tag">Select</span>
              <div className="ev2-cards">
                {editor.characters.map((ch, i) => {
                  const count = charactersOnStage.get(ch.id) ?? 0;
                  return (
                    <div
                      key={ch.id}
                      draggable
                      onDragStart={(e) => editor.handleDragStart(e, i)}
                      onDragEnd={editor.handleDragEnd}
                      onClick={() => editor.insertCharacter(i)}
                      className={`ev2-card${
                        ch.id === editor.activeCharacterId ? " active" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          editor.insertCharacter(i);
                        }
                      }}
                    >
                      <div className="ev2-card-frame">
                        <img
                          src={ch.thumbnail}
                          alt={ch.name}
                          className="ev2-card-img"
                          draggable={false}
                        />
                        {count > 0 && (
                          <span className="ev2-card-badge">{count}</span>
                        )}
                      </div>
                      <span className="ev2-card-name">{ch.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ev2-sep" />

            {/* Layers */}
            <div className="ev2-panel">
              <span className="ev2-tag">Layers</span>
              <div className="ev2-chips">
                {editor.sceneLayers.length > 0 ? (
                  editor.sceneLayers.map((ly) => (
                    <div
                      key={ly.id}
                      className={`ev2-chip${ly.isSelected ? " on" : ""}`}
                      style={{ "--c": ly.accent } as CSSProperties}
                    >
                      <button
                        type="button"
                        className="ev2-chip-btn"
                        onClick={() => editor.selectLayer(ly.id)}
                      >
                        <span className="ev2-chip-dot" />
                        <span>{ly.name}</span>
                      </button>
                      <button
                        type="button"
                        className="ev2-chip-del"
                        aria-label={`Remove ${ly.name}`}
                        onClick={() => editor.removeLayer(ly.id)}
                      >
                        x
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="ev2-empty">No layers</span>
                )}
              </div>
            </div>

            <div className="ev2-sep" />

            {/* Inspector */}
            <div className="ev2-panel ev2-panel-grow">
              {editor.selectedLayer ? (
                <>
                  <span className="ev2-tag">
                    {editor.selectedLayer.name} &middot;{" "}
                    {editor.selectedDepthLabel}
                  </span>
                  <div className="ev2-controls">
                    <div className="ev2-ctrl">
                      <span className="ev2-ctrl-label">Depth</span>
                      <div className="ev2-lanes">
                        {DEPTH_LANES.map((lane) => (
                          <button
                            key={lane.value}
                            type="button"
                            className={`ev2-lane${
                              editor.selectedDepth === lane.value ? " on" : ""
                            }`}
                            style={{ "--c": lane.accent } as CSSProperties}
                            onClick={() =>
                              editor.updateSelectedDepth(lane.value)
                            }
                            title={`${lane.label} \u2014 ${lane.hint}`}
                          >
                            {lane.value + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ev2-ctrl">
                      <span className="ev2-ctrl-label">Scale</span>
                      <div className="ev2-scale-row">
                        <button
                          type="button"
                          className="ev2-sc-btn"
                          onClick={() =>
                            editor.updateSelectedScalePercent(
                              Math.max(80, editor.selectedScalePercent - 5)
                            )
                          }
                        >
                          &minus;
                        </button>
                        <span className="ev2-sc-val">
                          {editor.selectedScalePercent}%
                        </span>
                        <button
                          type="button"
                          className="ev2-sc-btn"
                          onClick={() =>
                            editor.updateSelectedScalePercent(
                              Math.min(135, editor.selectedScalePercent + 5)
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="ev2-acts">
                      <button
                        type="button"
                        className="ev2-act"
                        onClick={editor.resetSelectedLayer}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className="ev2-act danger"
                        onClick={() => {
                          if (editor.selectedLayer) {
                            editor.removeLayer(editor.selectedLayer.id);
                          }
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <span className="ev2-empty">Select a layer on stage</span>
              )}
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
}
