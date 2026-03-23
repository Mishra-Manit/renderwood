import { START_MENU_ITEMS } from "@/components/home/constants";
import type { WindowType } from "@/components/home/types";

type TaskbarProps = {
  clockText: string;
  isStartMenuOpen: boolean;
  onOpenWindow: (window: Exclude<WindowType, null>) => void;
  onToggleStartMenu: () => void;
  onShowNotification: () => void;
};

export function Taskbar({
  clockText,
  isStartMenuOpen,
  onOpenWindow,
  onToggleStartMenu,
  onShowNotification,
}: TaskbarProps) {
  return (
    <div className="taskbar">
      <button type="button" className="start-btn" onClick={onToggleStartMenu}>
        <img
          src="https://win98icons.alexmeub.com/icons/png/windows-0.png"
          alt="Start"
        />
        <span className="start-text">Start</span>
      </button>

      {isStartMenuOpen && (
        <div className="start-menu">
          <div className="start-menu-header">
            <span className="windows-logo">Windows</span>
            <span className="windows-version">95</span>
          </div>
          <div className="start-menu-items">
            {START_MENU_ITEMS.map((item, index) => {
              if (index === START_MENU_ITEMS.length - 1) {
                return (
                  <div key={item.label}>
                    <div className="start-menu-separator" />
                    <a href={item.href} className="start-menu-item">
                      <img src={item.icon} alt={item.label} />
                      <span>{item.label}</span>
                    </a>
                  </div>
                );
              }

              if (item.window) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onOpenWindow(item.window!)}
                    className="start-menu-item"
                  >
                    <img src={item.icon} alt={item.label} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <a key={item.label} href={item.href} className="start-menu-item">
                  <img src={item.icon} alt={item.label} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        className="taskbar-time"
        onClick={onShowNotification}
        aria-label="Show test notification"
      >
        <span className="time-text">{clockText || "12:00 PM"}</span>
      </button>
    </div>
  );
}
