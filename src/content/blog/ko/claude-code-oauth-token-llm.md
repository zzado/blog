---
title: 'Claude Code OAuth 토큰으로 외부 프로젝트에서 LLM API 사용하기'
description: 'Claude Code 구독의 OAuth 토큰을 활용하여 별도 API 비용 없이 Python 프로젝트에서 Anthropic LLM을 호출하는 방법을 정리합니다.'
pubDate: '2026-02-12'
heroImage: '/images/blog/openclaw-claude-oauth-hero.png'
tags: ['claude', 'oauth', 'anthropic', 'python', 'langchain', 'llm']
category: 'tech'
---

## TL;DR

> Claude Code/Pro를 구독하고 있다면, **OAuth 토큰**을 추출해서 외부 Python 프로젝트에서 별도 API 비용 없이 LLM을 호출할 수 있다. 핵심은 `anthropic-beta` 헤더와 Claude Code 시스템 프롬프트. OpenClaw의 내부 모듈을 분석해서 인증 방식을 알아냈다.

---

## 배경

외부 Python 프로젝트에서 Claude API를 사용해야 하는 상황이 생겼다. 문제는 Anthropic API 키를 별도로 발급받으면 사용량 기반 과금이 발생한다는 것. 이미 Claude Code를 구독하고 있는데 추가 비용을 내기는 아까웠다.

그래서 생각한 것이 — Claude Code 구독에서 받은 **OAuth 토큰**을 직접 Anthropic API에 쏘면 되지 않을까?

결론부터 말하면, **된다.** 다만 몇 가지 핵심 인증 요소를 정확히 맞춰야 한다.

---

## 과정

### 1단계: OAuth 토큰이란?

Claude Code를 설치하면 `claude setup-token` 명령어로 인증 토큰을 생성할 수 있다:

```bash
claude setup-token
```

이 명령어를 실행하면 **OAuth 토큰**이 생성된다. 이 토큰은 `sk-ant-oat`로 시작하는 문자열이며, Anthropic API에 대한 인증 수단으로 사용된다.

```bash
# 토큰 형태 예시
sk-ant-oat01-XXXXXXXXXXXXXXXXXXXX...
```

일반 Anthropic API 키(`sk-ant-api`)와는 다르다. OAuth 토큰은 **구독 기반 인증**으로, 별도 과금 없이 구독 범위 내에서 API를 호출할 수 있다.

### 2단계: OpenClaw pi-ai 모듈 분석

OAuth 토큰만 가지고는 바로 API를 호출할 수 없다. 일반적인 방식으로 요청을 보내면 인증 에러가 발생한다.

어떤 헤더와 설정이 필요한지 알아내기 위해, OpenClaw 내부의 pi-ai 모듈을 분석했다. OpenClaw은 Node.js 기반이고, `@anthropic-ai/sdk`를 사용하여 Anthropic API를 호출한다.

#### Anthropic SDK 클라이언트 분석

```javascript
// @anthropic-ai/sdk/client.js
constructor({
  apiKey = readEnv('ANTHROPIC_API_KEY') ?? null,
  authToken = readEnv('ANTHROPIC_AUTH_TOKEN') ?? null,
  ...opts
} = {}) { ... }

// 인증 헤더 빌드
async authHeaders(opts) {
  return buildHeaders([
    await this.apiKeyAuth(opts),   // X-Api-Key 방식
    await this.bearerAuth(opts)    // Bearer 토큰 방식
  ]);
}

// API 키 인증 → X-Api-Key 헤더
async apiKeyAuth(opts) {
  return buildHeaders([{ 'X-Api-Key': this.apiKey }]);
}

// Bearer 토큰 인증 → Authorization 헤더 (OAuth 토큰용)
async bearerAuth(opts) {
  return buildHeaders([
    { Authorization: `Bearer ${this.authToken}` }
  ]);
}
```

SDK는 두 가지 인증 방식을 지원한다:
- **API 키 방식**: `X-Api-Key` 헤더 (일반 API 키)
- **Bearer 토큰 방식**: `Authorization: Bearer` 헤더 (OAuth 토큰)

OAuth 토큰(`sk-ant-oat*`)은 Bearer 방식으로 전송된다.

#### OpenClaw의 OAuth 사용량 조회 코드

```javascript
// OpenClaw 내부 - Claude 사용량 조회
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

여기서 핵심 발견! **`anthropic-beta: oauth-2025-04-20`** 헤더가 OAuth 인증에 필수적이다.

#### 요청 헤더 구성

SDK의 공통 헤더 빌드 코드를 분석하면:

```javascript
// @anthropic-ai/sdk/client.js - 요청 헤더 빌드
const headers = buildHeaders([
  {
    Accept: 'application/json',
    'User-Agent': this.getUserAgent(),
    'anthropic-dangerous-direct-browser-access': 'true',
    'anthropic-version': '2023-06-01',
  },
  await this.authHeaders(options),       // Bearer 토큰
  this._options.defaultHeaders,          // anthropic-beta 등
  options.headers,
]);
```

종합하면 필수 헤더는:
1. `Authorization: Bearer {oauth_token}` — 인증
2. `anthropic-version: 2023-06-01` — API 버전
3. `anthropic-beta: oauth-2025-04-20` — **OAuth 베타 플래그 (필수!)**

그리고 추가로 Claude Code 인증을 위한 시스템 프롬프트가 필요하다:
- `"You are Claude Code, Anthropic's official CLI for Claude."` — 첫 번째 system 블록에 포함

### 3단계: Python으로 직접 API 호출

분석 결과를 바탕으로 Python `httpx`로 최소 구현을 만들었다:

```python
import httpx
import json

# OAuth 토큰 (claude setup-token으로 생성)
OAUTH_TOKEN = "sk-ant-oat01-..."

# 필수 헤더
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

# 요청 페이로드
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
            "text": "당신은 보안 분석 전문가입니다."
        }
    ],
    "messages": [
        {
            "role": "user",
            "content": "Hello, can you hear me?"
        }
    ]
}

# API 호출
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

**200 OK!** 성공이다. 별도 API 키 없이, 구독 기반 OAuth 토큰으로 LLM 호출이 가능하다.

### 4단계: LangChain 커스텀 ChatModel 구현

단순 httpx 호출을 넘어서, LangChain과 호환되는 커스텀 ChatModel을 구현했다. 이렇게 하면 LangGraph 같은 프레임워크와 자연스럽게 통합할 수 있다.

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
    """Anthropic OAuth 토큰 기반 LangChain ChatModel"""
    
    auth_token: str = Field(description="OAuth 토큰 (sk-ant-oat*)")
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
        """LangChain 메시지 → Anthropic API 형식"""
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
            raise ValueError(f"API 오류 ({response.status_code}): {response.text}")
        
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

#### 사용 예시

```python
# 모델 초기화
model = ChatAnthropicOAuth(
    auth_token="sk-ant-oat01-...",
    model_name="claude-sonnet-4-20250514",
)

# 단독 호출
from langchain_core.messages import HumanMessage, SystemMessage

response = model.invoke([
    SystemMessage(content="당신은 보안 분석 전문가입니다."),
    HumanMessage(content="버퍼 오버플로우 취약점에 대해 설명해주세요."),
])
print(response.content)

# LangGraph 체인에서 사용
from langgraph.graph import StateGraph
# ... model을 그대로 체인에 연결 가능
```

---

## 결과

외부 Python 프로젝트에서 Claude API를 성공적으로 호출할 수 있게 되었다. 정리하면:

| 항목 | 내용 |
|------|------|
| 토큰 종류 | OAuth (`sk-ant-oat*`) |
| 획득 방법 | `claude setup-token` 명령어 |
| 필수 헤더 | `Authorization: Bearer`, `anthropic-beta: oauth-2025-04-20` |
| 필수 시스템 프롬프트 | `"You are Claude Code, Anthropic's official CLI for Claude."` |
| API 엔드포인트 | `https://api.anthropic.com/v1/messages` |
| 비용 | 구독 범위 내 무료 |

**핵심 포인트:**
1. `anthropic-beta: oauth-2025-04-20` 헤더가 없으면 인증 실패
2. Claude Code 시스템 프롬프트가 첫 번째 system 블록에 있어야 함
3. `Authorization: Bearer` 방식으로 토큰 전송 (X-Api-Key가 아님)

---

## 마무리

Claude Code 구독자라면 별도 API 키 발급 없이도 외부 프로젝트에서 LLM을 활용할 수 있다. 특히 LangChain/LangGraph 같은 프레임워크와 결합하면 자동화 파이프라인을 구축하는 데 매우 유용하다.

다만 몇 가지 주의할 점이 있다:

- **토큰 관리**: OAuth 토큰은 만료될 수 있다. 주기적으로 갱신이 필요할 수 있다
- **사용량 제한**: 구독 플랜의 사용량 한도가 적용된다
- **약관 확인**: Anthropic의 이용 약관에서 OAuth 토큰의 외부 사용에 대한 정책을 확인하자

이 방식은 OpenClaw 소스 코드를 분석하며 알아낸 것이므로, Anthropic 측의 정책 변경에 따라 동작이 달라질 수 있다.

### 참고 링크

- [Anthropic API 문서](https://docs.anthropic.com/en/api/messages)
- [LangChain Custom Chat Model](https://python.langchain.com/docs/how_to/custom_chat_model/)
- [Claude Code](https://claude.ai/code)
