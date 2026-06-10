import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useWasmEngine } from "../hooks/useWasmEngine";

import BoardIcon from "../components/BoardIcon";
import CanvasBoard from "../components/CanvasBoard";
import VideoCall from "../components/video/VideoCall";
import { HexColorPicker } from "react-colorful";
import { useWhiteboard } from "../context/WhiteboardContext";
import { useSocket } from "../hooks/useSocket";
import {
  DEFAULT_VIEWPORT,
  clampZoom,
  formatLastSaved,
  zoomViewportAtPoint,
} from "../lib/boardUtils";
import { SOCKET_URL } from "../lib/api";

const primaryTools = [
  { id: "select", label: "Select" },
  { id: "draw", label: "Draw" },
  { id: "eraser", label: "Eraser" },
  { id: "shapes", label: "Shapes" },
  { id: "sticky", label: "Sticky" },
  { id: "text", label: "Text" },
  { id: "hand", label: "Hand" },
];

const drawTools = [
  { id: "pen", label: "Pen" },
  { id: "highlighter", label: "Highlight" },
];

const shapeTools = [
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "rectangle", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "triangle", label: "Triangle" },
  { id: "diamond", label: "Diamond" },
];

const swatches = ["#202431", "#4B67FF", "#FF6B57", "#2BBE60", "#F4B942", "#CB69FF"];

function getFallbackUser() {
  const sessionId = sessionStorage.getItem("cosketch-session-id") || crypto.randomUUID();
  sessionStorage.setItem("cosketch-session-id", sessionId);
  
  return {
    id: sessionId,
    name: window.localStorage.getItem("cosketch-name") || "Guest",
  };
}

function initials(name) {
  return String(name || "Guest")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const generateNewPosition = (items, index = -1) => {
  const targetIndex = index === -1 ? items.length : index;
  const prevItem = items[targetIndex - 1];
  const nextItem = items[targetIndex];
  return {
    p1: prevItem?.fractionalPosition || [],
    p2: nextItem?.fractionalPosition || []
  };
};

export default function RoomPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const { state, dispatch } = useWhiteboard();
  const { socket, isConnected } = useSocket(SOCKET_URL);
  const boardApiRef = useRef(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [statusMessage, setStatusMessage] = useState("Connecting...");
  const [shareMessage, setShareMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [showEraserDrawer, setShowEraserDrawer] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 1. Initialize Wasm Engine
  const { engine: wasmEngine, isReady } = useWasmEngine();

  const user = useMemo(() => {
    const nextUser = location.state?.user || getFallbackUser();
    window.localStorage.setItem("cosketch-user-id", nextUser.id);
    window.localStorage.setItem("cosketch-name", nextUser.name);
    return nextUser;
  }, [location.state]);

  useEffect(() => {
    dispatch({ type: "SET_USER", payload: user });
  }, [dispatch, user]);

  // 2. CRDT Action Handler
  const handleBoardAction = useCallback((payload, isUndo = false) => {
    if (!wasmEngine) return;
    const { instance, Module } = wasmEngine;

    // Standardize: Extract action from payload
    const action = payload.action || payload;

    if (isUndo) {
      if (action.type === "create-item") {
        instance.deleteElement(action.item.id);
      } else if (action.type === "delete-item") {
        const item = action.item;
        const v = new Module.VectorInt();
        (item.fractionalPosition || [50]).forEach(val => v.push_back(val));
        instance.addElement(item.id, v, item.userId, JSON.stringify(item));
        v.delete();
      } else if (action.type === "update-item") {
        // Revert to previous
        const item = action.previousItem;
        const v = new Module.VectorInt();
        (item.fractionalPosition || [50]).forEach(val => v.push_back(val));
        instance.addElement(item.id, v, item.userId, JSON.stringify(item));
        v.delete();
      }
    } else {
      const item = action.item || action.nextItem;

      if (action.type === "create-item" || action.type === "update-item") {
        const vectorPos = new Module.VectorInt();
        const position = item.fractionalPosition || [50];
        position.forEach(val => vectorPos.push_back(val));
        
        instance.addElement(item.id, vectorPos, item.userId, JSON.stringify(item));
        vectorPos.delete();
      } else if (action.type === "delete-item") {
        instance.deleteElement(item.id);
      } else if (action.type === "clear-board") {
        instance.clearBoard();
      }
    }

    const orderedItems = JSON.parse(instance.getOrderedElements());

    dispatch({
      type: "HYDRATE_ROOM",
      payload: {
        items: orderedItems,
        historyCount: payload.historyCount,
        redoCount: payload.redoCount
      }
    });
  }, [wasmEngine, dispatch]);

  // 3. Socket Listeners with proper State Sync
  useEffect(() => {
    if (!socket || !roomId || !isConnected || !wasmEngine) return;

    socket.emit("join-room", { roomId, user }, (res) => {
      setStatusMessage(res?.ok ? "Live collaboration active" : (res?.message || "Join failed"));
    });

    const handleRoomState = (payload) => {
      // SYNC: Feed existing database items into the C++ Manager
      const { instance, Module } = wasmEngine;
      instance.clearBoard();

      if (payload.items) {
        payload.items.forEach(item => {
          const v = new Module.VectorInt();
          (item.fractionalPosition || [50]).forEach(val => v.push_back(val));
          instance.addElement(item.id, v, item.userId, JSON.stringify(item));
          v.delete();
        });
      }

      dispatch({ type: "HYDRATE_ROOM", payload });
    };

    const handleRoomUsers = (p) => {
      dispatch({ type: "SET_PARTICIPANTS", payload: p.participants || [] });
      dispatch({ type: "HYDRATE_ROOM", payload: { hostUserId: p.hostUserId, bannedUsers: p.bannedUsers } });
    };

    const handleUndo = (p) => handleBoardAction(p, true);
    const handleRedo = (p) => handleBoardAction(p, false);
    const handleCursorMove = (p) => {
      console.log("📍 Received cursor move:", p);
      dispatch({ type: "UPSERT_CURSOR", payload: p });
    };
    const handleCursorLeft = (socketId) => dispatch({ type: "REMOVE_CURSOR", payload: socketId });
    const handleRoomSaved = (p) => dispatch({ type: "HYDRATE_ROOM", payload: { savedAt: p.savedAt } });

    socket.on("room-state", handleRoomState);
    socket.on("room-users", handleRoomUsers);
    socket.on("board-action", handleBoardAction);
    socket.on("undo", handleUndo);
    socket.on("redo", handleRedo);
    socket.on("cursor-move", handleCursorMove);
    socket.on("cursor-left", handleCursorLeft);
    socket.on("room-saved", handleRoomSaved);

    return () => {
      socket.off("room-state", handleRoomState);
      socket.off("room-users", handleRoomUsers);
      socket.off("board-action", handleBoardAction);
      socket.off("undo", handleUndo);
      socket.off("redo", handleRedo);
      socket.off("cursor-move", handleCursorMove);
      socket.off("cursor-left", handleCursorLeft);
      socket.off("room-saved", handleRoomSaved);
    };
  }, [isConnected, roomId, socket, user, handleBoardAction, wasmEngine, dispatch]);

  // 4. Local Drawing Logic
  const handleLocalDraw = (shapeData) => {
    if (!wasmEngine || !socket) return;
    const { instance, Module } = wasmEngine;

    const { p1, p2 } = generateNewPosition(state.items);
    const v1 = new Module.VectorInt();
    const v2 = new Module.VectorInt();
    p1.forEach(n => v1.push_back(n));
    p2.forEach(n => v2.push_back(n));

    const newPosVector = instance.generateIntermediate(v1, v2);
    const newPosArray = [];
    for (let i = 0; i < newPosVector.size(); i++) {
      newPosArray.push(newPosVector.get(i));
    }

    const payload = {
      type: "create-item",
      item: {
        ...shapeData,
        fractionalPosition: newPosArray,
        userId: user.id,
        id: shapeData.id || crypto.randomUUID()
      }
    };

    socket.emit("draw", { phase: "done", strokeId: payload.item.id });
    socket.emit("board-action", payload);
    handleBoardAction(payload); // Immediate local update

    v1.delete(); v2.delete(); newPosVector.delete();
  };

  const handleLocalDelete = (item) => {
    if (!wasmEngine || !socket) return;
    const payload = { type: "delete-item", item };
    socket.emit("board-action", payload);
    handleBoardAction(payload);
  };

  const handleLocalUpdate = (previousItem, nextItem) => {
    if (!wasmEngine || !socket) return;
    const payload = { type: "update-item", previousItem, nextItem };
    socket.emit("board-action", payload);
    handleBoardAction(payload);
  };

  // Helper Functions
  const setTool = (t) => dispatch({ type: "SET_TOOL", payload: t });
  const isDrawToolActive = drawTools.some((e) => e.id === state.tool);
  const isShapeTool = (t) => shapeTools.some((e) => e.id === t);
  const handlePrimaryToolSelect = (t) => {
    setShowColorPicker(false);
    if (t === "draw") {
      setShowDrawer((prev) => !prev);
      setShowShapesDrawer(false);
      setShowEraserDrawer(false);
      if (!isDrawToolActive) {
        setTool(state.lastDrawTool === "highlighter" ? "highlighter" : "pen");
      }
    } else if (t === "shapes") {
      setShowShapesDrawer((prev) => !prev);
      setShowDrawer(false);
      setShowEraserDrawer(false);
      if (!isShapeTool(state.tool)) {
        setTool(isShapeTool(state.lastDrawTool) ? state.lastDrawTool : "rectangle");
      }
    } else if (t === "eraser") {
      setShowEraserDrawer((prev) => !prev);
      setShowDrawer(false);
      setShowShapesDrawer(false);
      setTool("eraser");
    } else {
      setShowDrawer(false);
      setShowShapesDrawer(false);
      setShowEraserDrawer(false);
      setTool(t);
    }
  };

  const handleSecondaryToolSelect = (t) => {
    setTool(t);
  };

  const setViewport = (v) => dispatch({ type: "SET_VIEWPORT", payload: v });
  const zoom = (m) => setViewport(zoomViewportAtPoint(state.viewport, clampZoom(state.viewport.scale * m), { x: window.innerWidth / 2, y: window.innerHeight / 2 }));

  const handleShare = () => {
    const link = state.roomId || roomId;
    navigator.clipboard?.writeText ? navigator.clipboard.writeText(link).then(() => setShareMessage("Room ID copied")) : (window.prompt("Copy ID:", link), setShareMessage("Room ID ready"));
    setTimeout(() => setShareMessage(""), 1800);
  };

  if (!isReady) {
    return (
      <main className="landing-page" style={{
        background: '#f7f5ef',
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 0,
        margin: 0
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4B67FF, #9168FF)',
              opacity: 0.2,
              animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            <div style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4B67FF, #9168FF)',
              boxShadow: '0 8px 24px rgba(75, 103, 255, 0.4)',
              animation: 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
          </div>
          <h2 style={{
            marginTop: '2rem',
            fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#2B2F3A',
            letterSpacing: '-0.02em',
            animation: 'fade-in-up 0.5s ease-out forwards',
            opacity: 0
          }}>
            Preparing Workspace
          </h2>
          <style>{`
            @keyframes pulse-ring {
              0% { transform: scale(0.8); opacity: 0.5; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes pulse-dot {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(0.9); }
            }
            @keyframes fade-in-up {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </main>
    );
  }

  return (
    <main className="room-page">
      <CanvasBoard
        onDraw={handleLocalDraw}
        onDelete={handleLocalDelete}
        onUpdate={handleLocalUpdate}
        items={state.items}
        cursors={state.cursors}
        socket={socket}
        roomId={state.roomId || roomId}
        user={state.user}
        tool={state.tool}
        color={state.color}
        brushSize={state.brushSize}
        viewport={state.viewport}
        selectedItemId={state.selectedItemId}
        dispatch={dispatch}
        apiRef={boardApiRef}
      />

      <div className="topbar-left-group">
        <header className="floating-topbar floating-topbar--left">
          <div>
            <h1>Web whiteboard</h1>
            <p>Real-time Sync</p>
          </div>
          <button
            type="button"
            className="icon-action"
            onClick={() => boardApiRef.current?.exportAsImage()}
            aria-label="Export board"
            data-tooltip="Export PNG"
            data-tooltip-position="bottom"
          >
            <BoardIcon name="download" />
          </button>
        </header>

        <section className="floating-topbar floating-topbar--center">
          <span className="floating-badge floating-badge--save">
            <BoardIcon name="target" />
            <span className="badge-text">{formatLastSaved(state.savedAt)}</span>
          </span>
          {state.hostUserId === state.user?.id && (
            <button type="button" className={`cta-button ${shareMessage ? "is-copied" : ""}`} onClick={handleShare}>
              <BoardIcon name="link" />
              <span className="btn-text">{shareMessage || "Share Room ID"}</span>
            </button>
          )}
        </section>
      </div>

      <section className="floating-dock floating-dock--left">
        <button 
          type="button" 
          className="dock-button" 
          onClick={() => socket?.emit("undo")}
          disabled={state.historyCount === 0}
          data-tooltip="Undo"
        >
          <BoardIcon name="undo" />
        </button>
        <button 
          type="button" 
          className="dock-button" 
          onClick={() => socket?.emit("redo")}
          disabled={state.redoCount === 0}
          data-tooltip="Redo"
        >
          <BoardIcon name="redo" />
        </button>
      </section>

      <section className="floating-dock floating-dock--right">
        <button 
          type="button" 
          className="dock-button" 
          onClick={() => zoom(0.8)}
          data-tooltip="Zoom Out"
        >
          <BoardIcon name="minus" />
        </button>
        <span className="zoom-readout">{Math.round(state.viewport.scale * 100)}%</span>
        <button 
          type="button" 
          className="dock-button" 
          onClick={() => zoom(1.2)}
          data-tooltip="Zoom In"
        >
          <BoardIcon name="plus" />
        </button>
        <button 
          type="button" 
          className="dock-button" 
          onClick={() => setShowHelp(true)}
          data-tooltip="Board Guide"
        >
          <BoardIcon name="help" />
        </button>
      </section>

      <div className="topbar-right-group">
        <section className="floating-topbar floating-topbar--video-btn">
          <button
            type="button"
            className={`icon-action ${isVideoActive ? "is-active" : ""}`}
            onClick={() => setIsVideoActive(!isVideoActive)}
            data-tooltip={isVideoActive ? "Leave Call" : "Join Video Call"}
            data-tooltip-position="bottom"
            style={{
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isVideoActive ? "rgba(239, 68, 68, 0.15)" : "rgba(75, 103, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: isVideoActive ? "#f87171" : "#818cf8",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <BoardIcon name="video" />
          </button>
        </section>

        <section className="floating-topbar floating-topbar--users" onClick={() => setShowUsers(!showUsers)} style={{ cursor: "pointer" }}>
          <div className="presence-stack">
            {state.participants.slice(0, 3).map((participant) => (
              <span key={participant.userId} className="avatar-chip" title={participant.name}>
                {initials(participant.name)}
              </span>
            ))}
            <span className="presence-meta">{state.participants.length || 1} online</span>
          </div>
        </section>
      </div>

      {showUsers && (
        <div className="users-dropdown">
          <div className="users-dropdown__header">
            <h3>Participants</h3>
          </div>
          <div className="users-dropdown__list">
            {state.participants.map((p) => {
              const isMe = p.socketId === socket?.id;
              const isHost = state.hostUserId === state.user?.id;
              const isBanned = state.bannedUsers.includes(p.userId);

              return (
                <div key={p.socketId} className="user-row">
                  <div className="user-row__info">
                    <span className="avatar-chip">{initials(p.name)}</span>
                    <span className="user-name">
                      {p.name} {isMe && "(You)"} {state.hostUserId === p.userId && "👑"}
                    </span>
                  </div>
                  {isHost && !isMe && (
                    <button 
                      className={`block-btn ${isBanned ? 'is-banned' : ''}`}
                      onClick={() => {
                        if (isBanned) socket?.emit("unban-user", p.userId);
                        else socket?.emit("ban-user", p.userId);
                      }}
                    >
                      {isBanned ? "Unblock" : "Block"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <aside className="floating-rail floating-rail--primary">
        {primaryTools.map((entry) => {
          let isActive = false;
          let iconName = entry.id;

          if (entry.id === "draw") {
            isActive = isDrawToolActive;
          } else if (entry.id === "shapes") {
            isActive = isShapeTool(state.tool);
            iconName = isActive ? state.tool : "shapes";
          } else {
            isActive = state.tool === entry.id;
          }

          return (
            <button
              key={entry.id}
              type="button"
              className={isActive ? "rail-button rail-button--compact is-active" : "rail-button rail-button--compact"}
              onClick={() => handlePrimaryToolSelect(entry.id)}
              data-tooltip={entry.label}
              data-tooltip-position="right"
            >
              <BoardIcon name={iconName} />
            </button>
          );
        })}
      </aside>

      {showDrawer && (
        <aside className="floating-rail floating-rail--secondary">
          <span className="rail-title">Draw</span>
          <div className="draw-tool-grid">
            {drawTools.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={state.tool === entry.id ? "rail-button rail-button--card is-active" : "rail-button rail-button--card"}
                onClick={() => handleSecondaryToolSelect(entry.id)}
                data-tooltip={entry.label}
              >
                <span className="rail-button__icon"><BoardIcon name={entry.id} /></span>
                <span className="rail-button__label">{entry.label}</span>
              </button>
            ))}
          </div>

          <div className="rail-divider" />

          <div className="brush-control">
            <span className="brush-control__value">{state.brushSize}px</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1" 
              value={state.brushSize} 
              onChange={(e) => dispatch({type: "SET_BRUSH_SIZE", payload: parseInt(e.target.value, 10)})}
            />
          </div>
          
          <div className="palette-group">
            <span className="palette-title">Colors</span>
            <div className="swatch-column">
               {swatches.map(color => (
                 <button 
                   key={color} 
                   type="button" 
                   className={state.color === color ? "color-dot is-selected" : "color-dot"} 
                   style={{backgroundColor: color}} 
                   onClick={() => dispatch({type: "SET_COLOR", payload: color})} 
                 />
               ))}
               <div className="custom-color-wrapper">
                 <button
                   type="button"
                   className="color-dot custom-color-btn"
                   title="Custom Color"
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowColorPicker(prev => !prev);
                   }}
                 >
                   <BoardIcon name="plus" />
                 </button>
                 {showColorPicker && (
                   <>
                     <div className="custom-color-overlay" onClick={() => setShowColorPicker(false)} />
                     <div className="custom-color-popover" onClick={(e) => e.stopPropagation()}>
                       <HexColorPicker color={state.color} onChange={(c) => dispatch({type: "SET_COLOR", payload: c})} />
                     </div>
                   </>
                 )}
               </div>
            </div>
          </div>
        </aside>
      )}

      {showShapesDrawer && (
        <aside className="floating-rail floating-rail--secondary">
          <span className="rail-title">Shapes</span>
          <div className="draw-tool-grid">
            {shapeTools.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={state.tool === entry.id ? "rail-button rail-button--card is-active" : "rail-button rail-button--card"}
                onClick={() => handleSecondaryToolSelect(entry.id)}
                data-tooltip={entry.label}
              >
                <span className="rail-button__icon"><BoardIcon name={entry.id} /></span>
                <span className="rail-button__label">{entry.label}</span>
              </button>
            ))}
          </div>

          <div className="rail-divider" />

          <div className="brush-control">
            <span className="brush-control__value">{state.brushSize}px</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1" 
              value={state.brushSize} 
              onChange={(e) => dispatch({type: "SET_BRUSH_SIZE", payload: parseInt(e.target.value, 10)})}
            />
          </div>
          
          <div className="palette-group">
            <span className="palette-title">Colors</span>
            <div className="swatch-column">
               {swatches.map(color => (
                 <button 
                   key={color} 
                   type="button" 
                   className={state.color === color ? "color-dot is-selected" : "color-dot"} 
                   style={{backgroundColor: color}} 
                   onClick={() => dispatch({type: "SET_COLOR", payload: color})} 
                 />
               ))}
               <div className="custom-color-wrapper">
                 <button
                   type="button"
                   className="color-dot custom-color-btn"
                   title="Custom Color"
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowColorPicker(prev => !prev);
                   }}
                 >
                   <BoardIcon name="plus" />
                 </button>
                 {showColorPicker && (
                   <>
                     <div className="custom-color-overlay" onClick={() => setShowColorPicker(false)} />
                     <div className="custom-color-popover" onClick={(e) => e.stopPropagation()}>
                       <HexColorPicker color={state.color} onChange={(c) => dispatch({type: "SET_COLOR", payload: c})} />
                     </div>
                   </>
                 )}
               </div>
            </div>
          </div>
        </aside>
      )}
      {showEraserDrawer && (
        <aside className="floating-rail floating-rail--secondary">
          <span className="rail-title">Eraser</span>
          <div className="brush-control">
            <span className="brush-control__value">{Math.max(20, state.brushSize * 5)}px</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1" 
              value={state.brushSize} 
              onChange={(e) => dispatch({type: "SET_BRUSH_SIZE", payload: parseInt(e.target.value, 10)})}
            />
          </div>
        </aside>
      )}

      <section className="board-status">
        <span className={isConnected ? "status-pill is-live" : "status-pill"}>
          <span className="status-text">{statusMessage}</span>
        </span>
        <Link className="leave-link" to="/">
          <BoardIcon name="logout" />
          <span className="btn-text">Leave room</span>
        </Link>
      </section>

      {showHelp && (
        <div className="help-modal">
          <div className="help-card" onClick={(e) => e.stopPropagation()}>
            <div className="help-card__header">
              <div>
                <h3 className="eyebrow">Board Guide</h3>
                <h2>Tools now available</h2>
              </div>
              <button 
                type="button" 
                className="icon-action" 
                onClick={() => setShowHelp(false)} 
                style={{ borderRadius: "50%", width: "40px", height: "40px", background: "rgba(75, 103, 255, 0.1)", color: "var(--blue)" }}
              >
                <BoardIcon name="minus" />
              </button>
            </div>
            <ul className="help-list">
              <li>`Select` lets you pick and drag existing notes, text, shapes, and strokes.</li>
              <li>`Pen` and `Highlight` stream live freehand strokes to everyone in the room.</li>
              <li>`Rectangle`, `Ellipse`, and `Arrow` create shapes by click-dragging on the board.</li>
              <li>`Sticky` and `Text` place editable content blocks using quick prompts.</li>
              <li>`Eraser` removes the item under the cursor and syncs that delete instantly.</li>
              <li>`Hand` pans the board, while mouse wheel zooms around the pointer.</li>
              <li>`Share board` copies the room URL, and `Export` downloads the visible canvas as PNG.</li>
            </ul>
          </div>
        </div>
      )}

      {isVideoActive && (
        <VideoCall
          roomId={state.roomId || roomId}
          userName={state.user?.name || "Guest"}
          socket={socket}
          onClose={() => setIsVideoActive(false)}
        />
      )}
    </main>
  );
}