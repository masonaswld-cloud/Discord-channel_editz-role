
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Supported permissions
const permissions = {
  view_channel: PermissionsBitField.Flags.ViewChannel,
  send_messages: PermissionsBitField.Flags.SendMessages,
  add_reactions: PermissionsBitField.Flags.AddReactions,
  manage_messages: PermissionsBitField.Flags.ManageMessages,
  embed_links: PermissionsBitField.Flags.EmbedLinks,
  attach_files: PermissionsBitField.Flags.AttachFiles,
  read_message_history: PermissionsBitField.Flags.ReadMessageHistory,
  mention_everyone: PermissionsBitField.Flags.MentionEveryone,
  use_application_commands: PermissionsBitField.Flags.UseApplicationCommands,
  manage_channels: PermissionsBitField.Flags.ManageChannels,
  manage_roles: PermissionsBitField.Flags.ManageRoles
};

// Home
app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "Discord Channel Permission API",
    version: "2.1.0"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Edit multiple channel permissions
app.post("/edit-channel-permission", async (req, res) => {
  try {
    // API key protection
    if (!API_KEY || req.headers["x-api-key"] !== API_KEY) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const { channel_id, role_id, action } = req.body;

    let selected = req.body.permissions;

    // Support old single-permission requests
    if (!selected && req.body.permission) {
      selected = [req.body.permission];
    }

    if (!Array.isArray(selected)) {
      return res.status(400).json({
        ok: false,
        error: "permissions must be an array"
      });
    }

    // Remove empty and duplicate values
    const chosen = [...new Set(
      selected.filter(
        p => typeof p === "string" && p.trim()
      )
    )];

    if (!channel_id || !role_id || chosen.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Channel, role, and at least one permission are required."
      });
    }

    // Check permissions
    const invalid = chosen.filter(p => !permissions[p]);

    if (invalid.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid permissions",
        invalid
      });
    }

    // Check action
    if (!["allow", "deny", "reset"].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: "Action must be allow, deny, or reset."
      });
    }

    // Fetch channel and guild
    const channel = await client.channels.fetch(channel_id);

    if (!channel || !channel.guild) {
      return res.status(404).json({
        ok: false,
        error: "Channel not found."
      });
    }

    const guild = channel.guild;

    // Fetch role
    const role = await guild.roles.fetch(role_id);

    if (!role) {
      return res.status(404).json({
        ok: false,
        error: "Role not found."
      });
    }

    // Combine permission bitfields
    const bitfield = chosen.reduce(
      (total, name) => total | permissions[name],
      0n
    );

    // Apply selected permissions
    const overwrite = {
      allow: action === "allow" ? bitfield : 0n,
      deny: action === "deny" ? bitfield : 0n
    };

    await channel.permissionOverwrites.edit(
      role.id,
      overwrite
    );

    return res.json({
      ok: true,
      message: "Channel permissions updated.",
      channel_id,
      role_id,
      permissions: chosen,
      action
    });

  } catch (error) {
    console.error("Permission API error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Internal server error"
    });
  }
});

// Start bot and API
async function start() {
  try {
    await client.login(BOT_TOKEN);
    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

start();
