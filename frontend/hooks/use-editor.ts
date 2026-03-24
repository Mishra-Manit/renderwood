"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preloadVideo } from "@remotion/preload";
import type { PlayerRef } from "@remotion/player";

const DEMO_ASSETS = {
  background: "/demo/background.mp4",
  characters: [
    { id: "a", name: "Character A", thumbnail: "/demo/thumb-a.png", url: "/demo/character-a.webm" },
    { id: "b", name: "Character B", thumbnail: "/demo/thumb-b.png", url: "/demo/character-b.webm" },
  ],
} as const;

const FPS = 30;
const DURATION_SECONDS = 6;
const DURATION_FRAMES = FPS * DURATION_SECONDS;

export function useEditor() {
  const playerRef = useRef<PlayerRef>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const cleanups = DEMO_ASSETS.characters.map((c) => preloadVideo(c.url));
    cleanups.push(preloadVideo(DEMO_ASSETS.background));
    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentFrame(0);
    };

    player.addEventListener("frameupdate", onFrame as never);
    player.addEventListener("play", onPlay as never);
    player.addEventListener("pause", onPause as never);
    player.addEventListener("ended", onEnded as never);

    return () => {
      player.removeEventListener("frameupdate", onFrame as never);
      player.removeEventListener("play", onPlay as never);
      player.removeEventListener("pause", onPause as never);
      player.removeEventListener("ended", onEnded as never);
    };
  }, []);

  const selectCharacter = useCallback((index: number) => {
    if (index === selectedIndex) return;
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    const wasPlaying = playerRef.current?.isPlaying() ?? false;
    setSelectedIndex(index);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    requestAnimationFrame(() => {
      playerRef.current?.seekTo(frame);
      if (wasPlaying) {
        playerRef.current?.play();
      }
    });
  }, [selectedIndex]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsDragOver(false);
  }, []);

  const handleDropZoneDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDropZoneDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const index = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(index)) {
      selectCharacter(index);
    }
    setIsDragging(false);
    setIsDragOver(false);
  }, [selectCharacter]);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.pause();
    playerRef.current?.seekTo(0);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  const seekToFraction = useCallback((fraction: number) => {
    const frame = Math.round(fraction * DURATION_FRAMES);
    playerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

  const formatTime = useCallback((frame: number) => {
    const totalSeconds = Math.floor(frame / FPS);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    playerRef,
    fps: FPS,
    durationInFrames: DURATION_FRAMES,
    backgroundUrl: DEMO_ASSETS.background,
    characters: DEMO_ASSETS.characters,
    selectedIndex,
    selectedCharacterUrl: DEMO_ASSETS.characters[selectedIndex].url,
    isPlaying,
    currentFrame,
    progressPercent: (currentFrame / DURATION_FRAMES) * 100,
    timeDisplay: `${formatTime(currentFrame)} / ${formatTime(DURATION_FRAMES)}`,
    isDragging,
    isDragOver,
    showFlash,
    selectCharacter,
    handleDragStart,
    handleDragEnd,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleDrop,
    togglePlayPause,
    stop,
    seekToFraction,
  };
}
