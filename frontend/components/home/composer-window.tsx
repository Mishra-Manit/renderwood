import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import type { VideoStyle, VideoStyleOption } from "@/lib/api";
import { DEFAULT_WINDOW_MENU } from "@/components/home/constants";
import { WindowFrame } from "@/components/home/window-frame";

type ComposerWindowProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isStyleMenuOpen: boolean;
  isSubmitting: boolean;
  isTrailerSelected: boolean;
  isUploading: boolean;
  prompt: string;
  selectedStyle: VideoStyle;
  setIsStyleMenuOpen: Dispatch<SetStateAction<boolean>>;
  setPrompt: Dispatch<SetStateAction<string>>;
  setSelectedStyle: Dispatch<SetStateAction<VideoStyle>>;
  statusLabel: string;
  styleMenuRef: RefObject<HTMLDivElement | null>;
  submitPrompt: (value: string, style: VideoStyle) => void;
  videoStyles: VideoStyleOption[];
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ComposerWindow({
  fileInputRef,
  isStyleMenuOpen,
  isSubmitting,
  isTrailerSelected,
  isUploading,
  prompt,
  selectedStyle,
  setIsStyleMenuOpen,
  setPrompt,
  setSelectedStyle,
  statusLabel,
  styleMenuRef,
  submitPrompt,
  videoStyles,
  onFileUpload,
}: ComposerWindowProps) {
  const selectedLabel =
    videoStyles.find((style) => style.value === selectedStyle)?.label ?? "Style";

  return (
    <header>
      <WindowFrame
        title="RenderWood - Video Editor"
        menuItems={DEFAULT_WINDOW_MENU}
        statusLeft={statusLabel}
        statusRight={<span className="blink">RenderWood</span>}
        className="hero-window"
      >
        <div className="ai-prompt-area">
          <div className="ai-prompt-box">
            <textarea
              className="ai-prompt-input"
              placeholder="Describe your video scene or edit..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={8}
              aria-busy={isSubmitting}
            />
            <div className="ai-prompt-toolbar">
              <div className="ai-prompt-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileUpload}
                  multiple
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="ai-toolbar-btn"
                  aria-label="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "..." : "+"}
                </button>
                <div className="ai-style-selector" ref={styleMenuRef}>
                  <button
                    type="button"
                    className={`ai-toolbar-btn ai-toolbar-btn-accent${isTrailerSelected ? " ai-toolbar-btn-accent-trailer" : ""}`}
                    style={
                      isTrailerSelected
                        ? { background: "#e6dcff", color: "#4a2f7a" }
                        : undefined
                    }
                    onClick={() => setIsStyleMenuOpen((current) => !current)}
                    aria-haspopup="listbox"
                    aria-expanded={isStyleMenuOpen}
                  >
                    <span className="ai-bolt-icon">&#9889;</span> {selectedLabel}
                  </button>
                  {isStyleMenuOpen && (
                    <ul className="ai-style-menu" role="listbox">
                      {videoStyles.map((style) => (
                        <li
                          key={style.value}
                          role="option"
                          aria-selected={style.value === selectedStyle}
                          className={`ai-style-menu-item ai-style-menu-item-${style.value}${style.value === selectedStyle ? " ai-style-menu-item-active" : ""}`}
                          onClick={() => {
                            setSelectedStyle(style.value);
                            setIsStyleMenuOpen(false);
                          }}
                        >
                          <span className="ai-style-menu-label">{style.label}</span>
                          <span className="ai-style-menu-desc">
                            {style.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button type="button" className="ai-toolbar-btn">
                  RenderWood v1
                </button>
              </div>
              <div className="ai-prompt-send-group">
                <button
                  type="button"
                  className="ai-send-btn"
                  aria-label={
                    isSubmitting ? "Submitting prompt" : "Submit prompt"
                  }
                  onClick={() => submitPrompt(prompt, selectedStyle)}
                  disabled={isSubmitting || !prompt.trim()}
                >
                  {isSubmitting ? (
                    <span
                      className="ai-send-loader"
                      data-testid="send-loader"
                      aria-hidden="true"
                    >
                      {Array.from({ length: 8 }, (_, index) => (
                        <span
                          key={index}
                          className="ai-send-loader-dot"
                          data-testid="send-loader-dot"
                        />
                      ))}
                    </span>
                  ) : (
                    <span aria-hidden="true">&#8593;</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
    </header>
  );
}
