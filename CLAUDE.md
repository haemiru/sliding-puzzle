# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Multi-project repository containing independent web games/apps:

- **Sliding-Puzzle/** — React 19 + Vite 7 + Tailwind CSS v4 image puzzle game (primary active project)
- **squid-game-mugunghwa/** — Vanilla JS canvas-based Red Light Green Light game (single HTML file)
- **vibe-coding-ebook/** — "바이브 코딩으로 1인 사업가 되기" 전자책 (Markdown → PDF)
- **ebook-sensory-sleep/** — "코로 숨쉬고 꿈꾸는 아이" 발달장애 아동 후각·호흡 수면 훈련 전자책 (Markdown → PDF)

Root-level `app.json` and `eas.json` are legacy Expo/EAS Build configs (not actively used by current projects).

## Sliding-Puzzle Commands

All commands run from `Sliding-Puzzle/` directory:

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No test runner, linter, or formatter is configured.

## Sliding-Puzzle Architecture

- **React 19** with all game state centralized in `App.jsx` (no context, no state library)
- **Tile model**: `{ id, currentPosition, correctPosition }` where `id: 0` = empty space
- **Image pipeline**: Gemini 2.0 Flash API (`services/geminiApi.js`) generates dog images as base64 → tiles use CSS `background-position` to show slices
- **Shuffle**: 200-300 random valid moves from solved state (guarantees solvability)
- **Performance**: all child components use `React.memo()`, handlers use `useCallback()`
- **Tailwind v4**: uses `@tailwindcss/vite` plugin (no config file), custom animations via `@utility` directives in `index.css`
- **Deployment**: Netlify SPA routing via `public/_redirects`

## Sliding-Puzzle UI Language

The UI is in **Korean**. Button labels, modal text, and game messages use Korean strings.

## vibe-coding-ebook — 전자책 프로젝트

**"바이브 코딩으로 1인 사업가 되기"** — AI 바이브 코딩으로 비개발자가 1인 사업가로 성장하는 방법을 안내하는 전자책.

### 명령어

`vibe-coding-ebook/` 디렉토리에서 실행:

```bash
npm install                              # 의존성 설치
npm run generate-images                   # Gemini API로 챕터 이미지 생성 (기존 건너뜀)
npm run generate-images:force             # 모든 이미지 강제 재생성
node scripts/generate-images.js --chapter 1  # 특정 챕터만 생성
npm run build                             # PDF 빌드 → output/
node scripts/build-pdf.js --preview-only  # 미리보기 PDF만 생성
npm run dev                               # 이미지 생성 + PDF 빌드 한번에
```

### 구조

- `manuscript/` — 원고 Markdown 파일 (5개 파트, 17개 챕터)
  - `00-front-matter/` — 표지, 저자 소개, 프롤로그
  - `part1-intro/` ~ `part5-sustain/` — 본문 챕터 + 파트별 실습
  - `99-back-matter/` — 에필로그, 부록
- `images/` — chapters, screenshots, diagrams 하위 폴더
- `styles/` — ebook.css, pdf-styles.css
- `scripts/` — generate-images.js, build-pdf.js
- `output/` — 생성된 PDF
- `config.json` — 책 메타데이터, 폰트(나눔명조), 색상, Gemini API 설정

### 빌드 파이프라인

1. `generate-images.js` — Gemini `gemini-2.5-flash-image` API로 챕터 이미지 생성 (base64 → PNG)
2. `build-pdf.js` — markdown-it으로 HTML 변환 → ebook.css + pdf-styles.css 적용 → Puppeteer로 A4 PDF 생성
3. 출력물: `output/vibe-coding-ebook.pdf` (전체) + `output/vibe-coding-ebook-preview.pdf` (30페이지)

### 작성 규칙

- **언어**: 한국어, 5060 세대 대상 (문장 20~25자, 짧은 단락, 전문 용어에 쉬운 설명)
- **폰트**: 나눔명조 12pt, 줄간격 1.8, 제목은 나눔고딕 Bold
- **색상**: primary `#2C5F8D`, secondary `#FF9933`, accent `#E74C3C`
- **코드 블록**: 언어 태그 필수
- **이미지 참조**: `![설명](../../images/chapters/filename.png)`
- **정보 박스**: `<div class="box-tip">`, `<div class="box-warning">`, `<div class="box-key">`, `<div class="box-practice">`
- **페이지 설정**: A4, 여백 2.5cm (안쪽 3cm 양면 인쇄)
