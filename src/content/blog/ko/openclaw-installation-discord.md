---
title: 'OpenClaw 사용기(1) - 설치 및 Discord 연동'
description: 'AI 에이전트 플랫폼 OpenClaw를 맥 미니에 설치하고, 온보딩 위자드를 통해 Discord 봇과 연동하는 전체 과정을 공유합니다.'
pubDate: '2026-02-08'
heroImage: '/images/blog/onboard-wizard.png'
tags: ['openclaw', 'discord', 'mac-mini', 'ai-agent', 'setup']
category: 'tech'
---

## TL;DR

> 로컬에서 돌아가는 AI 에이전트 플랫폼 **OpenClaw**를 맥 미니에 설치하고, Discord 봇을 연동해서 언제 어디서든 AI를 부릴 수 있는 환경을 구축했다. 온보딩 위자드 덕분에 생각보다 쉬웠다!

---

## 배경

AI를 단순히 웹에서 채팅하는 수준이 아니라, **내 메신저에서 바로 불러서 쓰고 싶다**는 생각이 있었다. 파일도 읽고, 코드도 짜고, Git 커밋까지 알아서 해주는 AI 비서? 그게 바로 [OpenClaw](https://docs.openclaw.ai/)다.

OpenClaw는 자체 호스팅 게이트웨이로, WhatsApp·Telegram·Discord·iMessage 같은 메시징 앱을 AI 에이전트와 연결해준다. 내 머신에서 돌아가니까 데이터도 내 손에 있고, 커스터마이징도 자유롭다.

24시간 돌릴 머신이 필요해서 **맥 미니** (M4)를 장만했고, 학생 할인 받아서 70만원대에 득템! 저전력이라 전기세 걱정 없고, macOS에서 OpenClaw가 가장 안정적이라 딱이었다.

---

## 과정

### 1단계: 사전 준비

OpenClaw를 사용하려면 두 가지가 필요하다:

- **Node.js 22 이상**
- **AI 모델 접근 권한** (Anthropic API 키 또는 Claude 구독)

```bash
node --version
# v22.x.x 이상이면 OK
```

![Node.js 버전 확인](/blog/images/blog/node-version.png)

AI 모델은 몇 가지 옵션이 있다:

- **[Claude Code](https://claude.ai/code)** — 월 $100, 개발자용 (API 크레딧 포함, 추천)
- **[Claude Pro](https://claude.ai/pro)** — 월 $20, 일반 사용자용
- **[Anthropic API](https://console.anthropic.com/)** — 사용량 기반 과금

### 2단계: OpenClaw 설치

공식 설치 스크립트 한 줄이면 끝이다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

설치 완료 후 버전 확인:

```bash
openclaw --version
```

![OpenClaw 버전 확인](/blog/images/blog/openclaw-version.png)

### 3단계: 온보딩 위자드

여기가 핵심이다. `openclaw onboard` 명령어 하나로 모든 초기 설정을 대화형으로 진행할 수 있다.

```bash
openclaw onboard --install-daemon
```

![온보딩 위자드 시작](/blog/images/blog/onboard-wizard.png)

실행하면 먼저 **보안 경고**가 나온다. AI 에이전트는 파일을 읽고 명령을 실행할 수 있는 강력한 도구이므로, 보안에 주의하라는 안내다. 납득되면 `Yes`를 선택.

이어서 위자드가 순서대로 물어본다:

#### 온보딩 모드 선택

```bash
# 온보딩 모드 선택
◇ Onboarding mode
→ QuickStart          # 처음이라면 이걸 추천!

# QuickStart 기본 설정 요약
┌ QuickStart ─────────────────────────╮
│                                      │
│  Gateway port:  18789                │
│  Gateway bind:  Loopback (127.0.0.1) │
│  Gateway auth:  Token (default)      │
│  Tailscale:     Off                  │
│  Direct to chat channels.            │
│                                      │
└──────────────────────────────────────╯
```

Gateway는 로컬(127.0.0.1)에서 18789 포트로 실행된다. 외부 노출 없이 안전하게 시작하는 설정이다.

#### AI 모델 설정

```bash
# AI 모델 프로바이더 선택
◇ Model/auth provider
→ Anthropic

# 인증 방식 선택
◇ Anthropic auth method
→ Anthropic token (paste setup-token)

# setup-token 생성 후 붙여넣기
◇ Paste Anthropic setup-token
→ ****************************************
```

Anthropic을 선택하고, `claude setup-token` 명령어로 생성한 토큰을 붙여넣으면 된다. 나는 **Claude Opus 4**를 기본 모델로 사용하고 있다.

#### 채널 선택 — Discord!

```bash
# 연결할 채널 선택
◇ Select channel (QuickStart)
→ Discord (Bot API)
```

![온보딩 채널 설정](/blog/images/blog/onboard-flow.png)

연결할 채널로 **Discord**를 선택한다. 위자드에서 Discord 봇 토큰 입력까지 한 번에 할 수 있다.

### 4단계: Discord 봇 생성

Discord 봇은 [Discord Developer Portal](https://discord.com/developers/applications)에서 만든다.

**봇 생성 순서:**

1. **New Application** → 앱 이름 입력 (예: "OpenClaw Bot") → **Create**
2. 좌측 **Bot** 메뉴 → **Reset Token** → 토큰 복사
3. **Privileged Gateway Intents** 에서:
   - ✅ **Message Content Intent** — **필수!** 이거 안 켜면 메시지를 못 읽는다
   - ✅ **Server Members Intent** — 권장 (사용자 이름 조회에 필요)
4. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `View Channels`, `Send Messages`, `Read Message History`, `Embed Links`, `Attach Files`, `Add Reactions`
5. 생성된 URL로 봇을 서버에 초대

> ⚠️ **Message Content Intent**를 빠뜨리면 `Used disallowed intents` 에러가 발생한다. 꼭 활성화하자!

### 5단계: OpenClaw에 Discord 연동

온보딩 위자드에서 바로 봇 토큰을 입력하면 자동으로 설정된다:

```bash
# Discord 봇 토큰 입력
◇ Enter Discord bot token
→ ****************************************

# 채널 접근 설정
◇ Configure Discord channels access?
→ Yes

# 접근 방식 선택
◇ Discord channels access
→ Allowlist (recommended)

# 허용할 채널 목록 입력
◇ Discord channels allowlist (comma-separated)
→ Server/#Channel1, Server/#Channel2

# 채널 확인
┌ Discord channels ────────────────────────────╮
│                                               │
│  Resolved channels: #channel1, #channel2      │
│                                               │
└───────────────────────────────────────────────╯
```

**Allowlist** 모드를 추천한다. 봇이 응답할 채널을 명시적으로 지정해서 불필요한 응답을 방지할 수 있다.

설정이 끝나면 위자드가 Gateway 서비스를 자동으로 설치하고 시작해준다:

```bash
# Gateway 서비스 설치
◓ Installing Gateway service…..
✓ Installed LaunchAgent: ~/Library/LaunchAgents/ai.openclaw.gateway.plist

# 상태 확인
◇ Discord: ok (@클로) (794ms)
  Agents: main (default)
  Heartbeat interval: 1h (main)
```

macOS에서는 **LaunchAgent**로 등록되어 시스템 시작 시 자동 실행된다!

### 6단계: 확인 및 테스트

Gateway 상태 확인:

```bash
openclaw gateway status
```

![Gateway 상태 확인](/blog/images/blog/gateway-status.png)

`running`이 보이면 성공! 🎉

웹 대시보드도 열어보자:

```bash
openclaw dashboard
```

브라우저에서 `http://127.0.0.1:18789/` 로 접속하면 Control UI가 열린다. 여기서 바로 AI와 채팅할 수 있다.

이제 Discord에서 봇을 멘션해보자:

```
@OpenClaw 안녕?
```

봇이 응답하면 연동 완료! DM으로도 대화할 수 있는데, 처음에는 **페어링 인증**이 필요하다:

```bash
openclaw pairing approve discord <코드>
```

---

## 결과

맥 미니 위에 OpenClaw가 24시간 돌아가고 있고, Discord에서 언제든 AI를 불러서 쓸 수 있게 되었다. 파일 읽기, 코드 작성, Git 커밋, 웹 검색... 메신저에서 다 된다.

특히 인상적인 건 **온보딩 위자드**의 완성도다. 터미널에서 몇 가지 선택만 하면 보안 설정, 모델 연결, 채널 연동, 서비스 등록까지 한 번에 끝난다. 직접 JSON 설정 파일을 만질 필요가 거의 없었다.

---

## 마무리

OpenClaw는 "내 손 안의 AI 비서"를 현실로 만들어주는 도구다. 자체 호스팅이라 데이터 주권도 지킬 수 있고, 오픈소스(MIT)라 마음대로 커스터마이징할 수 있다.

다음 편에서는 OpenClaw로 **이 블로그 자체를 만든 과정**을 공유할 예정이다. AI와 페어 프로그래밍으로 Astro 블로그를 처음부터 끝까지 구축한 이야기!

### 참고 링크

- [OpenClaw 공식 문서](https://docs.openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [OpenClaw Discord 커뮤니티](https://discord.com/invite/clawd)
