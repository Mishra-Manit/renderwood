"use client";

import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { ComposerWindow } from "@/components/home/composer-window";
import {
  DesktopIcons,
  SystemWindowModal,
  UploadDescriptionDialog,
} from "@/components/home/system-windows";
import { Taskbar } from "@/components/home/taskbar";
import { VideoPreviewWindow } from "@/components/home/video-preview-window";
import { DEFAULT_WINDOW_MENU } from "@/components/home/constants";
import { WindowFrame } from "@/components/home/window-frame";
import { useRenderwoodApp } from "@/hooks/use-renderwood-app";

export default function Home() {
  const app = useRenderwoodApp();

  return (
    <>
      <DesktopIcons onOpenWindow={app.openWindowHandler} />

      <SystemWindowModal
        deletingDocs={app.deletingDocs}
        documents={app.documents}
        isUploading={app.isUploading}
        openWindow={app.openWindow}
        onClose={app.closeWindowHandler}
        onDeleteFile={app.handleDeleteFile}
      />

      <UploadDescriptionDialog
        fileDescription={app.fileDescription}
        pendingFiles={app.pendingFiles}
        setFileDescription={app.setFileDescription}
        onCancel={app.handleCancelUpload}
        onConfirm={app.handleConfirmUpload}
      />

      <ComposerWindow
        fileInputRef={app.fileInputRef}
        isStyleMenuOpen={app.isStyleMenuOpen}
        isSubmitting={app.isSubmitting}
        isTrailerSelected={app.isTrailerSelected}
        isUploading={app.isUploading}
        prompt={app.prompt}
        selectedStyle={app.selectedStyle}
        setIsStyleMenuOpen={app.setIsStyleMenuOpen}
        setPrompt={app.setPrompt}
        setSelectedStyle={app.setSelectedStyle}
        statusLabel={app.statusLabel}
        styleMenuRef={app.styleMenuRef}
        submitPrompt={app.submitPrompt}
        videoStyles={app.videoStyles}
        onFileUpload={app.handleFileUpload}
      />

      <VideoPreviewWindow
        currentTime={app.currentTime}
        duration={app.duration}
        isPlaying={app.isPlaying}
        progressPercent={app.progressPercent}
        videoRef={app.videoRef}
        videoUrl={app.videoUrl}
        onEnded={() => app.setIsPlaying(false)}
        onFullscreen={app.handleFullscreen}
        onLoadedMetadata={app.setDuration}
        onPause={() => app.setIsPlaying(false)}
        onPlay={() => app.setIsPlaying(true)}
        onProgressClick={app.handleProgressClick}
        onStop={app.handleStop}
        onTimeUpdate={app.setCurrentTime}
        onTogglePlayPause={app.handlePlayPause}
      />

      <div className="workflow-section">
        <WindowFrame
          title="Renderwood - Agentic Video Pipeline"
          className="workflow-window"
          menuItems={DEFAULT_WINDOW_MENU}
        >
          <div className="workflow-canvas-container">
            <WorkflowCanvas />
          </div>
        </WindowFrame>
      </div>

      <Taskbar
        clockText={app.clockText}
        isStartMenuOpen={app.isStartMenuOpen}
        onOpenWindow={app.openWindowHandler}
        onToggleStartMenu={() =>
          app.setIsStartMenuOpen((current) => !current)
        }
        onShowNotification={app.showSystemNotification}
      />
    </>
  );
}
