import React, { useState, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "./VideoCall.css";

export default function VideoCall({ roomId, userName, socket, onClose }) {
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const [size, setSize] = useState({ width: 360, height: 480 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const initialWidth = isMobile ? Math.min(320, window.innerWidth * 0.9) : 360;
    const initialHeight = isMobile ? Math.min(440, window.innerHeight * 0.75) : 480;
    
    setSize({ width: initialWidth, height: initialHeight });
    setPosition({
      x: isMobile ? (window.innerWidth - initialWidth) / 2 : Math.max(0, window.innerWidth - initialWidth - 24),
      y: isMobile ? (window.innerHeight - initialHeight) / 2 : Math.max(0, window.innerHeight - initialHeight - 24)
    });
  }, []);

  const handleResizeDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: size.width,
      initialHeight: size.height
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    
    // Clamp to min size and screen bounds
    const newWidth = Math.max(280, Math.min(resizeRef.current.initialWidth + dx, window.innerWidth - position.x));
    const newHeight = Math.max(360, Math.min(resizeRef.current.initialHeight + dy, window.innerHeight - position.y));

    setSize({
      width: newWidth,
      height: newHeight
    });
  };

  const handleResizeUp = (e) => {
    setIsResizing(false);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('.btn-close-call')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    let newX = dragRef.current.initialX + dx;
    let newY = dragRef.current.initialY + dy;

    // Clamp to window bounds using current size
    newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - size.height));

    setPosition({
      x: newX,
      y: newY
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const floatingStyle = {
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    maxWidth: '100vw',
    maxHeight: '100vh',
    bottom: 'auto',
    right: 'auto',
    margin: 0,
    transform: 'none',
    transition: (isDragging || isResizing) ? 'none' : undefined
  };

  useEffect(() => {
    let active = true;
    const fetchToken = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
        const response = await fetch(
          `${baseUrl}/video/token?roomName=${encodeURIComponent(roomId)}&participantName=${encodeURIComponent(userName)}`
        );
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!active) return;

        if (data.error) {
          throw new Error(data.error);
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load video token:", err);
        setError(err.message || "Could not establish connection to the video call server.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchToken();
    return () => {
      active = false;
    };
  }, [roomId, userName]);

  if (loading) {
    return (
      <div className="floating-video-container loading-state" style={floatingStyle}>
        <div 
          className="video-call-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          <span>Connecting to call...</span>
          <button className="btn-close-call" onClick={onClose}>✖</button>
        </div>
        <div className="video-call-message-body">
          <div className="spinner"></div>
          <p>Requesting access token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="floating-video-container error-state" style={floatingStyle}>
        <div 
          className="video-call-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          <span>Video Call Integration</span>
          <button className="btn-close-call" onClick={onClose}>✖</button>
        </div>
        <div className="video-call-message-body">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
          <button className="btn-retry" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="floating-video-container" style={floatingStyle}>
      <div 
        className="video-call-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <span>Active Call: {roomId} ({userName})</span>
        <button className="btn-close-call" onClick={onClose} title="Leave Call">
          ✖
        </button>
      </div>

      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connectOptions={{ autoSubscribe: true }}
        data-lk-theme="default"
        onDisconnected={onClose}
        style={{ height: "calc(100% - 45px)", display: "flex", flexDirection: "column" }}
      >
        <CustomVideoLayout />
        <CustomControlBar onLeave={onClose} socket={socket} />
        <RoomAudioRenderer />
      </LiveKitRoom>

      <div 
        className="resize-handle"
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '24px',
          height: '24px',
          cursor: 'nwse-resize',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '4px'
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ width: '12px', height: '12px', opacity: 0.8 }}>
          <line x1="14" y1="21" x2="21" y2="14" />
          <line x1="8" y1="21" x2="21" y2="8" />
        </svg>
      </div>
    </div>
  );
}

function CustomVideoLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: "camera" },
      { source: Track.Source.ScreenShare, name: "screen_share" },
    ],
    { onlySubscribed: false }
  );

  const [focusedTrackKey, setFocusedTrackKey] = useState(null);

  // Find any screen share track to auto-focus
  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare);

  // Determine which track is focused
  const activeFocusedTrack = tracks.find(t => `${t.participant.identity}_${t.source}` === focusedTrackKey)
    || screenShareTrack
    || tracks[0];

  // The remaining tracks go to the small grid
  const thumbnailTracks = tracks.filter(t => t !== activeFocusedTrack);

  return (
    <div className="video-layout-container">
      {/* Big Screen */}
      {activeFocusedTrack ? (
        <div className="focused-video-container">
          <ParticipantTile trackRef={activeFocusedTrack} />
        </div>
      ) : (
        <div className="empty-call-state">
          <p>Waiting for others to share video/audio...</p>
        </div>
      )}

      {/* Small Grid (Thumbnails) */}
      {thumbnailTracks.length > 0 && (
        <div className="thumbnail-grid">
          {thumbnailTracks.map((trackReference) => {
            const key = `${trackReference.participant.identity}_${trackReference.source}`;
            return (
              <div 
                key={key} 
                className="thumbnail-wrapper"
                onClick={() => setFocusedTrackKey(key)}
              >
                <ParticipantTile trackRef={trackReference} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomControlBar({ onLeave, socket }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);

  // Sync state with localParticipant tracks and broadcast call status
  useEffect(() => {
    if (!localParticipant) return;

    const updateStates = () => {
      const mic = localParticipant.isMicrophoneEnabled;
      const cam = localParticipant.isCameraEnabled;
      const screen = localParticipant.isScreenShareEnabled;

      setIsMicOn(mic);
      setIsCamOn(cam);
      setIsScreenOn(screen);

      socket?.emit("update-call-status", {
        inCall: true,
        micEnabled: mic,
        camEnabled: cam
      });
    };

    updateStates();

    // Listen for changes
    localParticipant.on("localTrackPublished", updateStates);
    localParticipant.on("localTrackUnpublished", updateStates);
    localParticipant.on("trackMuted", updateStates);
    localParticipant.on("trackUnmuted", updateStates);

    return () => {
      localParticipant.off("localTrackPublished", updateStates);
      localParticipant.off("localTrackUnpublished", updateStates);
      localParticipant.off("trackMuted", updateStates);
      localParticipant.off("trackUnmuted", updateStates);
      
      // Clean up call status on disconnect/unmount
      socket?.emit("update-call-status", {
        inCall: false,
        micEnabled: false,
        camEnabled: false
      });
    };
  }, [localParticipant, socket]);

  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    } catch (err) {
      console.error("Failed to toggle mic:", err);
    }
  };

  const toggleCam = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCamOn);
      setIsCamOn(!isCamOn);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  };

  const toggleScreen = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenOn);
      setIsScreenOn(!isScreenOn);
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
    }
  };

  const handleLeave = () => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  };

  return (
    <div className="custom-control-bar">
      <button 
        className={`control-btn ${isMicOn ? "btn-active" : "btn-inactive"}`} 
        onClick={toggleMic}
        title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
      >
        {isMicOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" x2="23" y1="1" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      <button 
        className={`control-btn ${isCamOn ? "btn-active" : "btn-inactive"}`} 
        onClick={toggleCam}
        title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
      >
        {isCamOn ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 8-6 4 6 4V8Z" />
            <rect x="2" y="6" width="12" height="12" rx="2" ry="2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" x2="23" y1="1" y2="23" />
            <path d="m21 16 1.74 1.16a1 1 0 0 0 1.26-.23L24 16.8V7.2l-.04-.03a1 1 0 0 0-1.22-.17L21 8.2" />
            <path d="M14 14H3a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2h8.5M16 10.34v3.66a2 2 0 0 1-2 2h-1.66" />
          </svg>
        )}
      </button>

      <button 
        className={`control-btn ${isScreenOn ? "btn-screen-active" : "btn-inactive"}`} 
        onClick={toggleScreen}
        title={isScreenOn ? "Stop Screen Share" : "Share Screen"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
          {isScreenOn && <path d="M17 8l-5-5-5 5M12 3v10" stroke="#10b981" />}
        </svg>
      </button>

      <button 
        className="control-btn btn-leave" 
        onClick={handleLeave}
        title="Leave Call"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </button>
    </div>
  );
}
