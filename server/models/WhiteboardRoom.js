const mongoose = require("mongoose");

const WhiteboardRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    historyStack: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    redoStack: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    hostUserId: {
      type: String,
      default: null,
    },
    bannedUsers: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

module.exports = mongoose.model("WhiteboardRoom", WhiteboardRoomSchema);
