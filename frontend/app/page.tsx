"use client"

import { useEffect, useState, useRef } from "react"

type WindowType = "computer" | "documents" | "recycle" | null

export default function Home() {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [openWindow, setOpenWindow] = useState<WindowType>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [prompt, setPrompt] = useState("")
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".start-btn") && !target.closest(".start-menu")) {
        setIsStartMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)

    audioRef.current?.play().catch(() => {})

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const openWindowHandler = (windowType: WindowType) => {
    setOpenWindow(windowType)
  }

  const closeWindowHandler = () => {
    setOpenWindow(null)
  }

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
      </audio>

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
                    <a
                      href="https://1ui.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="folder-item"
                      style={{ textDecoration: "none", color: "inherit", padding: "4px 8px" }}
                    >
                      <img src="https://win98icons.alexmeub.com/icons/png/html-0.png" alt="Project" />
                      <span>1UI.dev</span>
                    </a>
                    <a
                      href="https://apichecker.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="folder-item"
                      style={{ textDecoration: "none", color: "inherit", padding: "4px 8px" }}
                    >
                      <img src="https://win98icons.alexmeub.com/icons/png/html-0.png" alt="Project" />
                      <span>Apichecker.io</span>
                    </a>
                  </div>
                </div>
                <div className="status-bar">
                  <span>2 object(s)</span>
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
              />
              <div className="ai-prompt-toolbar">
                <div className="ai-prompt-actions">
                  <button className="ai-toolbar-btn" aria-label="Attach file">+</button>
                  <button className="ai-toolbar-btn ai-toolbar-btn-accent">
                    <span className="ai-bolt-icon">&#9889;</span> Inspiration
                  </button>
                  <button className="ai-toolbar-btn">RenderWood v1</button>
                </div>
                <div className="ai-prompt-send-group">
                  <button className="ai-send-btn" aria-label="Submit prompt">
                    &#8593;
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <span>Ready</span>
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
            </div>
            <div className="video-controls-bar">
              <div className="video-controls-left">
                <button className="video-ctrl-btn" aria-label="Play">&#9654;</button>
                <button className="video-ctrl-btn" aria-label="Stop">&#9632;</button>
                <span className="video-time-display">00:00 / 00:00</span>
              </div>
              <div className="video-progress">
                <div className="video-progress-track">
                  <div className="video-progress-fill"></div>
                </div>
              </div>
              <div className="video-controls-right">
                <button className="video-ctrl-btn" aria-label="Download">
                  <img
                    src="https://win98icons.alexmeub.com/icons/png/disk_drive_green-0.png"
                    alt="Save"
                    style={{ width: "16px", height: "16px", imageRendering: "pixelated" as const }}
                  />
                </button>
                <button className="video-ctrl-btn" aria-label="Fullscreen">&#9634;</button>
              </div>
            </div>
          </div>
          <div className="status-bar">
            <span>No video loaded</span>
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
          <img
            src={
              isMuted
                ? "https://win98icons.alexmeub.com/icons/png/loudspeaker_muted-0.png"
                : "https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png"
            }
            alt="Volume"
            className="taskbar-icon"
            onClick={toggleMute}
            style={{ cursor: "pointer" }}
          />
          <span className="time-text">12:00 PM</span>
        </div>
      </div>
    </>
  )
}
