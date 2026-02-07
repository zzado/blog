---
title: 'OpenClaw 설치 및 디스코드 연동 과정'
description: 'AI 에이전트 OpenClaw를 맥 미니에 설치하고 Discord와 연동하는 전체 과정을 상세히 기록합니다.'
pubDate: '2026-02-07'
heroImage: '/images/blog/gateway-status.png'
tags: ['openclaw', 'discord', 'mac-mini', 'ai-agent', 'setup']
category: 'tech'
---

## TL;DR

> 요즘 핫한 AI 에이전트 **OpenClaw**를 집에서 상시 가동하고 싶어서 맥 미니를 구매했다. 학생 할인 받아서 70만원대에 득템! 설치부터 Discord 연동까지의 전체 과정을 공유한다.

---

## 왜 맥 미니인가?

OpenClaw는 로컬에서 돌아가는 AI 에이전트 게이트웨이다. 24시간 돌려놓고 언제든 메시지로 AI를 부릴 수 있다는 게 매력적이었다.

그래서 서버처럼 쓸 머신이 필요했는데, 고민 끝에 **맥 미니**를 선택했다.

### 선택 이유

- **저전력**: 24시간 돌려도 전기세 부담이 적음
- **macOS**: OpenClaw가 macOS에서 가장 안정적
- **컴팩트**: 책상 한 구석에 놓기 딱 좋은 크기
- **학생 할인**: 교육 스토어에서 약 10% 할인!

### 구매 정보

| 항목 | 내용 |
|------|------|
| 모델 | Mac mini (M4) |
| 가격 | **약 70만원대** (학생 할인 적용) |
| 배송 | 주문 후 **2일** 만에 도착 |

> 💡 학생/교직원이라면 [Apple 교육 스토어](https://www.apple.com/kr-k12/shop)에서 구매하면 할인받을 수 있다!

---

## 1단계: 사전 준비

### AI 모델 구독

OpenClaw를 사용하려면 AI 모델에 접근할 수 있어야 한다. 몇 가지 옵션이 있다:

**1. Claude Pro / Claude Code 구독 (추천)**
- [Claude Pro](https://claude.ai/pro) - 월 $20, 일반 사용자용
- [Claude Code](https://claude.ai/code) - 월 $100, 개발자용 (API 크레딧 포함)

**2. Google AI Pro 구독**
- [Google AI Pro](https://ai.google/) - Gemini 모델 사용 가능

**3. Anthropic API 키 직접 발급**
- [Anthropic Console](https://console.anthropic.com/)에서 API 키 발급
- 사용량에 따라 과금

> 💡 나는 **Google AI Pro**와 **Claude Pro**를 구독해서 사용 중이다. 구독 플랜이 있으면 별도 API 키 없이도 OpenClaw를 바로 사용할 수 있다!

---

## 2단계: OpenClaw 설치

### 설치 스크립트 실행

가장 간단한 방법은 공식 설치 스크립트를 사용하는 것이다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

설치가 완료되면 `openclaw` 명령어를 사용할 수 있다.

```bash
openclaw --version
```

![OpenClaw 버전 확인](/blog/images/blog/openclaw-version.png)

### 온보딩 위자드 실행

처음 설정은 온보딩 위자드가 도와준다.

```bash
openclaw onboard --install-daemon
```

![온보딩 시작 - 보안 경고](/blog/images/blog/onboard-wizard.png)

처음에는 보안 경고가 나온다. AI 에이전트는 강력한 도구이므로 주의해서 사용하라는 안내다. `Yes`를 선택하면 다음 단계로 넘어간다.

![온보딩 설정 화면](/blog/images/blog/onboard-flow.png)

위자드가 물어보는 것들:

1. **Onboarding mode**: QuickStart (빠른 설정) 또는 Advanced (상세 설정)
2. **Config handling**: 기존 설정 사용 / 업데이트 / 리셋
3. **모델 설정**: 사용할 AI 모델 선택 (Claude, Gemini 등)
4. **채널 설정**: 연결할 메시징 앱 선택
5. **데몬 설치**: 시스템 시작 시 자동 실행 여부

### 웹 대시보드 접속

설치가 완료되면 자동으로 웹 대시보드가 열린다!

```bash
openclaw dashboard
```

> 🎉 **여기서부터는 터미널 없이 채팅만으로 세팅 가능!**
> 
> 모델만 제대로 연결되었다면, 웹 대시보드에서 AI와 대화하면서 나머지 설정을 진행할 수 있다. "Discord 연동해줘"라고 말하면 알아서 가이드해준다!

### Gateway 상태 확인

```bash
openclaw gateway status
```

![Gateway 상태 확인](/blog/images/blog/gateway-status.png)

`running`이 보이면 성공! 🎉

---

## 3단계: Discord 봇 생성

### Discord Developer Portal 접속

[Discord Developer Portal](https://discord.com/developers/applications)에 접속한다.


### 새 애플리케이션 생성

1. **New Application** 클릭
2. 앱 이름 입력 (예: "OpenClaw Bot")
3. **Create** 클릭


### Bot 설정

1. 좌측 메뉴에서 **Bot** 클릭
2. **Reset Token** → 토큰 복사 (나중에 필요!)
3. **Privileged Gateway Intents** 섹션에서:
   - ✅ **Message Content Intent** - 필수!
   - ✅ **Server Members Intent** - 권장


> ⚠️ **Message Content Intent**를 활성화하지 않으면 봇이 메시지를 읽을 수 없다!

### OAuth2 URL 생성

1. 좌측 메뉴에서 **OAuth2 → URL Generator** 클릭
2. **Scopes** 선택:
   - ✅ bot
   - ✅ applications.commands
3. **Bot Permissions** 선택:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Add Reactions

4. 하단에 생성된 URL 복사


### 서버에 봇 초대

생성된 URL을 브라우저에 붙여넣고, 봇을 초대할 서버를 선택한다.


---

## 4단계: OpenClaw에 Discord 연동

### 대시보드에서 설정하기

직접 설정 파일을 수정할 필요 없다! 웹 대시보드에서 채팅으로 요청하면 된다.

```
Discord 연동해줘. 봇 토큰은 [YOUR_BOT_TOKEN] 이야.
```

그러면 OpenClaw가 알아서:
1. Discord 채널 활성화
2. 봇 토큰 설정
3. 필요한 권한 설정
4. Gateway 재시작

까지 다 처리해준다! 🎉

### (참고) 수동 설정

혹시 직접 설정하고 싶다면 `~/.openclaw/openclaw.json` 파일을 수정하면 된다:

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

> 💡 대시보드에서 "현재 Discord 설정 보여줘"라고 하면 현재 설정 상태도 확인할 수 있다.

---

## 5단계: 테스트

### DM 테스트

Discord에서 봇에게 DM을 보내면 페어링 코드가 온다.

```
안녕!
```

터미널에서 페어링 승인:

```bash
openclaw pairing approve discord <user_id>
```

승인 후 다시 메시지를 보내면 봇이 응답한다! 🎉


### 서버 채널 테스트

서버 채널에서 봇을 멘션하면 응답한다.

```
@OpenClaw 안녕?
```


---

## 트러블슈팅

### 봇이 응답하지 않을 때

1. **Gateway 상태 확인**
   ```bash
   openclaw gateway status
   ```

2. **로그 확인**
   ```bash
   openclaw gateway logs
   ```

3. **Message Content Intent 확인**
   - Discord Developer Portal에서 활성화했는지 재확인

4. **채널 권한 확인**
   - 봇에게 메시지 읽기/쓰기 권한이 있는지 확인

### "Used disallowed intents" 에러

→ Discord Developer Portal에서 **Message Content Intent**를 활성화하지 않아서 발생. 활성화 후 Gateway 재시작.

---

## 마무리

이제 Discord에서 언제든 AI 에이전트를 부를 수 있다! 🦞

### 다음 단계

- **더 많은 채널 연동**: WhatsApp, Telegram, iMessage 등
- **커스텀 스킬 추가**: 나만의 기능 만들기
- **멀티 에이전트**: 여러 AI 에이전트 운용

### 참고 링크

- [OpenClaw 공식 문서](https://docs.openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

> 💬 질문이나 피드백은 댓글로 남겨주세요!
