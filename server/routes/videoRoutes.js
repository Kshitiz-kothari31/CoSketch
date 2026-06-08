const express = require("express");
const { AccessToken } = require("livekit-server-sdk");

const router = express.Router();

router.get("/token", async (req, res) => {
  const { roomName, participantName } = req.query;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: "Missing roomName or participantName" });
  }

  // Gracefully handle missing LiveKit configuration without crashing the server
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const apiUrl = process.env.LIVEKIT_API_URL || process.env.LIVEKIT_URL;

  if (
    !apiKey || 
    apiKey === "your-api-key" || 
    !apiSecret || 
    apiSecret === "your-api-secret"
  ) {
    console.warn("LiveKit credentials are not configured in server/.env");
    return res.status(503).json({
      error: "LiveKit video service is not configured on the server. Please set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in your server's .env file."
    });
  }

  try {
    // Create an access token for the participant
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Token expires in 2 hours
      ttl: "2h",
    });

    // Grant permissions to join the specific WebRTC video room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    res.json({ token, serverUrl: apiUrl || "wss://your-project-domain.livekit.cloud" });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    res.status(500).json({ error: "Failed to generate video call access token." });
  }
});

module.exports = router;
