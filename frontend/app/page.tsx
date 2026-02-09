"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  createVideo,
  listUploads,
  listVideoStyles,
  uploadFile,
  deleteUpload,
  getUploadUrl,
  getVideoUrl,
} from "../lib/api"
import type { UploadedFile, VideoStyle, VideoStyleOption } from "../lib/api"

type WindowType = "computer" | "documents" | "recycle" | null

export default function Home() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [openWindow, setOpenWindow] = useState<WindowType>(null)
  const [prompt, setPrompt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Video style state
  const [videoStyles, setVideoStyles] = useState<VideoStyleOption[]>([])
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>("general")
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSubmittedPromptRef = useRef<string | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const styleMenuRef = useRef<HTMLDivElement | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const files = await listUploads()
      setDocuments(files)
    } catch {
      // silently ignore — folder may be empty or backend down
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Fetch available video styles from the backend on mount
  useEffect(() => {
    let cancelled = false
    listVideoStyles()
      .then((styles) => {
        if (!cancelled) setVideoStyles(styles)
      })
      .catch(() => {
        // Fallback: provide a hardcoded default so the UI is never empty
        if (!cancelled) {
          setVideoStyles([
            { value: "general", label: "General", description: "Default video style." },
            { value: "trailer", label: "Trailer", description: "Cinematic trailer style." },
          ])
        }
      })
    return () => { cancelled = true }
  }, [])

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      setIsUploading(true)
      try {
        for (const file of Array.from(files)) {
          await uploadFile(file)
        }
        await fetchDocuments()
      } catch {
        // upload error — could show a message, but for now silently handle
      } finally {
        setIsUploading(false)
        // reset the input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [fetchDocuments],
  )

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      try {
        await deleteUpload(filename)
        await fetchDocuments()
      } catch {
        // silently ignore
      }
    },
    [fetchDocuments],
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".start-btn") && !target.closest(".start-menu")) {
        setIsStartMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Close the video-style dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        styleMenuRef.current &&
        !styleMenuRef.current.contains(e.target as Node)
      ) {
        setIsStyleMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getFileIcon = (type: string, name: string): string => {
    if (type.startsWith("image/")) return "https://win98icons.alexmeub.com/icons/png/paint_file-5.png"
    if (type.startsWith("video/")) return "https://win98icons.alexmeub.com/icons/png/mplayer-2.png"
    if (type.startsWith("audio/")) return "https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png"
    if (type === "application/pdf") return "https://win98icons.alexmeub.com/icons/png/write_wordpad-0.png"
    if (name.endsWith(".txt") || name.endsWith(".md")) return "https://win98icons.alexmeub.com/icons/png/notepad-2.png"
    if (name.endsWith(".zip") || name.endsWith(".gz") || name.endsWith(".tar"))
      return "https://win98icons.alexmeub.com/icons/png/compressed_file-0.png"
    return "https://win98icons.alexmeub.com/icons/png/file_lines-0.png"
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const openWindowHandler = (windowType: WindowType) => {
    if (windowType === "documents") {
      fetchDocuments()
    }
    setOpenWindow(windowType)
  }

  const closeWindowHandler = () => {
    setOpenWindow(null)
  }

  const submitPrompt = useCallback(async (value: string, style: VideoStyle) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === lastSubmittedPromptRef.current) {
      return
    }

    lastSubmittedPromptRef.current = trimmed
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createVideo(trimmed, style, controller.signal)
      if (result.status === "failed") {
        setSubmitError(result.error ?? "Video request failed.")
        lastSubmittedPromptRef.current = null
      } else if (result.job_id) {
        setVideoUrl(getVideoUrl(result.job_id))
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setSubmitError(error instanceof Error ? error.message : "Failed to send prompt.")
      lastSubmittedPromptRef.current = null
    } finally {
      if (requestControllerRef.current === controller) {
        setIsSubmitting(false)
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const handleStop = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = ratio * duration
  }

  const statusLabel = submitError ? "Error sending prompt" : isSubmitting ? "Submitting..." : "Ready"
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const isTrailerSelected = selectedStyle === "trailer"
  const displayedStyles = videoStyles.filter(
    (style) => style.value === "general" || style.value === "trailer",
  )

  return (
    <>
      <div className="desktop-icons">
        <button onClick={() => openWindowHandler("computer")} className="icon-item">
          <img src="https://win98icons.alexmeub.com/icons/png/computer_explorer-5.png" alt="Computer" />
          <span>My Computer</span>
        </button>
        <button onClick={() => openWindowHandler("documents")} className="icon-item">
          <img src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png" alt="Documents" />
          <span>My Documents</span>
        </button>
        <button onClick={() => openWindowHandler("recycle")} className="icon-item">
          <img src="https://win98icons.alexmeub.com/icons/png/recycle_bin_full-4.png" alt="Recycle Bin" />
          <span>Recycle Bin</span>
        </button>
      </div>

      {openWindow && (
        <div className="modal-overlay" onClick={closeWindowHandler}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            {openWindow === "computer" && (
              <div className="window">
                <div className="window-header">
                  <span>💻 My Computer</span>
                  <div className="window-controls">
                    <span>_</span>
                    <span>□</span>
                    <span onClick={closeWindowHandler} style={{ cursor: "pointer" }}>
                      ×
                    </span>
                  </div>
                </div>
                <div className="menu-bar">
                  <span>
                    <u>F</u>ile
                  </span>
                  <span>
                    <u>E</u>dit
                  </span>
                  <span>
                    <u>V</u>iew
                  </span>
                  <span>
                    <u>H</u>elp
                  </span>
                </div>
                <div className="window-content">
                  <div className="computer-drives">
                    <div className="drive-item">
                      <img src="https://win98icons.alexmeub.com/icons/png/cd_drive-4.png" alt="C Drive" />
                      <div>
                        <div className="drive-label">(C:)</div>
                        <div className="drive-name">Local Disk</div>
                      </div>
                    </div>
                    <div className="drive-item">
                      <img src="https://win98icons.alexmeub.com/icons/png/cd_drive-4.png" alt="D Drive" />
                      <div>
                        <div className="drive-label">(D:)</div>
                        <div className="drive-name">CD-ROM</div>
                      </div>
                    </div>
                    <div className="drive-item">
                      <img src="https://win98icons.alexmeub.com/icons/png/cd_drive-4.png" alt="A Drive" />
                      <div>
                        <div className="drive-label">(A:)</div>
                        <div className="drive-name">3½ Floppy</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="status-bar">
                  <span>3 object(s)</span>
                  <span>My Computer</span>
                </div>
              </div>
            )}

            {openWindow === "documents" && (
              <div className="window">
                <div className="window-header">
                  <span>📁 My Documents</span>
                  <div className="window-controls">
                    <span>_</span>
                    <span>□</span>
                    <span onClick={closeWindowHandler} style={{ cursor: "pointer" }}>
                      ×
                    </span>
                  </div>
                </div>
                <div className="menu-bar">
                  <span>
                    <u>F</u>ile
                  </span>
                  <span>
                    <u>E</u>dit
                  </span>
                  <span>
                    <u>V</u>iew
                  </span>
                  <span>
                    <u>H</u>elp
                  </span>
                </div>
                <div className="window-content">
                  <div className="folder-list">
                    {documents.length === 0 && !isUploading && (
                      <div className="folder-empty-message">
                        This folder is empty. Use the <strong>+</strong> button to upload files.
                      </div>
                    )}
                    {isUploading && (
                      <div className="folder-empty-message">
                        Uploading...
                      </div>
                    )}
                    {documents.map((doc) => (
                      <a
                        key={doc.name}
                        href={getUploadUrl(doc.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="folder-item"
                        title={`${doc.name} (${formatFileSize(doc.size)})`}
                      >
                        <img src={getFileIcon(doc.type, doc.name)} alt={doc.type} />
                        <span>{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="status-bar">
                  <span>{documents.length} object(s)</span>
                  <span>My Documents</span>
                </div>
              </div>
            )}

            {openWindow === "recycle" && (
              <div className="window">
                <div className="window-header">
                  <span>🗑️ Recycle Bin</span>
                  <div className="window-controls">
                    <span>_</span>
                    <span>□</span>
                    <span onClick={closeWindowHandler} style={{ cursor: "pointer" }}>
                      ×
                    </span>
                  </div>
                </div>
                <div className="menu-bar">
                  <span>
                    <u>F</u>ile
                  </span>
                  <span>
                    <u>E</u>dit
                  </span>
                  <span>
                    <u>V</u>iew
                  </span>
                  <span>
                    <u>H</u>elp
                  </span>
                </div>
                <div className="window-content">
                  <div className="recycle-empty">
                    <img
                      src="https://win98icons.alexmeub.com/icons/png/recycle_bin_empty-4.png"
                      alt="Empty"
                      style={{ width: "64px", height: "64px", imageRendering: "pixelated" }}
                    />
                    <p>The Recycle Bin is empty.</p>
                  </div>
                </div>
                <div className="status-bar">
                  <span>0 object(s)</span>
                  <span>Recycle Bin</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header>
        <div className="window hero-window">
          <div className="window-header">
            <span>RenderWood - Video Editor</span>
            <div className="window-controls">
              <span>_</span>
              <span>□</span>
              <span>×</span>
            </div>
          </div>
          <div className="menu-bar">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Help</span>
          </div>
          <div className="ai-prompt-area">
            <div className="ai-prompt-box">
              <textarea
                className="ai-prompt-input"
                placeholder="Describe your video scene or edit..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                aria-busy={isSubmitting}
              />
              <div className="ai-prompt-toolbar">
                <div className="ai-prompt-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    style={{ display: "none" }}
                  />
                  <button
                    className="ai-toolbar-btn"
                    aria-label="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "..." : "+"}
                  </button>
                  <div className="ai-style-selector" ref={styleMenuRef}>
                    <button
                      className={`ai-toolbar-btn ai-toolbar-btn-accent${isTrailerSelected ? " ai-toolbar-btn-accent-trailer" : ""}`}
                      style={isTrailerSelected ? { background: "#e6dcff", color: "#4a2f7a" } : undefined}
                      onClick={() => setIsStyleMenuOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isStyleMenuOpen}
                    >
                      <span className="ai-bolt-icon">&#9889;</span>{" "}
                      {displayedStyles.find((s) => s.value === selectedStyle)?.label ?? "Style"}
                    </button>
                    {isStyleMenuOpen && (
                      <ul className="ai-style-menu" role="listbox">
                        {displayedStyles.map((style) => (
                          <li
                            key={style.value}
                            role="option"
                            aria-selected={style.value === selectedStyle}
                            className={`ai-style-menu-item ai-style-menu-item-${style.value}${style.value === selectedStyle ? " ai-style-menu-item-active" : ""}`}
                            onClick={() => {
                              setSelectedStyle(style.value)
                              setIsStyleMenuOpen(false)
                            }}
                          >
                            <span className="ai-style-menu-label">{style.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button className="ai-toolbar-btn">RenderWood v1</button>
                </div>
                <div className="ai-prompt-send-group">
                  <button
                    className="ai-send-btn"
                    aria-label={isSubmitting ? "Submitting prompt" : "Submit prompt"}
                    onClick={() => submitPrompt(prompt, selectedStyle)}
                    disabled={isSubmitting || !prompt.trim()}
                  >
                    {isSubmitting ? (
                      <span className="ai-send-loader" data-testid="send-loader" aria-hidden="true">
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                        <span className="ai-send-loader-dot" data-testid="send-loader-dot" />
                      </span>
                    ) : (
                      <span aria-hidden="true">&#8593;</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <span>{statusLabel}</span>
            <span className="blink">RenderWood</span>
          </div>
        </div>
      </header>

      <main className="main-container">
        <div className="window">
          <div className="window-header">
            <span>Output - Video Preview</span>
            <div className="window-controls">
              <span>_</span>
              <span>□</span>
              <span>×</span>
            </div>
          </div>
          <div className="menu-bar">
            <span>File</span>
            <span>Playback</span>
            <span>View</span>
            <span>Help</span>
          </div>
          <div className="video-viewer-area">
            <div className="video-player-wrapper">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <div className="video-placeholder">
                  <div className="video-placeholder-icon">
                    <img
                      src="https://win98icons.alexmeub.com/icons/png/media_player_stream_sun-4.png"
                      alt="Video"
                      style={{ width: "64px", height: "64px", imageRendering: "pixelated" as const }}
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
                <button className="video-ctrl-btn" aria-label={isPlaying ? "Pause" : "Play"} onClick={handlePlayPause} disabled={!videoUrl}>
                  {isPlaying ? "\u275A\u275A" : "\u25B6"}
                </button>
                <button className="video-ctrl-btn" aria-label="Stop" onClick={handleStop} disabled={!videoUrl}>&#9632;</button>
                <span className="video-time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <div className="video-progress">
                <div className="video-progress-track" onClick={handleProgressClick} style={{ cursor: videoUrl ? "pointer" : "default" }}>
                  <div className="video-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
              <div className="video-controls-right">
                {videoUrl && (
                  <a href={videoUrl} download className="video-ctrl-btn" aria-label="Download" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                    <img
                      src="https://win98icons.alexmeub.com/icons/png/disk_drive_green-0.png"
                      alt="Save"
                      style={{ width: "16px", height: "16px", imageRendering: "pixelated" as const }}
                    />
                  </a>
                )}
                <button className="video-ctrl-btn" aria-label="Fullscreen" onClick={() => videoRef.current?.requestFullscreen()} disabled={!videoUrl}>&#9634;</button>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <span>{videoUrl ? (isPlaying ? "Playing" : "Video loaded") : "No video loaded"}</span>
            <span>RenderWood Player</span>
          </div>
        </div>
      </main>

      <div className="taskbar">
        <button className="start-btn" onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}>
          <img src="https://win98icons.alexmeub.com/icons/png/windows-0.png" alt="Start" />
          <span className="start-text">Start</span>
        </button>

        {isStartMenuOpen && (
          <div className="start-menu">
            <div className="start-menu-header">
              <span className="windows-logo">Windows</span>
              <span className="windows-version">95</span>
            </div>
            <div className="start-menu-items">
              <button onClick={() => openWindowHandler("documents")} className="start-menu-item">
                <img
                  src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png"
                  alt="My Documents"
                />
                <span>My Documents</span>
              </button>
              <button onClick={() => openWindowHandler("computer")} className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/computer_explorer-5.png" alt="My Computer" />
                <span>My Computer</span>
              </button>
              <a href="#" className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/settings_gear-0.png" alt="Settings" />
                <span>Settings</span>
              </a>
              <a href="#" className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/search_file-2.png" alt="Find" />
                <span>Find</span>
              </a>
              <a href="#" className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/help_book_big-0.png" alt="Help" />
                <span>Help</span>
              </a>
              <a href="#" className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/application_hourglass-0.png" alt="Run" />
                <span>Run...</span>
              </a>
              <div className="start-menu-separator"></div>
              <a href="#" className="start-menu-item">
                <img src="https://win98icons.alexmeub.com/icons/png/shut_down_with_computer-0.png" alt="Shut Down" />
                <span>Shut Down...</span>
              </a>
            </div>
          </div>
        )}

        <div className="taskbar-time">
          <span className="time-text">12:00 PM</span>
        </div>
      </div>
    </>
  )
}
