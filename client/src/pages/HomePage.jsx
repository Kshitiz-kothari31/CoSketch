import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createRoom } from "../lib/api";

function ensureUserId() {
  const storageKey = "cosketch-user-id";
  const existingUserId = window.localStorage.getItem(storageKey);

  if (existingUserId) {
    return existingUserId;
  }

  const nextUserId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, nextUserId);
  return nextUserId;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState(window.localStorage.getItem("cosketch-name") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  function persistIdentity(nextName) {
    const trimmedName = nextName.trim() || "Guest";
    const user = {
      id: ensureUserId(),
      name: trimmedName,
    };

    window.localStorage.setItem("cosketch-name", trimmedName);

    return user;
  }

  async function handleCreateRoom() {
    try {
      setLoading(true);
      setError("");

      const user = persistIdentity(name);
      const data = await createRoom();

      navigate(`/room/${data.roomId}`, { state: { user } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleJoinRoom(event) {
    event.preventDefault();

    if (!roomId.trim()) {
      setError("Enter a room ID to continue.");
      return;
    }

    const user = persistIdentity(name);
    navigate(`/room/${roomId.trim().toUpperCase()}`, { state: { user } });
  }

  return (
    <main className="landing-page">
      <section className="hero-card">
        <p className="eyebrow">Real-Time Collaboration</p>
        <h1>Sketch, sync, and share ideas instantly.</h1>
        <p className="hero-copy">
          CoSketch gives every room a shared canvas with live drawing, undo and redo stacks,
          persistent history, and remote cursors.
        </p>

        <form className="hero-form" onSubmit={handleJoinRoom}>
          <label htmlFor="display-name">Display Name</label>
          <input
            id="display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada"
            maxLength={32}
          />

          {showJoinInput && (
            <>
              <label htmlFor="room-id">Room ID</label>
              <input
                id="room-id"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                placeholder="A1B2C3D4"
                maxLength={16}
                autoFocus
              />
            </>
          )}

          <div className="hero-actions">
            {!showJoinInput ? (
              <>
                <button type="button" onClick={() => setShowJoinInput(true)}>Join Room</button>
                <button type="button" className="secondary-button" onClick={handleCreateRoom} disabled={loading}>
                  {loading ? "Creating..." : "Create Room"}
                </button>
              </>
            ) : (
              <>
                <button type="submit">Confirm Join</button>
                <button type="button" className="secondary-button" onClick={() => { setShowJoinInput(false); setError(""); }} disabled={loading}>
                  Cancel
                </button>
              </>
            )}
          </div>

          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

