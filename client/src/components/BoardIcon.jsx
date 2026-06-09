const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export default function BoardIcon({ name }) {
  switch (name) {
    case "select":
      return (
        <svg {...iconProps}>
          <path d="M5 3v14l4-4 3 8 2-1-3-8 5 1-11-10Z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...iconProps}>
          <path d="M5 19l4-1 8-8-3-3-8 8-1 4Z" />
          <path d="M13 7l3 3" />
          <path d="M4 20h4" />
        </svg>
      );
    case "draw":
      return (
        <svg {...iconProps}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          <path d="m15 5 3 3" />
        </svg>
      );
    case "highlighter":
      return (
        <svg {...iconProps}>
          <path d="M7 7h7l3 3-6 6H7l-2-2V9l2-2Z" />
          <path d="M6 17h9" />
        </svg>
      );
    case "sticky":
      return (
        <svg {...iconProps}>
          <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z" />
          <path d="M15 3v6h6" />
        </svg>
      );
    case "text":
      return (
        <svg {...iconProps}>
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case "eraser":
      return (
        <svg {...iconProps}>
          <path d="m6 13 5-5h4l4 4-5 5H9l-3-4Z" />
          <path d="M14 17h5" />
        </svg>
      );
    case "hand":
      return (
        <svg {...iconProps}>
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a1.2 1.2 0 0 1 0-1.7l.77-.77a2 2 0 0 1 2.3-.39l2.52 1.48V10.5" />
        </svg>
      );
    case "rectangle":
      return (
        <svg {...iconProps}>
          <rect x="4.5" y="7" width="15" height="10" rx="2.5" />
        </svg>
      );
    case "ellipse":
      return (
        <svg {...iconProps}>
          <ellipse cx="12" cy="12" rx="7" ry="5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...iconProps}>
          <path d="M5 18 18 8" />
          <path d="M12 8h6v6" />
        </svg>
      );
    case "line":
      return (
        <svg {...iconProps}>
          <path d="M5 19 19 5" />
        </svg>
      );
    case "triangle":
      return (
        <svg {...iconProps}>
          <path d="M12 3 2 21h20Z" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...iconProps}>
          <path d="M12 3 3 12l9 9 9-9Z" />
        </svg>
      );
    case "shapes":
      return (
        <svg {...iconProps}>
          <path d="M8.3 10a3.5 3.5 0 0 1 1.5 5H4.8a3.5 3.5 0 0 1 3.5-5Z" />
          <path d="M16 2.2a2.2 2.2 0 1 1-2.2 2.2 2.2 0 0 1 2.2-2.2Z" />
          <rect x="12" y="11" width="8" height="8" rx="2" />
        </svg>
      );
    case "undo":
      return (
        <svg {...iconProps}>
          <path d="M9 14 4 9l5-5" />
          <path d="M20 20a8 8 0 0 0-8-8H4" />
        </svg>
      );
    case "redo":
      return (
        <svg {...iconProps}>
          <path d="m15 14 5-5-5-5" />
          <path d="M4 20a8 8 0 0 1 8-8h8" />
        </svg>
      );
    case "minus":
      return (
        <svg {...iconProps}>
          <path d="M5 12h14" />
        </svg>
      );
    case "plus":
      return (
        <svg {...iconProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "help":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.7 1.3-1.7 2.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "share":
      return (
        <svg {...iconProps}>
          <path d="M16 8 12 4 8 8" />
          <path d="M12 4v12" />
          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
      );
    case "download":
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "link":
      return (
        <svg {...iconProps}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "spark":
      return (
        <svg {...iconProps}>
          <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "logout":
      return (
        <svg {...iconProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case "video":
      return (
        <svg {...iconProps}>
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
