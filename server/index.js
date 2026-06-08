const fs = require("fs");
const http = require("http");
const path = require("path");

const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const roomRoutes = require("./routes/roomRoutes");
const videoRoutes = require("./routes/videoRoutes");
const registerSocketHandlers = require("./sockets/registerSocketHandlers");

dotenv.config();

const app = express();
const server = http.createServer(app);

const defaultClientOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const clientOrigins = [
  ...new Set(
    [
      ...defaultClientOrigins,
      ...(process.env.CLIENT_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ],
  ),
];

const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/video", videoRoutes);

const clientBuildPath = path.resolve(__dirname, "../client/dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

registerSocketHandlers(io);

async function startServer() {
  const port = Number(process.env.PORT) || 5000;

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/realtime-whiteboard");

  server.listen(port, () => {
    console.log(`Whiteboard server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
