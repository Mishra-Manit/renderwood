import type { VideoStyleOption } from "@shared/video-contract";
import type { WindowType } from "./types";

type ShortcutWindow = Exclude<WindowType, null>;

export const DEFAULT_VIDEO_STYLE_OPTIONS: VideoStyleOption[] = [
  {
    value: "general",
    label: "General",
    description: "Default video style.",
  },
  {
    value: "trailer",
    label: "Trailer",
    description: "Cinematic trailer style.",
  },
];

export type DesktopShortcut =
  | { icon: string; label: string; window: ShortcutWindow; href?: undefined }
  | { icon: string; label: string; href: string; window?: undefined };

export const DESKTOP_SHORTCUTS: DesktopShortcut[] = [
  {
    icon: "https://win98icons.alexmeub.com/icons/png/computer_explorer-5.png",
    label: "My Computer",
    window: "computer",
  },
  {
    icon: "https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png",
    label: "My Uploads",
    window: "documents",
  },
  {
    icon: "https://win98icons.alexmeub.com/icons/png/recycle_bin_full-4.png",
    label: "Recycle Bin",
    window: "recycle",
  },
  {
    icon: "https://win98icons.alexmeub.com/icons/png/windows_movie-0.png",
    label: "Video Editor",
    href: "/editor",
  },
];

export const START_MENU_ITEMS: Array<{
  href?: string;
  icon: string;
  label: string;
  window?: ShortcutWindow;
}> = [
  {
    icon: "https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png",
    label: "My Uploads",
    window: "documents",
  },
  {
    icon: "https://win98icons.alexmeub.com/icons/png/computer_explorer-5.png",
    label: "My Computer",
    window: "computer",
  },
  {
    href: "#",
    icon: "https://win98icons.alexmeub.com/icons/png/settings_gear-0.png",
    label: "Settings",
  },
  {
    href: "#",
    icon: "https://win98icons.alexmeub.com/icons/png/search_file-2.png",
    label: "Find",
  },
  {
    href: "#",
    icon: "https://win98icons.alexmeub.com/icons/png/help_book_big-0.png",
    label: "Help",
  },
  {
    href: "#",
    icon: "https://win98icons.alexmeub.com/icons/png/application_hourglass-0.png",
    label: "Run...",
  },
  {
    href: "#",
    icon: "https://win98icons.alexmeub.com/icons/png/shut_down_with_computer-0.png",
    label: "Shut Down...",
  },
];

export const DEFAULT_WINDOW_MENU = ["File", "Edit", "View", "Help"];
export const VIDEO_WINDOW_MENU = ["File", "Playback", "View", "Help"];
