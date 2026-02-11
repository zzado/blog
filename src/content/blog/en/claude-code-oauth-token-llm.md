---
title: 'Using Claude Code OAuth Token for LLM API in External Projects'
description: 'How to use Claude Code subscription OAuth tokens to call Anthropic LLM API from external Python projects without additional API costs.'
pubDate: '2026-02-12'
heroImage: '/images/blog/openclaw-claude-oauth-hero.png'
tags: ['claude', 'oauth', 'anthropic', 'python', 'langchain', 'llm']
category: 'tech'
---

## TL;DR

> If you have a Claude Code/Pro subscription, you can extract the **OAuth token** and call the LLM API from external Python projects at no additional cost. The key is the `anthropic-beta` header and Claude Code system prompt. I figured out the authentication method by analyzing OpenClaw's internal pi-ai module.

---

## Background

I needed to use the Claude API in an external Python project. The problem: getting a separate Anthropic API key means pay-per-use billing. I was already subscribing to Claude Code — paying extra felt wasteful.

So the question was: could I just use the **OAuth token** from my Claude Code subscription directly against the Anthropic API?

Short answer: **yes.** But you need to get a few key authentication details exactly right.

---

## Process

### Step 1: What is an OAuth Token?

When you install Claude Code, you can generate an authentication token with the `claude setup-token` command:

```bash
claude setup-token
```

This produces an **OAuth token** — a string starting with `sk-ant-oat`. It serves as an authentication credential for the Anthropic API.

```bash
# Token format example
sk-ant-oat01-XXXXXXXXXXXXXXXXXXXX...
```

This is different from a regular Anthropic API key (`sk-ant-api`). The OAuth token provides **subscription-based authentication**, allowing API calls within your subscription limits without additional charges.

### Step 2: Analyzing OpenClaw's pi-ai Module

Having just the OAuth token isn't enough to call the API directly. A standard request will fail with an authentication error.

To discover what headers and settings are needed, I analyzed OpenClaw's internal pi-ai module. OpenClaw is Node.js-based and uses `@anthropic-ai/sdk` to call the Anthropic API.

#### Anthropic SDK Client Analysis

```javascript
// @anthropic-ai/sdk/client.js
constructor({
  apiKey = readEnv('ANTHROPIC_API_KEY') ?? null,
  authToken = readEnv('ANTHROPIC_AUTH_TOKEN') ?? null,
  ...opts
} = {}) { ... }

// Auth header building
async authHeaders(opts) {
  return buildHeaders([
    await this.apiKeyAuth(opts),   // X-Api-Key method
    await this.bearerAuth(opts)    // Bearer token method
  ]);
}

// API key auth → X-Api-Key header
async apiKeyAuth(opts) {
  return buildHeaders([{ 'X-Api-Key': this.apiKey }]);
}

// Bearer token auth → Authorization header (for OAuth tokens)
async bearerAuth(opts) {
  return buildHeaders([
    { Authorization: `Bearer ${this.authToken}` }
  ]);
}
```

The SDK supports two authentication methods:
- **API key method**: `X-Api-Key` header (standard API keys)
- **Bearer token method**: `Authorization: Bearer` header (OAuth tokens)

OAuth tokens (`sk-ant-oat*`) use the Bearer method.

#### OpenClaw's OAuth Usage Query Code

```javascript
// OpenClaw internal - Claude usage query
async function fetchClaudeUsage(token, timeoutMs, fetchFn) {
  const res = await fetchJson(
    "https://api.anthropic.com/api/oauth/usage",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "openclaw",
        Accept: "application/json",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20"
      }
    },
    timeoutMs,
    fetchFn
  );
  // ...
}
```

Key discovery! The **`anthropic-beta: oauth-2025-04-20`** header is essential for OAuth authentication.

#### Request Header Composition

Analyzing the SDK's common header building code:

```javascript
// @anthropic-ai/sdk/client.js - request header building
const headers = buildHeaders([
  {
    Accept: 'application/json',
    'User-Agent': this.getUserAgent(),
    'anthropic-dangerous-direct-browser-access': 'true',
    'anthropic-version': '2023-06-01',
  },
  await this.authHeaders(options),       // Bearer token
  this._options.defaultHeaders,          // anthropic-beta etc.
  options.headers,
]);
```

Putting it all together, the required headers are:
1. `Authorization: Bearer {oauth_token}` — Authentication
2. `anthropic-version: 2023-06-01` — API version
3. `anthropic-beta: oauth-2025-04-20` — **OAuth beta flag (required!)**

Plus, a Claude Code system prompt is needed:
- `"You are Claude Code, Anthropic's official CLI for Claude."` — must be in the first system block

### Step 3: Direct API Call with Python

Based on the analysis, here's the minimal implementation with Python `httpx`:

```python
import httpx

# OAuth token (generated via claude setup-token)
OAUTH_TOKEN = "sk-ant-oat01-..."

# Required headers
headers = {
    "Authorization": f"Bearer {OAUTH_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "oauth-2025-04-20",
    "anthropic-dangerous-direct-browser-access": "true",
    "user-agent": "claude-cli/2.1.2 (external, cli)",
    "x-app": "cli",
}

# Request payload
payload = {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "temperature": 0.1,
    "system": [
        {
            "type": "text",
            "text": "You are Claude Code, Anthropic's official CLI for Claude."
        },
        {
            "type": "text",
            "text": "You are a security analysis expert."
        }
    ],
    "messages": [
        {
            "role": "user",
            "content": "Hello, can you hear me?"
        }
    ]
}

# API call
response = httpx.post(
    "https://api.anthropic.com/v1/messages",
    headers=headers,
    json=payload,
    timeout=60
)

print(response.status_code)  # 200 ✅
data = response.json()
print(data["content"][0]["text"])
```

**200 OK!** It works. LLM calls without a separate API key, using subscription-based OAuth tokens.

### Step 4: LangChain Custom ChatModel

Going beyond raw httpx calls, I implemented a LangChain-compatible custom ChatModel. This integrates seamlessly with frameworks like LangGraph.

```python
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field, PrivateAttr
import httpx

CLAUDE_CODE_SYSTEM_PROMPT = (
    "You are Claude Code, Anthropic's official CLI for Claude."
)
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


class ChatAnthropicOAuth(BaseChatModel):
    """Anthropic OAuth token-based LangChain ChatModel"""
    
    auth_token: str = Field(description="OAuth token (sk-ant-oat*)")
    model_name: str = Field(default="claude-sonnet-4-20250514")
    max_tokens: int = Field(default=8192)
    temperature: float = Field(default=0.1)
    timeout: int = Field(default=120)
    
    _client: httpx.Client = PrivateAttr(default=None)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._client = httpx.Client(
            timeout=httpx.Timeout(self.timeout),
            headers={
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
                "anthropic-beta": "oauth-2025-04-20",
                "user-agent": "claude-cli/2.1.2 (external, cli)",
                "x-app": "cli",
            },
        )
    
    def _convert_messages(self, messages: list[BaseMessage]):
        """LangChain messages → Anthropic API format"""
        system_blocks = [
            {"type": "text", "text": CLAUDE_CODE_SYSTEM_PROMPT},
        ]
        api_messages = []
        
        for msg in messages:
            if isinstance(msg, SystemMessage):
                system_blocks.append({"type": "text", "text": msg.content})
            elif isinstance(msg, HumanMessage):
                api_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                api_messages.append({"role": "assistant", "content": msg.content})
        
        return system_blocks, api_messages
    
    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        system_blocks, api_messages = self._convert_messages(messages)
        
        payload = {
            "model": self.model_name,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "system": system_blocks,
            "messages": api_messages,
        }
        
        response = self._client.post(ANTHROPIC_API_URL, json=payload)
        
        if response.status_code != 200:
            raise ValueError(f"API error ({response.status_code}): {response.text}")
        
        data = response.json()
        content = "".join(
            block["text"] for block in data["content"]
            if block["type"] == "text"
        )
        
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=content))],
            llm_output={"token_usage": data.get("usage", {})},
        )
    
    @property
    def _llm_type(self):
        return "anthropic-oauth"
```

#### Usage Example

```python
# Initialize model
model = ChatAnthropicOAuth(
    auth_token="sk-ant-oat01-...",
    model_name="claude-sonnet-4-20250514",
)

# Direct call
from langchain_core.messages import HumanMessage, SystemMessage

response = model.invoke([
    SystemMessage(content="You are a security analysis expert."),
    HumanMessage(content="Explain buffer overflow vulnerabilities."),
])
print(response.content)

# Works in LangGraph chains too
from langgraph.graph import StateGraph
# ... plug the model directly into your chain
```

---

## Result

Successfully calling the Claude API from an external Python project. Summary:

| Item | Details |
|------|---------|
| Token type | OAuth (`sk-ant-oat*`) |
| How to get it | `claude setup-token` command |
| Required headers | `Authorization: Bearer`, `anthropic-beta: oauth-2025-04-20` |
| Required system prompt | `"You are Claude Code, Anthropic's official CLI for Claude."` |
| API endpoint | `https://api.anthropic.com/v1/messages` |
| Cost | Free within subscription limits |

**Key points:**
1. Without the `anthropic-beta: oauth-2025-04-20` header, authentication fails
2. The Claude Code system prompt must be in the first system block
3. Use `Authorization: Bearer` (not `X-Api-Key`)

---

## Wrapping Up

If you're a Claude Code subscriber, you can leverage LLM capabilities in external projects without additional API key costs. Combined with frameworks like LangChain/LangGraph, it's incredibly useful for building automation pipelines.

A few caveats:

- **Token management**: OAuth tokens can expire. Periodic renewal may be necessary
- **Usage limits**: Your subscription plan limits still apply
- **Terms of service**: Check Anthropic's ToS regarding external use of OAuth tokens

This approach was discovered through source code analysis of OpenClaw, so behavior may change with Anthropic's policy updates.

### References

- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages)
- [LangChain Custom Chat Model](https://python.langchain.com/docs/how_to/custom_chat_model/)
- [Claude Code](https://claude.ai/code)
