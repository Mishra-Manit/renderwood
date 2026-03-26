import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import type { UploadedFile } from "@/lib/api";
import { getUploadThumbnailUrl, getUploadUrl } from "@/lib/api";
import {
  DEFAULT_WINDOW_MENU,
  DESKTOP_SHORTCUTS,
} from "@/components/home/constants";
import type { WindowType } from "@/components/home/types";
import { formatFileSize, getFileIcon } from "@/components/home/utils";
import { WindowFrame } from "@/components/home/window-frame";

type DesktopIconsProps = {
  onOpenWindow: (window: Exclude<WindowType, null>) => void;
};

export function DesktopIcons({ onOpenWindow }: DesktopIconsProps) {
  return (
    <div className="desktop-icons">
      {DESKTOP_SHORTCUTS.map((shortcut) =>
        shortcut.href ? (
          <Link
            key={shortcut.label}
            href={shortcut.href}
            className="icon-item"
          >
            <img src={shortcut.icon} alt={shortcut.label} />
            <span>{shortcut.label}</span>
          </Link>
        ) : (
          <button
            key={shortcut.label}
            type="button"
            onClick={() => onOpenWindow(shortcut.window!)}
            className="icon-item"
          >
            <img src={shortcut.icon} alt={shortcut.label} />
            <span>{shortcut.label}</span>
          </button>
        ),
      )}
    </div>
  );
}

type SystemWindowModalProps = {
  deletingDocs: string[];
  documents: UploadedFile[];
  isUploading: boolean;
  openWindow: WindowType;
  onClose: () => void;
  onDeleteFile: (filename: string) => void;
};

export function SystemWindowModal({
  deletingDocs,
  documents,
  isUploading,
  openWindow,
  onClose,
  onDeleteFile,
}: SystemWindowModalProps) {
  if (!openWindow) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(event) => event.stopPropagation()}>
        {openWindow === "computer" && <ComputerWindow onClose={onClose} />}
        {openWindow === "documents" && (
          <UploadsWindow
            deletingDocs={deletingDocs}
            documents={documents}
            isUploading={isUploading}
            onClose={onClose}
            onDeleteFile={onDeleteFile}
          />
        )}
        {openWindow === "recycle" && <RecycleBinWindow onClose={onClose} />}
      </div>
    </div>
  );
}

type UploadDescriptionDialogProps = {
  fileDescription: string;
  pendingFiles: File[];
  setFileDescription: Dispatch<SetStateAction<string>>;
  onCancel: () => void;
  onConfirm: () => void;
};

export function UploadDescriptionDialog({
  fileDescription,
  pendingFiles,
  setFileDescription,
  onCancel,
  onConfirm,
}: UploadDescriptionDialogProps) {
  if (pendingFiles.length === 0) {
    return null;
  }

  return (
    <div className="upload-description-overlay">
      <div className="upload-description-modal">
        <div className="window-header">
          <span>Describe Your Clip</span>
          <div className="window-controls">
            <button type="button" onClick={onCancel} style={{ cursor: "pointer" }}>
              ×
            </button>
          </div>
        </div>
        <div className="upload-description-body">
          <p>
            {pendingFiles.length === 1
              ? `Uploading "${pendingFiles[0].name}"`
              : `Uploading ${pendingFiles.length} files`}
          </p>
          <label htmlFor="clip-description">
            Describe this clip in one sentence:
          </label>
          <input
            id="clip-description"
            type="text"
            className="upload-description-input"
            value={fileDescription}
            onChange={(event) => setFileDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onConfirm();
              }
            }}
            placeholder="e.g. Aerial drone shot of a mountain sunset"
            autoFocus
          />
          <div className="upload-description-actions">
            <button type="button" className="win-btn" onClick={onConfirm}>
              OK
            </button>
            <button type="button" className="win-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComputerWindow({ onClose }: { onClose: () => void }) {
  return (
    <WindowFrame
      title="💻 My Computer"
      menuItems={DEFAULT_WINDOW_MENU}
      statusLeft="3 object(s)"
      statusRight="My Computer"
      onClose={onClose}
    >
      <div className="window-content">
        <div className="computer-drives">
          {[
            {
              icon: "https://win98icons.alexmeub.com/icons/png/cd_drive-4.png",
              label: "(C:)",
              name: "Local Disk",
            },
            {
              icon: "https://win98icons.alexmeub.com/icons/png/cd_drive-4.png",
              label: "(D:)",
              name: "CD-ROM",
            },
            {
              icon: "https://win98icons.alexmeub.com/icons/png/cd_drive-4.png",
              label: "(A:)",
              name: "3½ Floppy",
            },
          ].map((drive) => (
            <div key={drive.label} className="drive-item">
              <img src={drive.icon} alt={drive.label} />
              <div>
                <div className="drive-label">{drive.label}</div>
                <div className="drive-name">{drive.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WindowFrame>
  );
}

type UploadsWindowProps = {
  deletingDocs: string[];
  documents: UploadedFile[];
  isUploading: boolean;
  onClose: () => void;
  onDeleteFile: (filename: string) => void;
};

function UploadsWindow({
  deletingDocs,
  documents,
  isUploading,
  onClose,
  onDeleteFile,
}: UploadsWindowProps) {
  return (
    <WindowFrame
      title="📁 My Uploads"
      menuItems={DEFAULT_WINDOW_MENU}
      statusLeft={`${documents.length} object(s)`}
      statusRight="My Uploads"
      onClose={onClose}
    >
      <div className="window-content">
        <div className="folder-list">
          {documents.length === 0 && !isUploading && (
            <div className="folder-empty-message">
              This folder is empty. Use the <strong>+</strong> button to upload
              files.
            </div>
          )}
          {isUploading && (
            <div className="folder-empty-message">Uploading...</div>
          )}
          {documents.map((document) => {
            const isDeleting = deletingDocs.includes(document.name);
            const hasVideoThumbnail =
              document.type.startsWith("video/") && document.has_thumbnail;
            const previewSrc = hasVideoThumbnail
              ? getUploadThumbnailUrl(document.name)
              : getFileIcon(document.type, document.name);

            return (
              <div
                key={document.name}
                className={`folder-item${isDeleting ? " folder-item--deleting" : ""}`}
                title={`${document.name} (${formatFileSize(document.size)})`}
              >
                <button
                  type="button"
                  className="folder-item-delete"
                  aria-label={`Delete ${document.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDeleteFile(document.name);
                  }}
                >
                  ×
                </button>
                <a
                  href={getUploadUrl(document.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="folder-item-link"
                >
                  <img
                    src={previewSrc}
                    alt={
                      hasVideoThumbnail
                        ? `${document.name} thumbnail`
                        : document.type
                    }
                    className={hasVideoThumbnail ? "folder-item-thumbnail" : undefined}
                  />
                  <span>{document.name}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </WindowFrame>
  );
}

function RecycleBinWindow({ onClose }: { onClose: () => void }) {
  return (
    <WindowFrame
      title="🗑️ Recycle Bin"
      menuItems={DEFAULT_WINDOW_MENU}
      statusLeft="0 object(s)"
      statusRight="Recycle Bin"
      onClose={onClose}
    >
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
    </WindowFrame>
  );
}
