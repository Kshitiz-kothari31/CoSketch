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
          <path d="M5 18c2-5 7-10 13-13" />
          <path d="m16 4 3 3" />
          <path d="M5 19h5" />
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
          <path d="M6 5h12v10l-4 4H6V5Z" />
          <path d="M14 15h4" />
          <path d="M9 9h6" />
          <path d="M9 12h4" />
        </svg>
      );
    case "text":
      return (
        <svg {...iconProps}>
          <path d="M5 6h14" />
          <path d="M12 6v12" />
          <path d="M8 18h8" />
          <path d="M9 6h6" />
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
          <path d="M8 12V5a1 1 0 1 1 2 0v5" />
          <path d="M12 12V4a1 1 0 1 1 2 0v8" />
          <path d="M16 12V6a1 1 0 1 1 2 0v9a4 4 0 0 1-4 4h-2a6 6 0 0 1-6-6v-3a1 1 0 1 1 2 0v2" />
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
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
