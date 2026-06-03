const swatches = ["#0F172A", "#2563EB", "#DC2626", "#059669", "#CA8A04", "#7C3AED"];

export default function Toolbar({
  roomId,
  tool,
  color,
  brushSize,
  canUndo,
  canRedo,
  connectedUsers,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
}) {
  return (
    <aside className="toolbar">
      <div className="toolbar__brand">
        <div>
          <p className="eyebrow">Shared Room</p>
          <h1>CoSketch</h1>
        </div>
        <div className="room-pill">
          <span>{roomId}</span>
          <span>{connectedUsers} online</span>
        </div>
      </div>

      <div className="toolbar__group">
        <span className="toolbar__label">Tools</span>
        <div className="segmented-control">
          <button
            type="button"
            className={tool === "pen" ? "is-active" : ""}
            onClick={() => onToolChange("pen")}
          >
            Pen
          </button>
          <button
            type="button"
            className={tool === "eraser" ? "is-active" : ""}
            onClick={() => onToolChange("eraser")}
          >
            Eraser
          </button>
        </div>
      </div>

      <div className="toolbar__group">
        <label className="toolbar__label" htmlFor="color-picker">
          Color
        </label>
        <div className="color-row">
          <input
            id="color-picker"
            type="color"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
            disabled={tool === "eraser"}
          />
          <div className="swatch-list">
            {swatches.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={color === swatch ? "swatch is-selected" : "swatch"}
                style={{ backgroundColor: swatch }}
                onClick={() => onColorChange(swatch)}
                aria-label={`Select ${swatch}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar__group">
        <label className="toolbar__label" htmlFor="brush-size">
          Brush Size: {brushSize}px
        </label>
        <input
          id="brush-size"
          type="range"
          min="2"
          max="24"
          step="1"
          value={brushSize}
          onChange={(event) => onBrushSizeChange(Number(event.target.value))}
        />
      </div>

      <div className="toolbar__group toolbar__actions">
        <button type="button" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={onClear}>
          Clear
        </button>
        <button type="button" onClick={onExport}>
          Export PNG
        </button>
      </div>
    </aside>
  );
}

