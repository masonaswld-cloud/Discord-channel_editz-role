const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const permissions = {
  view_channel: "ViewChannel",
  send_messages: "SendMessages",
  manage_messages: "ManageMessages",
  embed_links: "EmbedLinks",
  attach_files: "AttachFiles",
  read_message_history: "ReadMessageHistory",
  mention_everyone: "MentionEveryone",
  use_application_commands: "UseApplicationCommands",
  manage_channels: "ManageChannels",
  manage_roles: "ManageRoles",
  add_reactions: "AddReactions"
};

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "Discord Channel Permission API",
    version: "4.0.0"
  });
});

app.post("/edit-channel-permission", async (req, res) => {
  try {
    if (req.headers["x-api-key"] !== API_KEY) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized."
      });
    }

    const {
      channel_id,
      role_id,
      permission,
      permission2,
      permission3,
      permission4,
      permission5,
      action
    } = req.body;

    if (!channel_id || !role_id || !permission || !action) {
      return res.status(400).json({
        ok: false,
        error: "Channel, role, permission1 and action are required."
      });
    }

    const selected = [
      permission,
      permission2,
      permission3,
      permission4,
      permission5
    ]
      .filter(p => typeof p === "string" && p.trim() !== "")
      .map(p => p.trim().toLowerCase());

    const unique = [...new Set(selected)];

    if (!["allow", "deny", "reset"].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid action."
      });
    }

    const flags = {};

    for (const perm of unique) {
      if (!permissions[perm]) {
        return res.status(400).json({
          ok: false,
          error: `Invalid permission: ${perm}`
        });
      }

      flags[permissions[perm]] =
        action === "allow" ? true :
        action === "deny" ? false :
        null;
    }

    const channel = await client.channels.fetch(channel_id);

    if (!channel || !channel.permissionOverwrites) {
      return res.status(404).json({
        ok: false,
        error: "Channel not found or unsupported."
      });
    }

    await channel.permissionOverwrites.edit(role_id, flags, {
      reason: "Permission update through API"
    });

    return res.json({
      ok: true,
      message: "Channel permissions updated.",
      channel_id,
      role_id,
      permissions: unique,
      action
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.login(BOT_TOKEN);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
