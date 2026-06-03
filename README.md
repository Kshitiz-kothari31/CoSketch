# High-Performance Spatial Whiteboard with Quadtree Optimization & CRDT Sync

An advanced, production-ready real-time collaborative whiteboard built on a hybrid high-performance architecture. It integrates a **C++ WebAssembly (Wasm) CRDT engine** for conflict-free element ordering, a custom **2D Spatial Quadtree** for rendering and hit-testing optimizations, and a reactive client-server synchronization pipeline powered by **React, Socket.IO, Node.js, and MongoDB**.

---

## 🚀 Key Architecture Pillars

### 1. Conflict-Free Replicated Data Types (CRDT) via C++ WebAssembly
To support seamless concurrent drawing and elements arrangement without central database locking, the application utilizes a custom C++ engine compiled to WebAssembly (via Emscripten):
* **Fractional Indexing (`FractionalIndexer`):** Generates intermediate positional indices represented as integer vectors (`std::vector<int>`), allowing users to insert, reorder, or edit board items at arbitrary positions conflict-free.
* **Deterministic Sorting:** Elements are stored in a `std::set<CrdtItem>` sorted by `fractionalPosition`, then `userId`, and finally the unique item `id`.
* **Universal Wasm Execution:** The exact same C++ codebase runs on both the React client (`client/src/wasm/whiteboard.js`) and Node.js server (`server/sockets/whiteboard_node.js`) to guarantee absolute synchronization consistency.

### 2. High-Performance Spatial Indexing (2D Quadtree)
To support infinite canvas panning/zooming and thousands of overlapping shapes without performance bottlenecks:
* **Custom Quadtree (`client/src/lib/Quadtree.js`):** Subdivides the whiteboard into spatial quadrants up to a configurable maximum depth.
* **Efficient Spatial Queries:** Instead of evaluating every element sequentially ($O(N)$ complexity), the system queries the Quadtree for elements intersecting the user's viewport bounds or eraser path ($O(\log N)$ complexity).
* **Smooth Hit-Testing:** Speeds up selection bounding box collisions, translation dragging, and custom stroke eraser segment hit-testing.

### 3. Dynamic Canvas Rendering Engine
* **Smooth Stroke Interpolation:** Utilizes quadratic bezier curve paths to interpolate raw mouse movement coordinates into high-fidelity freehand strokes.
* **Flexible Tool Suite:**
  * **Pen & Highlighter:** Freehand drawing with brush sizing, opacity, and custom hex colors.
  * **Interactive Shapes:** Click-and-drag drawing of vector Rectangles, Ellipses, and Arrows.
  * **Sticky Notes:** Draggable text cards with automatic text word-wrapping and multi-color swatches.
  * **Rich Text Boxes:** Floating text nodes with precise canvas metric estimation.
  * **Canvas Eraser:** Interactive hit-test checking that deletes individual strokes/elements on contact.
  * **Hand Tool:** For panning and viewport dragging.
* **Infinite Canvas Viewport:** Infinite pan and zoom (scroll-wheel zooming clamped between `45%` and `240%`) centered around the user's mouse pointer.

### 4. Multiplayer Sync & Moderation Controls
* **Real-Time Cursor Presence:** Synchronizes hover cursors, coordinates, and name tags of all active room participants over Socket.IO.
* **Host-Based Moderation:** The user who initiates the session is designated as the Host and gains administrative control to temporarily block/ban or unblock other participants from drawing or staying in the room.
* **Synchronized Action Stacks:** Distributed undo/redo capability powered by isolated client-centric action history tracking, coordinated through Socket.IO broadcasts.

---

## 📂 Project Structure

```text
├── client/
│   ├── src/
│   │   ├── components/      # UI components (CanvasBoard, BoardIcon, etc.)
│   │   ├── context/         # React Context for global Whiteboard state
│   │   ├── hooks/           # useWasmEngine, useSocket, and board event listeners
│   │   ├── lib/             # Quadtree.js, board utility algorithms, math
│   │   ├── pages/           # HomePage (Join/Create), RoomPage (Active canvas UI)
│   │   └── wasm/            # C++ Source (CrdtItem, FractionalIndexer) & Compiled JS/Wasm
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── controllers/         # Room REST controllers
│   ├── models/              # MongoDB Mongoose schemas (WhiteboardRoom)
│   ├── routes/              # Express API endpoints
│   ├── sockets/             # Socket.IO handlers & compiled node-compatible Wasm
│   ├── index.js             # Express & Socket.IO server startup
│   └── package.json
│
├── package.json             # Workspace-level package script runner
└── README.md
```

---

## 🛠️ Prerequisites

Make sure you have the following installed on your local machine:
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* **MongoDB** (running locally on port `27017` or a remote MongoDB Atlas URI)

---

## 🔧 Installation & Setup

1. **Clone the Repository** and navigate to the root directory.
2. **Install Dependencies** for both the frontend and backend using the root helper script:
   ```bash
   npm run install:all
   ```
3. **Configure Environment Variables:**
   * Create the server configuration file:
     ```bash
     cp server/.env.example server/.env
     ```
     *Edit `server/.env` with your ports, database URIs, and CORS configurations:*
     ```env
     PORT=5000
     MONGODB_URI=mongodb://127.0.0.1:27017/realtime-whiteboard
     CLIENT_ORIGIN=http://localhost:5173
     ```
   * Create the client configuration file:
     ```bash
     cp client/.env.example client/.env
     ```
     *Edit `client/.env` to point to the server port:*
     ```env
     VITE_API_BASE_URL=http://localhost:5000/api
     VITE_SOCKET_URL=http://localhost:5000
     ```

---

## 💻 Running the Application

For local development, you should run the client and server concurrently.

1. **Start the backend server** in a terminal:
   ```bash
   npm run dev:server
   ```
2. **Start the Vite frontend server** in a separate terminal:
   ```bash
   npm run dev:client
   ```
3. **Open the browser** and navigate to the address shown by Vite (typically `http://localhost:5173`).

---

## 🔄 How the CRDT Engine & Sync Pipeline Work

```mermaid
sequenceDiagram
    participant User A (Client)
    participant Server (Node.js + Wasm)
    participant User B (Client)
    participant Database (MongoDB)

    User A (Client)->>User A (Client): Draws new item / updates position
    User A (Client)->>User A (Client): Generates intermediate index via Wasm (local copy)
    User A (Client)->>Server (Node.js + Wasm): Sends board-action (stroke, coordinates, index) via Socket.IO
    Note over Server (Node.js + Wasm): Inserts element into Server's Wasm std::set<CrdtItem>
    Server (Node.js + Wasm)-->>Database (MongoDB): Autosaves ordered items to room history
    Server (Node.js + Wasm)->>User B (Client): Broadcasts board-action over Socket.IO
    User B (Client)->>User B (Client): Updates client-side Wasm state & draws on Canvas
```

### Fractional Indexing Math
To insert an element between position $P_1$ (e.g. `[10]`) and $P_2$ (e.g. `[20]`), the C++ `FractionalIndexer` calculates the midpoint `[15]`. If the distance is too narrow (e.g., between `[10]` and `[11]`), it expands the dimensions (appending elements, resulting in e.g. `[10, 50]`). This allows an infinite sequence of insertions between any two items without affecting the keys of existing items.

---

## 🧪 Testing Real-Time & Advanced Features

Follow these steps to verify full functionality:

1. **Collaboration Test:**
   * Open the client URL in a normal window and an incognito window side-by-side.
   * Create a room in the first window, copy the **Room ID** from the top-center button, and join using that ID in the second window.
   * Draw with the **Pen** or **Highlighter** in one window and verify it streams smoothly in the other.
2. **Canvas Tools & Eraser:**
   * Select a shape tool (Rectangle, Ellipse, Arrow) and drag to draw.
   * Use the **Eraser** tool to swipe over lines or shapes. Confirm that collision detection (calculated via the local **Quadtree**) deletes the elements instantly on both clients.
3. **Viewport Pan and Zoom:**
   * Toggle the **Hand** tool to pan around, or zoom in/out with the scroll-wheel or navigation dock. Confirm the dot grid aligns properly.
4. **Moderation Control:**
   * Ensure both clients are in the same room. Under the presence dropdown on the Host client, click **Block** on the other client.
   * Verify the blocked user is restricted from drawing or interacting with the canvas until the Host clicks **Unblock**.
5. **Autosave Verification:**
   * Refresh the page on both clients. The room should load all previous elements in the exact correct order from MongoDB.
6. **PNG Exporting:**
   * Draw a diagram, click the **Export** icon in the top-left toolbar, and verify the downloaded PNG file matches the canvas contents.

---

## 📦 Production Builds

To compile and serve optimized production builds:

1. **Build the React frontend client:**
   ```bash
   npm run build
   ```
2. **Launch the Node.js server:**
   ```bash
   npm run start
   ```
   *Note: The Express backend is configured to automatically serve the built React app statically from `client/dist` if it is present.*
