"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import {
  createVideo,
  deleteUpload,
  getVideoUrl,
  listUploads,
  listVideoStyles,
  uploadFile,
} from "@/lib/api";
import type { UploadedFile, VideoStyle, VideoStyleOption } from "@/lib/api";
import { DEFAULT_VIDEO_STYLE_OPTIONS } from "@/components/home/constants";
import type { WindowType } from "@/components/home/types";

export function useRenderwoodApp() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [openWindow, setOpenWindow] = useState<WindowType>(null);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingDocs, setDeletingDocs] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileDescription, setFileDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoStyles, setVideoStyles] = useState<VideoStyleOption[]>(
    DEFAULT_VIDEO_STYLE_OPTIONS,
  );
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>("general");
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [clockText, setClockText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSubmittedPromptRef = useRef<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const styleMenuRef = useRef<HTMLDivElement | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const files = await listUploads();
      setDocuments(files);
    } catch {
      // Ignore transient backend or empty-upload-dir failures.
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    let cancelled = false;

    void listVideoStyles()
      .then((styles) => {
        if (!cancelled && styles.length > 0) {
          setVideoStyles(styles);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideoStyles(DEFAULT_VIDEO_STYLE_OPTIONS);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    };

    updateClock();

    const intervalId = window.setInterval(updateClock, 10_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleGlobalClick = useEffectEvent((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest(".start-btn") && !target.closest(".start-menu")) {
      setIsStartMenuOpen(false);
    }

    if (styleMenuRef.current && !styleMenuRef.current.contains(target)) {
      setIsStyleMenuOpen(false);
    }
  });

  useEffect(() => {
    const onClick = (event: MouseEvent) => handleGlobalClick(event);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [handleGlobalClick]);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setPendingFiles(Array.from(files));
      setFileDescription("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const handleConfirmUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return;

    const filesToUpload = [...pendingFiles];
    const description = fileDescription.trim();

    setPendingFiles([]);
    setFileDescription("");
    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        await uploadFile(file, description);
      }

      await fetchDocuments();

      toast(
        filesToUpload.length === 1
          ? `"${filesToUpload[0].name}" uploaded`
          : `${filesToUpload.length} files uploaded`,
        { description: "Files are ready in My Uploads." },
      );
    } catch {
      toast("Upload failed", {
        description: "Could not upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }, [fetchDocuments, fileDescription, pendingFiles]);

  const handleCancelUpload = useCallback(() => {
    setPendingFiles([]);
    setFileDescription("");
  }, []);

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      setDeletingDocs((current) =>
        current.includes(filename) ? current : [...current, filename],
      );

      window.setTimeout(() => {
        setDocuments((current) => current.filter((doc) => doc.name !== filename));
        setDeletingDocs((current) =>
          current.filter((currentName) => currentName !== filename),
        );
      }, 180);

      try {
        await deleteUpload(filename);
      } catch {
        toast("Delete failed", {
          description: "Could not remove the file. Please try again.",
        });
        await fetchDocuments();
      }
    },
    [fetchDocuments],
  );

  const openWindowHandler = useCallback(
    (windowType: Exclude<WindowType, null>) => {
      if (windowType === "documents") {
        void fetchDocuments();
      }

      setOpenWindow(windowType);
    },
    [fetchDocuments],
  );

  const closeWindowHandler = useCallback(() => {
    setOpenWindow(null);
  }, []);

  const submitPrompt = useCallback(async (value: string, style: VideoStyle) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === lastSubmittedPromptRef.current) {
      return;
    }

    lastSubmittedPromptRef.current = trimmed;
    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createVideo(trimmed, style, controller.signal);

      if (result.status === "failed") {
        setSubmitError(result.error ?? "Video request failed.");
        lastSubmittedPromptRef.current = null;
        return;
      }

      setVideoUrl(getVideoUrl(result.job_id));
      toast("Video ready", {
        description: "Your generated video is now available to view.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setSubmitError(
        error instanceof Error ? error.message : "Failed to send prompt.",
      );
      lastSubmittedPromptRef.current = null;
    } finally {
      if (requestControllerRef.current === controller) {
        setIsSubmitting(false);
      }
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }, []);

  const handleStop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }, []);

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );

      video.currentTime = ratio * duration;
    },
    [duration],
  );

  const handleFullscreen = useCallback(() => {
    if (!videoUrl) {
      toast("No video generated yet");
      return;
    }

    void videoRef.current?.requestFullscreen();
  }, [videoUrl]);

  const showSystemNotification = useCallback(() => {
    toast("System notification", {
      description: "All systems operational. RenderWood is running.",
    });
  }, []);

  const statusLabel = submitError
    ? "Error sending prompt"
    : isSubmitting
      ? "Submitting..."
      : "Ready";
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isTrailerSelected = selectedStyle === "trailer";

  return {
    clockText,
    closeWindowHandler,
    currentTime,
    deletingDocs,
    documents,
    duration,
    fileDescription,
    fileInputRef,
    handleCancelUpload,
    handleConfirmUpload,
    handleDeleteFile,
    handleFileUpload,
    handleFullscreen,
    handlePlayPause,
    handleProgressClick,
    handleStop,
    isPlaying,
    isStartMenuOpen,
    isStyleMenuOpen,
    isSubmitting,
    isTrailerSelected,
    isUploading,
    openWindow,
    openWindowHandler,
    pendingFiles,
    progressPercent,
    prompt,
    selectedStyle,
    setCurrentTime,
    setDuration,
    setFileDescription,
    setIsPlaying,
    setIsStartMenuOpen,
    setIsStyleMenuOpen,
    setPrompt,
    setSelectedStyle,
    showSystemNotification,
    statusLabel,
    styleMenuRef,
    submitPrompt,
    submitError,
    videoRef,
    videoStyles,
    videoUrl,
  };
}
