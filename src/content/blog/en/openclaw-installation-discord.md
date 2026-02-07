---
title: 'OpenClaw Installation & Discord Integration Guide'
description: 'A complete guide to installing the AI agent OpenClaw on a Mac mini and integrating it with Discord.'
pubDate: '2026-02-07'
heroImage: '/images/blog/gateway-status.png'
tags: ['openclaw', 'discord', 'mac-mini', 'ai-agent', 'setup']
category: 'tech'
---

## TL;DR

> I wanted to run the trending AI agent **OpenClaw** 24/7 at home, so I bought a Mac mini. Got it for around $500 with student discount! Here's the complete process from installation to Discord integration.

---

## Why Mac mini?

OpenClaw is a local AI agent gateway. The idea of having an always-on AI that I can message anytime was appealing.

I needed a machine to run as a server, and after some consideration, I chose the **Mac mini**.

### Why I Chose It

- **Low power**: Minimal electricity cost even when running 24/7
- **macOS**: OpenClaw runs most stable on macOS
- **Compact**: Perfect size for a corner of my desk
- **Student discount**: About 10% off at the Education Store!

### Purchase Info

| Item | Details |
|------|---------|
| Model | Mac mini (M4) |
| Price | **~$500** (with student discount) |
| Shipping | Arrived in **2 days** |

> 💡 If you're a student or educator, you can get a discount at the [Apple Education Store](https://www.apple.com/us-hed/shop)!

---

## Step 1: Prerequisites

### AI Model Subscription

To use OpenClaw, you need access to an AI model. Here are some options:

**1. Claude Pro / Claude Code Subscription (Recommended)**
- [Claude Pro](https://claude.ai/pro) - $20/month, for general users
- [Claude Code](https://claude.ai/code) - $100/month, for developers (includes API credits)

**2. Google AI Pro Subscription**
- [Google AI Pro](https://ai.google/) - Access to Gemini models

**3. Anthropic API Key**
- Get an API key from [Anthropic Console](https://console.anthropic.com/)
- Pay-as-you-go pricing

> 💡 I'm using **Google AI Pro** and **Claude Pro** subscriptions. With a subscription plan, you can use OpenClaw without a separate API key!

---

## Step 2: Installing OpenClaw

### Run the Install Script

The easiest way is to use the official install script.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Once installed, you can use the `openclaw` command.

```bash
openclaw --version
```

![OpenClaw Version Check](/blog/images/blog/openclaw-version.png)

### Run the Onboarding Wizard

The onboarding wizard helps with initial setup.

```bash
openclaw onboard --install-daemon
```

![Onboarding Start - Security Warning](/blog/images/blog/onboard-wizard.png)

First, you'll see a security warning. AI agents are powerful tools, so use them carefully. Select `Yes` to proceed.

![Onboarding Settings](/blog/images/blog/onboard-flow.png)

The wizard asks about:

1. **Onboarding mode**: QuickStart or Advanced
2. **Config handling**: Use existing / Update / Reset
3. **Model setup**: Choose your AI model (Claude, Gemini, etc.)
4. **Channel setup**: Select messaging apps to connect
5. **Daemon install**: Auto-start on system boot

### Access the Web Dashboard

After installation, the web dashboard opens automatically!

```bash
openclaw dashboard
```

> 🎉 **From here, you can configure everything via chat!**
> 
> Once the model is connected, you can continue setup by chatting with AI in the web dashboard. Just say "Set up Discord integration" and it'll guide you!

### Check Gateway Status

```bash
openclaw gateway status
```

![Gateway Status](/blog/images/blog/gateway-status.png)

If you see `running`, you're good! 🎉

---

## Step 3: Create a Discord Bot

### Access Discord Developer Portal

Go to the [Discord Developer Portal](https://discord.com/developers/applications).

### Create a New Application

1. Click **New Application**
2. Enter app name (e.g., "OpenClaw Bot")
3. Click **Create**

### Bot Settings

1. Click **Bot** in the left menu
2. **Reset Token** → Copy the token (you'll need it later!)
3. In **Privileged Gateway Intents**:
   - ✅ **Message Content Intent** - Required!
   - ✅ **Server Members Intent** - Recommended

> ⚠️ If you don't enable **Message Content Intent**, the bot can't read messages!

### Generate OAuth2 URL

1. Click **OAuth2 → URL Generator** in the left menu
2. Select **Scopes**:
   - ✅ bot
   - ✅ applications.commands
3. Select **Bot Permissions**:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Add Reactions

4. Copy the generated URL at the bottom

### Invite the Bot to Your Server

Paste the URL in your browser and select the server to invite the bot to.

---

## Step 4: Connect Discord to OpenClaw

### Configure via Dashboard

No need to manually edit config files! Just ask in the web dashboard chat.

```
Set up Discord integration. My bot token is [YOUR_BOT_TOKEN].
```

OpenClaw will automatically:
1. Enable Discord channel
2. Set the bot token
3. Configure permissions
4. Restart the Gateway

All done! 🎉

### (Optional) Manual Configuration

If you prefer manual setup, edit `~/.openclaw/openclaw.json`:

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "dm": {
        "enabled": true,
        "policy": "pairing"
      },
      "guilds": {
        "*": {
          "requireMention": true
        }
      }
    }
  }
}
```

> 💡 You can check current settings by asking "Show me the current Discord config" in the dashboard.

---

## Step 5: Testing

### DM Test

Send a DM to the bot on Discord. You'll receive a pairing code.

```
Hello!
```

Approve the pairing in terminal:

```bash
openclaw pairing approve discord <user_id>
```

After approval, send another message and the bot will respond! 🎉

### Server Channel Test

Mention the bot in a server channel to get a response.

```
@OpenClaw Hello?
```

---

## Troubleshooting

### Bot Not Responding

1. **Check Gateway status**
   ```bash
   openclaw gateway status
   ```

2. **Check logs**
   ```bash
   openclaw gateway logs
   ```

3. **Verify Message Content Intent**
   - Double-check it's enabled in Discord Developer Portal

4. **Check channel permissions**
   - Make sure the bot has read/write permissions

### "Used disallowed intents" Error

→ **Message Content Intent** is not enabled in Discord Developer Portal. Enable it and restart the Gateway.

---

## Wrap Up

Now you can summon your AI agent anytime on Discord! 🦞

### Next Steps

- **More channel integrations**: WhatsApp, Telegram, iMessage, etc.
- **Custom skills**: Build your own features
- **Multi-agent**: Run multiple AI agents

### References

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

> 💬 Questions or feedback? Leave a comment!
