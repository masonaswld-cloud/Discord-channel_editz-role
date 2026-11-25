const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_KEY = process.env.API_KEY;

function auth(req, res, next) {
  if (req.get("x-api-key") !== API_KEY) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "Discord Channel Permission API",
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true
  });
});

app.post("/edit-channel-permission", auth, async (req, res) => {
  try {
    const {
      channel_id,
      role_id,
      permission,
      action
    } = req.body;

    if (!DISCORD_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "DISCORD_TOKEN is not configured."
      });
    }

    if (!channel_id || !role_id || !permission || !action) {
      return res.status(400).json({
        ok: false,
        error: "Missing channel_id, role_id, permission, or action."
      });
    }

    const permissions = {
      view_channel: "1024",
      send_messages: "2048",
      manage_messages: "8192",
      embed_links: "16384",
      attach_files: "32768",
      read_message_history: "65536",
      mention_everyone: "131072",
      use_application_commands: "2147483648",
      manage_channels: "16",
      manage_roles: "268435456"
    };

    const permissionValue =
      permissions[String(permission).toLowerCase()];

    if (!permissionValue) {
      return res.status(400).json({
        ok: false,
        error: "Unknown permission."
      });
    }

    const normalizedAction = String(action).toLowerCase();

    if (!["allow", "deny", "reset"].includes(normalizedAction)) {
      return res.status(400).json({
        ok: false,
        error: "Action must be allow, deny, or reset."
      });
    }

    let allow = "0";
    let deny = "0";

    if (normalizedAction === "allow") {
      allow = permissionValue;
    }

    if (normalizedAction === "deny") {
      deny = permissionValue;
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channel_id}/permissions/${role_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: String(role
