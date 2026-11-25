const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_KEY = process.env.API_KEY;

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

function checkApiKey(req, res, next) {
  if (!API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "API_KEY is not configured."
    });
  }

  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized."
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

app.post("/edit-channel-permission", checkApiKey, async (req, res) => {
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
        error: "Missing required information."
      });
    }

    const permissionName = String(permission).toLowerCase();
    const permissionValue = permissions[permissionName];

    if (!permissionValue) {
      return res.status(400).json({
        ok: false,
        error: "Unknown permission."
      });
    }

    const selectedAction = String(action).toLowerCase();

    if (
      selectedAction !== "allow" &&
      selectedAction !== "deny" &&
      selectedAction !== "reset"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Action must be allow, deny, or reset."
      });
    }

    let allow = "0";
    let deny = "0";

    if (selectedAction === "allow") {
      allow = permissionValue;
    }

    if (selectedAction === "deny") {
      deny = permissionValue;
    }

    const discordResponse = await fetch(
      "https://discord.com/api/v10/channels/" +
        channel_id +
        "/permissions/" +
        role_id,
      {
        method: "PUT",
        headers: {
          Authorization: "Bot " + DISCORD_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: String(role_id),
          type: 0,
          allow: allow,
          deny: deny
        })
      }
    );

    if (!discordResponse.ok) {
      const discordError = await discordResponse.text();

      return res.status(discordResponse.status).json({
        ok: false,
        error: "Discord API request failed.",
        discord_response: discordError
      });
    }

    return res.json({
      ok: true,
      message: "Channel permission updated.",
      channel_id: String(channel_id),
      role_id: String(role_id),
      permission: permissionName,
      action: selectedAction
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "Discord Channel Permission API running on port " + PORT
  );
});
