const WhiteboardRoom = require("../models/WhiteboardRoom");
const createWhiteboardModule = require("./whiteboard_node.js");

const sessions = new Map();
let WasmModule = null;

createWhiteboardModule().then(m => {
  WasmModule = m;
  console.log("✅ C++ WebAssembly Engine (Server) Initialized!");
}).catch(err => {
  console.error("Failed to load Wasm Module:", err);
});

function normalizeLegacyStroke(stroke) {
  return {
    ...stroke,
    kind: "stroke",
    opacity: typeof stroke.opacity === "number" ? stroke.opacity : 1,
  };
}

async function loadRoomSession(roomId) {
  if (sessions.has(roomId)) {
    return sessions.get(roomId);
  }

  if (!WasmModule) {
    WasmModule = await createWhiteboardModule();
  }

  const room = await WhiteboardRoom.findOneAndUpdate(
    { roomId },
    {
      $setOnInsert: {
        roomId,
        items: [],
        historyStack: [],
        redoStack: [],
      },
    },
    { new: true, upsert: true, lean: true },
  );

  const items =
    room.items?.length > 0
      ? room.items
      : (room.strokes || []).map(normalizeLegacyStroke);
  const historyStacks = new Map();
  const redoStacks = new Map();

  if (Array.isArray(room.historyStack)) {
     room.historyStack.forEach(action => {
       const uid = action.senderId || action.item?.userId || "unknown";
       if (!historyStacks.has(uid)) historyStacks.set(uid, []);
       historyStacks.get(uid).push(action);
     });
  } else if (room.historyStack) {
     Object.entries(room.historyStack).forEach(([uid, stack]) => {
       historyStacks.set(uid, stack);
     });
  }

  if (Array.isArray(room.redoStack)) {
     room.redoStack.forEach(action => {
       const uid = action.senderId || action.item?.userId || "unknown";
       if (!redoStacks.has(uid)) redoStacks.set(uid, []);
       redoStacks.get(uid).push(action);
     });
  } else if (room.redoStack) {
     Object.entries(room.redoStack).forEach(([uid, stack]) => {
       redoStacks.set(uid, stack);
     });
  }

  if (historyStacks.size === 0 && Array.isArray(items) && items.length > 0) {
      items.forEach(item => {
          const uid = item.userId || "unknown";
          if (!historyStacks.has(uid)) historyStacks.set(uid, []);
          historyStacks.get(uid).push({ type: "create-item", item });
      });
  }

  const session = {
    roomId,
    engine: new WasmModule.WhiteboardManager(),
    historyStacks,
    redoStacks,
    activeStrokes: new Map(),
    users: new Map(),
    cursors: new Map(),
    lastSavedAt: room.updatedAt || new Date().toISOString(),
    hostUserId: room.hostUserId || null,
    bannedUsers: new Set(room.bannedUsers || []),
  };

  items.forEach(item => {
    const v = new WasmModule.VectorInt();
    (item.fractionalPosition || [50]).forEach(val => v.push_back(val));
    session.engine.addElement(item.id, v, item.userId, JSON.stringify(item));
    v.delete();
  });

  sessions.set(roomId, session);

  return session;
}

function getRoomSession(roomId) {
  return sessions.get(roomId);
}

async function persistRoomState(roomId) {
  const session = sessions.get(roomId);

  if (!session) {
    return;
  }

  const orderedItemsStr = session.engine.getOrderedElements();
  const items = JSON.parse(orderedItemsStr);

  const updatedRoom = await WhiteboardRoom.findOneAndUpdate(
    { roomId },
    {
      roomId,
      items: items,
      historyStack: Object.fromEntries(session.historyStacks),
      redoStack: Object.fromEntries(session.redoStacks),
      hostUserId: session.hostUserId,
      bannedUsers: Array.from(session.bannedUsers),
    },
    { upsert: true, new: true },
  );

  session.lastSavedAt = updatedRoom.updatedAt?.toISOString?.() || new Date().toISOString();
}

function deleteRoomSession(roomId) {
  const session = sessions.get(roomId);
  if (session && session.engine) {
    session.engine.delete(); // Free C++ memory
  }
  sessions.delete(roomId);
}

module.exports = {
  deleteRoomSession,
  getRoomSession,
  loadRoomSession,
  persistRoomState,
  getWasmModule: () => WasmModule
};
