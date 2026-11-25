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
  view_channel: ["ViewChannel", PermissionsBitField.Flags.ViewChannel],
  send_messages: ["SendMessages", PermissionsBitField.Flags.SendMessages],
  add_reactions: ["AddReactions", PermissionsBitField.Flags.AddReactions],
  manage_messages: ["ManageMessages", PermissionsBitField.Flags.ManageMessages],
  embed_links: ["EmbedLinks", PermissionsBitField.Flags.EmbedLinks],
  attach_files: ["AttachFiles", PermissionsBitField.Flags.AttachFiles],
  read_message_history: ["ReadMessageHistory", PermissionsBitField.Flags.ReadMessageHistory],
  mention_everyone: ["MentionEveryone", PermissionsBitField.Flags.MentionEveryone],
  use_application_commands: ["UseApplicationCommands", PermissionsBitField.Flags.UseApplicationCommands],
  manage_channels: ["ManageChannels", PermissionsBitField.Flags.ManageChannels],
  manage_roles: ["ManageRoles", PermissionsBitField.Flags.ManageRoles]
};

// Home
app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "Discord Channel Permission API",
    version: "3.0.0"
  });
});

// Health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Edit permissions
app.post("/edit-channel-permission", async (req, res) => {
  try {
    // API key
    if (!API_KEY || req.headers["x-api-key"] !== API_KEY) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const { channel_id, role_id, action } = req.body;

    // Accept an array OR up to 5 BotGhost options
    let selected = req.body.permissions;

    if (!selected) {
      selected = [
        req.body.permission,
        req.body.permission2,
        req.body.permission3,
        req.body.permission4,
        req.body.permission5
      ];
    }

    if (!Array.isArray(selected)) {
      selected = [selected];
    }

    // Remove empty and duplicate permissions
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

    // Validate permissions
    const invalid = chosen.filter(p => !permissions[p]);

    if (invalid.length) {
      return res.status(400).json({
        ok: false,
        error: "Invalid permissions",
        invalid
      });
    }

    // Validate action
    if (!["allow", "deny", "reset"].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: "Action must be allow, deny, or reset."
      });
    }

    // Fetch channel
    const channel = await client.channels.fetch(channel_id);

    if (!channel || !channel.guild || !channel.permissionOverwrites) {
      return res.status(404).json({
        ok: false,
        error: "Channel not found or unsupported."
      });
    }

    // Fetch role
    const role = await channel.guild.roles.fetch(role_id);

    if (!role) {
      return res.status(404).json({
        ok: false,
        error: "Role not found."
      });
    }

    // Change only the selected permissions
    const changes = {};

    for (const name of chosen) {
      const [flagName] = permissions[name];

      changes[flagName] =
        action === "allow" ? true :
        action === "deny" ? false :
        null;
    }

    await channel.permissionOverwrites.edit(
      role.id,
      changes
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

// Start API
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
