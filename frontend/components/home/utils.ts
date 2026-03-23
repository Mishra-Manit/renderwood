export function getFileIcon(type: string, name: string): string {
  if (type.startsWith("image/")) {
    return "https://win98icons.alexmeub.com/icons/png/paint_file-5.png";
  }

  if (type.startsWith("video/")) {
    return "https://win98icons.alexmeub.com/icons/png/mplayer-2.png";
  }

  if (type.startsWith("audio/")) {
    return "https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png";
  }

  if (type === "application/pdf") {
    return "https://win98icons.alexmeub.com/icons/png/write_wordpad-0.png";
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return "https://win98icons.alexmeub.com/icons/png/notepad-2.png";
  }

  if (
    name.endsWith(".zip") ||
    name.endsWith(".gz") ||
    name.endsWith(".tar")
  ) {
    return "https://win98icons.alexmeub.com/icons/png/compressed_file-0.png";
  }

  return "https://win98icons.alexmeub.com/icons/png/file_lines-0.png";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}
