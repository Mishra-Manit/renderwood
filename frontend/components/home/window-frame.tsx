import type { ReactNode } from "react";

type WindowFrameProps = {
  title: ReactNode;
  menuItems?: string[];
  statusLeft?: ReactNode;
  statusRight?: ReactNode;
  className?: string;
  children: ReactNode;
  onClose?: () => void;
};

export function WindowFrame({
  title,
  menuItems,
  statusLeft,
  statusRight,
  className,
  children,
  onClose,
}: WindowFrameProps) {
  return (
    <div className={className ? `window ${className}` : "window"}>
      <div className="window-header">
        <span>{title}</span>
        <div className="window-controls">
          <span>_</span>
          <span>□</span>
          <button
            type="button"
            onClick={onClose}
            style={{ cursor: onClose ? "pointer" : "default" }}
            aria-label={typeof title === "string" ? `Close ${title}` : "Close window"}
          >
            ×
          </button>
        </div>
      </div>
      {menuItems && (
        <div className="menu-bar">
          {menuItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {children}
      {(statusLeft || statusRight) && (
        <div className="status-bar">
          <span>{statusLeft}</span>
          <span>{statusRight}</span>
        </div>
      )}
    </div>
  );
}
