---
title: 'Building an Astro Blog (feat. OpenClaw)'
description: 'A complete walkthrough of building an Astro blog from scratch using OpenClaw and Claude Opus.'
pubDate: '2026-02-06'
heroImage: '/images/astro-openclaw-hero.png'
tags: ['astro', 'openclaw', 'claude', 'github-pages', 'blog']
category: 'tech'
---

## TL;DR

> I wanted to try the trending AI agent **OpenClaw**, so I bought a Mac mini. Then I built an Astro blog with Claude Opus and deployed it to GitHub Pages. Hit some base URL issues along the way, but got it working!

---

## The Beginning: What's OpenClaw?

AI agent tools are popping up everywhere these days. What caught my attention about **OpenClaw** was the ability to use Claude as a local assistant. It can read files, write code, and even handle Git commits automatically.

I'm the type who can't resist trying things firsthand, so I ended up getting a **Mac mini**.

### Environment Setup

Setting up the Mac mini was straightforward:

```bash
# Install Node.js (using Homebrew)
brew install node

# Install OpenClaw
npm install -g openclaw

# Initial setup
openclaw init
```

Just add your Anthropic API key and you're good to go. The barrier to entry was lower than expected.

---

## Tech Stack Decision: Astro vs Next.js

Now that I decided to build a blog, I needed to pick a framework.

| Aspect | Astro | Next.js |
|--------|-------|---------|
| **Purpose** | Content-focused static sites | Full-stack web apps |
| **Bundle Size** | Nearly 0 (JS only when needed) | Relatively larger |
| **Learning Curve** | Low | Medium |
| **SSG Support** | Native | Possible but complex |
| **Markdown** | Built-in | Requires setup |

Conclusion: **Content is king for blogs**. No complex interactions needed—just show markdown nicely. Astro's **"Zero JS by default"** philosophy was perfect.

---

## Development: Collaborating with Claude Opus

Through OpenClaw, I had **Claude 4.5 Opus** handle everything from blog structure design to component creation.

```
Me: "Build a multilingual Astro blog. Make Korean/English toggleable."
Claude: *Delivers complete code 10 minutes later*
```

Honestly, I was impressed. i18n routing structure, content schema, even dark mode toggle. All I did was "do this", "fix that".

Of course, AI isn't omnipotent. Fine-tuning designs and handling edge cases required manual work. But the **speed of initial scaffolding** was overwhelming.

---

## Deployment: Why GitHub Pages?

I had two main options:

1. **Self-hosting on Mac mini** - Full control since it's my server
2. **GitHub Pages** - Free, simple, stable

Astro is a **Static Site Generator (SSG)**. Build it and you get just HTML/CSS/JS files. GitHub Pages is perfect for hosting static files like these.

I decided to use the Mac mini for running OpenClaw, and host the blog on GitHub Pages.

### GitHub Actions Setup

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

## Troubleshooting: The Base URL Trap 🐛

This is where the struggle began.

After deployment, I visited the site and... **CSS was broken and all links returned 404**. What?

### Root Cause

GitHub Pages serves content at `https://username.github.io/repo-name/` by default. But Astro generates paths based on root (`/`).

```
Expected: /styles/global.css
Actual: /blog/styles/global.css ← This is where the request should go!
```

### Solution

Add the base path in `astro.config.mjs`:

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://zzado.github.io',
  base: '/blog',  // ← Add this!
});
```

This automatically prepends `/blog` to all paths.

**Lesson learned**: Understand your deployment environment's URL structure beforehand. Things that work locally breaking after deployment are usually path issues.

---

## Conclusion & Future Plans

### Takeaways

- **OpenClaw + Claude Opus combo** is a productivity beast. Especially powerful for boilerplate generation.
- **Astro** is optimized for blogs. Lightweight and fast.
- **GitHub Pages** is the gold standard for static hosting. Hard to believe it's free.

### What's Next

1. **Custom domain setup** - Planning to connect `zzado.kr` to GitHub Pages
2. **OpenClaw installation guide** - Will post a detailed environment setup walkthrough
3. **More content** - Making sure this blog doesn't collect dust!

---

## References

- [Astro Documentation](https://docs.astro.build)
- [OpenClaw GitHub](https://github.com/anthropics/anthropic-quickstarts)
- [GitHub Pages Guide](https://pages.github.com)
