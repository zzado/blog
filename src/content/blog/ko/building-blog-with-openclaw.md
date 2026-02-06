---
title: 'AI와 함께 만드는 나만의 블로그 - OpenClaw + Astro 제작기'
description: 'OpenClaw와 Claude Opus를 활용해 Astro 블로그를 처음부터 끝까지 구축한 과정을 공유합니다.'
pubDate: '2026-02-06'
heroImage: '/blog-placeholder-1.svg'
tags: ['astro', 'openclaw', 'claude', 'github-pages', 'blog']
category: 'tech'
---

## TL;DR

> 요즘 핫한 AI 에이전트 **OpenClaw**를 직접 써보고 싶어서 맥 미니를 질렀다. 그리고 Claude Opus와 함께 Astro 블로그를 만들어 GitHub Pages에 배포했다. base URL 이슈로 삽질했지만 결국 성공!

---

## 시작: OpenClaw가 뭐길래?

최근 AI 에이전트 도구들이 쏟아지고 있다. 그중에서도 **OpenClaw**는 로컬 환경에서 Claude를 마치 비서처럼 부릴 수 있다는 점이 매력적이었다. 터미널에서 파일을 읽고, 코드를 짜고, 심지어 Git 커밋까지 알아서 해준다고?

직접 써보지 않고는 못 배기는 성격이라, 결국 **맥 미니**를 하나 장만했다.

### 환경 구성

맥 미니 세팅은 간단했다:

```bash
# Node.js 설치 (Homebrew 사용)
brew install node

# OpenClaw 설치
npm install -g openclaw

# 초기 설정
openclaw init
```

Anthropic API 키만 넣어주면 바로 사용 가능. 생각보다 진입장벽이 낮았다.

---

## 기술 스택 고민: Astro vs Next.js

블로그를 만들기로 했으니 프레임워크를 골라야 했다.

| 항목 | Astro | Next.js |
|------|-------|---------|
| **목적** | 콘텐츠 중심 정적 사이트 | 풀스택 웹 앱 |
| **번들 크기** | 거의 0 (필요시만 JS) | 상대적으로 큼 |
| **학습 곡선** | 낮음 | 중간 |
| **SSG 지원** | 네이티브 | 가능하지만 복잡 |
| **마크다운** | 기본 내장 | 추가 설정 필요 |

결론: **블로그는 콘텐츠가 핵심**이다. 복잡한 인터랙션이 필요 없고, 마크다운으로 글만 잘 보여주면 된다. Astro의 **"Zero JS by default"** 철학이 딱이었다.

---

## 개발: Claude Opus와의 협업

OpenClaw를 통해 **Claude 4.5 Opus**에게 블로그 구조 설계부터 컴포넌트 작성까지 맡겼다.

```
나: "다국어 지원되는 Astro 블로그 만들어줘. 한글/영어 토글 가능하게."
Claude: *10분 뒤 완성된 코드 제출*
```

솔직히 놀라웠다. i18n 라우팅 구조, 콘텐츠 스키마, 심지어 다크모드 토글까지. 내가 한 건 "이거 해줘", "저거 고쳐줘" 정도.

물론 AI가 만능은 아니다. 세부적인 디자인 조정이나 예외 케이스 처리는 직접 손봐야 했다. 하지만 **초기 구조를 잡는 속도**는 압도적이었다.

---

## 배포: GitHub Pages를 선택한 이유

배포 옵션은 크게 두 가지였다:

1. **맥 미니 셀프 호스팅** - 내 서버니까 자유도 높음
2. **GitHub Pages** - 무료, 간편, 안정적

Astro는 **정적 사이트 생성기(SSG)**다. 빌드하면 HTML/CSS/JS 파일만 나온다. 이런 정적 파일 호스팅에는 GitHub Pages가 제격이다.

맥 미니는 OpenClaw 돌리는 용도로 쓰고, 블로그는 GitHub Pages에 올리기로 결정.

### GitHub Actions 설정

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 트러블슈팅: Base URL의 함정 🐛

여기서 삽질이 시작됐다.

배포 후 사이트에 접속했더니... **CSS가 깨지고 링크가 다 404**. 뭐지?

### 문제 원인

GitHub Pages는 기본적으로 `https://username.github.io/repo-name/` 형태로 서빙된다. 근데 Astro는 기본적으로 루트(`/`)를 기준으로 경로를 생성한다.

```
예상: /styles/global.css
실제: /blog/styles/global.css ← 여기로 요청해야 함!
```

### 해결 방법

`astro.config.mjs`에 base 경로 추가:

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://zzado.github.io',
  base: '/blog',  // ← 이거 추가!
});
```

이렇게 하면 모든 경로 앞에 `/blog`가 자동으로 붙는다.

**교훈**: 배포 환경의 URL 구조를 미리 파악하자. 로컬에서 잘 되던 게 배포하면 깨지는 건 대부분 경로 문제다.

---

## 결론 및 향후 계획

### 느낀 점

- **OpenClaw + Claude Opus 조합**은 생산성 끝판왕. 특히 보일러플레이트 작성에 강력하다.
- **Astro**는 블로그에 최적화된 프레임워크. 가볍고 빠르다.
- **GitHub Pages**는 정적 사이트 배포의 정석. 무료인 게 믿기지 않는다.

### 앞으로 할 것

1. **커스텀 도메인 적용** - `zzado.kr`을 GitHub Pages에 연결할 예정
2. **OpenClaw 설치 가이드** - 환경 구성 과정을 상세히 포스팅
3. **더 많은 글 작성** - 이 블로그가 썩지 않도록...!

---

## 참고

- [Astro 공식 문서](https://docs.astro.build)
- [OpenClaw GitHub](https://github.com/anthropics/anthropic-quickstarts)
- [GitHub Pages 가이드](https://pages.github.com)
