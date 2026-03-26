"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { preloadVideo } from "@remotion/preload";
import type { PlayerRef } from "@remotion/player";
import {
  EDITOR_COMPOSITION_HEIGHT,
  EDITOR_COMPOSITION_WIDTH,
  EDITOR_DURATION_FRAMES,
  EDITOR_FPS,
  clientPointToCompositionPoint,
  clamp,
  getDepthLane,
  getStageCenterPoint,
  hitTestLayers,
  type CharacterAsset,
  type DepthLane,
  type SceneLayer,
} from "@/lib/editor-scene";

const DEMO_ASSETS: {
  background: string;
  characters: readonly CharacterAsset[];
} = {
  background: "/demo/background.mp4",
  characters: [
    {
      id: "a",
      name: "Character A",
      thumbnail: "/demo/thumb-a.png",
      url: "/demo/character-a.webm",
      chromaKey: { color: [0, 252, 0] as const, similarity: 0.28, smoothness: 0.12 },
    },
    {
      id: "b",
      name: "Character B",
      thumbnail: "/demo/thumb-b.png",
      url: "/demo/character-b.webm",
      chromaKey: { color: [67, 159, 76] as const, similarity: 0.14, smoothness: 0.06 },
    },
    {
      id: "dog",
      name: "Dog",
      thumbnail: "/demo/thumb-dog.png",
      url: "/demo/character-dog.webm",
      chromaKey: { color: [0, 0, 0] as const, similarity: 0.08, smoothness: 0.02 },
    },
  ],
};

type LayerDragState = {
  layerId: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
} | null;

function makeLayerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSceneLayer(
  character: CharacterAsset,
  point: { x: number; y: number }
): SceneLayer {
  return {
    id: makeLayerId(),
    characterId: character.id,
    name: character.name,
    url: character.url,
    x: point.x,
    y: point.y,
    depth: 2,
    scale: 1,
    chromaKey: character.chromaKey,
  };
}

const INITIAL_LAYER = buildSceneLayer(
  DEMO_ASSETS.characters[0],
  getStageCenterPoint()
);

export function useEditor() {
  const playerRef = useRef<PlayerRef>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flashTimeoutRef = useRef<number | null>(null);

  const [layers, setLayers] = useState<SceneLayer[]>(() => [INITIAL_LAYER]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    INITIAL_LAYER.id
  );
  const [activeCharacterId, setActiveCharacterId] = useState(
    INITIAL_LAYER.characterId
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLayerDragging, setIsLayerDragging] = useState(false);
  const dragStateRef = useRef<LayerDragState>(null);
  const lastCursorPointRef = useRef<{ x: number; y: number } | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [layers, selectedLayerId]
  );

  const selectedDepthInfo = selectedLayer
    ? getDepthLane(selectedLayer.depth)
    : null;

  const sceneLayers = useMemo(
    () =>
      layers
        .map((layer) => {
          const depthInfo = getDepthLane(layer.depth);

          return {
            ...layer,
            depthLabel: depthInfo.label,
            depthHint: depthInfo.hint,
            accent: depthInfo.accent,
            isSelected: layer.id === selectedLayerId,
          };
        })
        .sort((a, b) => b.depth - a.depth),
    [layers, selectedLayerId]
  );

  const triggerFlash = useCallback(() => {
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current);
    }

    setShowFlash(true);
    flashTimeoutRef.current = window.setTimeout(() => {
      setShowFlash(false);
    }, 260);
  }, []);

  useEffect(() => {
    const cleanups = DEMO_ASSETS.characters.map((character) =>
      preloadVideo(character.url)
    );
    cleanups.push(preloadVideo(DEMO_ASSETS.background));

    return () => {
      cleanups.forEach((fn) => fn());

      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const onFrame = (event: { detail: { frame: number } }) => {
      setCurrentFrame(event.detail.frame);
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

  useEffect(() => {
    if (!selectedLayer) {
      return;
    }

    setActiveCharacterId(selectedLayer.characterId);
  }, [selectedLayer]);

  const addCharacterToScene = useCallback(
    (index: number, point: { x: number; y: number }) => {
      const character = DEMO_ASSETS.characters[index];
      if (!character) {
        return;
      }

      const nextLayer = buildSceneLayer(character, point);

      setLayers((prevLayers) => [...prevLayers, nextLayer]);
      setSelectedLayerId(nextLayer.id);
      setActiveCharacterId(character.id);
      triggerFlash();
    },
    [triggerFlash]
  );

  const insertCharacter = useCallback(
    (index: number) => {
      addCharacterToScene(index, getStageCenterPoint());
    },
    [addCharacterToScene]
  );

  const selectLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((sceneLayer) => sceneLayer.id === layerId);
      if (!layer) {
        return;
      }

      setSelectedLayerId(layer.id);
      setActiveCharacterId(layer.characterId);
    },
    [layers]
  );

  const removeLayer = useCallback((layerId: string) => {
    setLayers((prevLayers) => {
      const removedIndex = prevLayers.findIndex((layer) => layer.id === layerId);
      if (removedIndex === -1) {
        return prevLayers;
      }

      const nextLayers = prevLayers.filter((layer) => layer.id !== layerId);

      setSelectedLayerId((currentSelectedLayerId) => {
        if (currentSelectedLayerId !== layerId) {
          return currentSelectedLayerId;
        }

        return nextLayers[Math.max(0, removedIndex - 1)]?.id ?? null;
      });

      return nextLayers;
    });

    dragStateRef.current = null;
    setIsLayerDragging(false);
  }, []);

  const resetSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return;
    }

    setLayers((prevLayers) =>
      prevLayers.map((layer, index) => {
        if (layer.id !== selectedLayerId) {
          return layer;
        }

        const resetPoint = getStageCenterPoint();

        return {
          ...layer,
          x: resetPoint.x,
          y: resetPoint.y,
          depth: 2,
          scale: 1,
        };
      })
    );

    triggerFlash();
  }, [selectedLayerId, triggerFlash]);

  const updateSelectedDepth = useCallback(
    (depth: DepthLane) => {
      if (!selectedLayerId) {
        return;
      }

      setLayers((prevLayers) =>
        prevLayers.map((layer) =>
          layer.id === selectedLayerId
            ? {
                ...layer,
                depth,
              }
            : layer
        )
      );
    },
    [selectedLayerId]
  );

  const updateSelectedScale = useCallback(
    (scale: number) => {
      if (!selectedLayerId) {
        return;
      }

      const nextScale = clamp(scale, 0.4, 2.0);

      setLayers((prevLayers) =>
        prevLayers.map((layer) =>
          layer.id === selectedLayerId
            ? {
                ...layer,
                scale: nextScale,
              }
            : layer
        )
      );
    },
    [selectedLayerId]
  );

  const updateSelectedScalePercent = useCallback(
    (percent: number) => {
      updateSelectedScale(percent / 100);
    },
    [updateSelectedScale]
  );

  const handleDragStart = useCallback(
    (event: ReactDragEvent<HTMLElement>, index: number) => {
      event.dataTransfer.setData("text/plain", String(index));
      event.dataTransfer.effectAllowed = "copy";
      setActiveCharacterId(DEMO_ASSETS.characters[index].id);
      setIsDraggingCharacter(true);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setIsDraggingCharacter(false);
    setIsDragOver(false);
  }, []);

  const handleDropZoneDragOver = useCallback((event: ReactDragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDropZoneDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: ReactDragEvent) => {
      event.preventDefault();

      const index = Number.parseInt(event.dataTransfer.getData("text/plain"), 10);

      if (!Number.isNaN(index)) {
        addCharacterToScene(index, getStageCenterPoint());
      }

      setIsDraggingCharacter(false);
      setIsDragOver(false);
    },
    [addCharacterToScene]
  );

  const handleStagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      lastCursorPointRef.current = clientPointToCompositionPoint(
        event.clientX,
        event.clientY,
        rect
      );
    },
    []
  );

  const handleStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const point = clientPointToCompositionPoint(
        event.clientX,
        event.clientY,
        rect
      );
      const hitLayer = hitTestLayers(point.x, point.y, layers);

      if (!hitLayer) {
        setSelectedLayerId(null);
        return;
      }

      event.preventDefault();

      setSelectedLayerId(hitLayer.id);
      setActiveCharacterId(hitLayer.characterId);
      setIsLayerDragging(true);

      const ds: NonNullable<LayerDragState> = {
        layerId: hitLayer.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: hitLayer.x,
        originY: hitLayer.y,
      };
      dragStateRef.current = ds;

      const onMove = (e: PointerEvent) => {
        const stageRect = stageRef.current?.getBoundingClientRect();
        if (!stageRect) {
          return;
        }

        const deltaX =
          ((e.clientX - ds.startClientX) / stageRect.width) *
          EDITOR_COMPOSITION_WIDTH;
        const deltaY =
          ((e.clientY - ds.startClientY) / stageRect.height) *
          EDITOR_COMPOSITION_HEIGHT;

        setLayers((prevLayers) =>
          prevLayers.map((l) => {
            if (l.id !== ds.layerId) {
              return l;
            }

            const nextPoint = clientPointToCompositionPoint(
              stageRect.left +
                ((ds.originX + deltaX) / EDITOR_COMPOSITION_WIDTH) *
                  stageRect.width,
              stageRect.top +
                ((ds.originY + deltaY) / EDITOR_COMPOSITION_HEIGHT) *
                  stageRect.height,
              stageRect
            );

            return { ...l, x: nextPoint.x, y: nextPoint.y };
          })
        );
      };

      const onUp = () => {
        dragStateRef.current = null;
        setIsLayerDragging(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [layers]
  );

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (player.isPlaying()) {
      player.pause();
      return;
    }

    player.play();
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.pause();
    playerRef.current?.seekTo(0);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  const seekToFraction = useCallback((fraction: number) => {
    const frame = Math.round(
      clamp(fraction, 0, 1) * (EDITOR_DURATION_FRAMES - 1)
    );
    playerRef.current?.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

  const formatTime = useCallback((frame: number) => {
    const totalSeconds = Math.floor(frame / EDITOR_FPS);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    playerRef,
    stageRef,
    fps: EDITOR_FPS,
    durationInFrames: EDITOR_DURATION_FRAMES,
    backgroundUrl: DEMO_ASSETS.background,
    characters: DEMO_ASSETS.characters,
    layers,
    sceneLayers,
    activeCharacterId,
    selectedLayer,
    selectedDepth: selectedLayer?.depth ?? 2,
    selectedDepthLabel: selectedDepthInfo?.label ?? null,
    selectedDepthHint: selectedDepthInfo?.hint ?? null,
    selectedScalePercent: selectedLayer
      ? Math.round(selectedLayer.scale * 100)
      : 100,
    selectedPositionLabel: selectedLayer
      ? `${Math.round(selectedLayer.x)}, ${Math.round(selectedLayer.y)}`
      : null,
    layerCount: layers.length,
    isPlaying,
    currentFrame,
    progressPercent:
      (currentFrame / Math.max(1, EDITOR_DURATION_FRAMES - 1)) * 100,
    timeDisplay: `${formatTime(currentFrame)} / ${formatTime(
      EDITOR_DURATION_FRAMES
    )}`,
    isDraggingCharacter,
    isDragOver,
    isLayerDragging,
    showFlash,
    insertCharacter,
    selectLayer,
    removeLayer,
    resetSelectedLayer,
    updateSelectedDepth,
    updateSelectedScalePercent,
    handleDragStart,
    handleDragEnd,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleDrop,
    handleStagePointerMove,
    handleStagePointerDown,
    togglePlayPause,
    stop,
    seekToFraction,
  };
}
