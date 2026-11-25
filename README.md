# Discord Channel Permission API

API for the `/edit channel perm role` Discord command.

## Features

- Allow a permission
- Deny a permission
- Reset a permission
- Edit permissions for a Discord role in a specific channel

## Render Environment Variables

Add these in Render:

- `DISCORD_TOKEN`
- `API_KEY`

Never put your Discord bot token in GitHub.

## API Endpoint

POST `/edit-channel-permission`

### Headers

```text
Content-Type: application/json
x-api-key: YOUR_API_KEY
