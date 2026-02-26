# 괜찮아, 엄마도 아프니까

**발달지연 아동 부모를 위한 내면 치유 가이드**

저자: **피지오 아카데미**

---

## 프로젝트 소개

발달지연(발달장애 포함) 아동의 부모와 양육자를 위한 내면 치유 전자책입니다.
죄책감, 비교, 번아웃 등 양육 과정에서 겪는 심리적 어려움을 다루며,
셀프 컴패션, 인지 재구성, 감정 관리법 등 실용적인 셀프케어 방법을 안내합니다.

- **4개 Part, 7개 Chapter** + 프롤로그/에필로그 + 부록 4종
- 풍부한 워크시트와 셀프 체크리스트
- Gemini API 생성 카와이 일러스트
- A4 PDF 자동 빌드

---

## 폴더 구조

```
ebook-healing-parent/
├── content/                        # 원고 마크다운
│   ├── 00-frontmatter/
│   │   ├── frontmatter.md          # 속표지 + 목차
│   │   └── colophon.md             # 판권
│   ├── 01-prologue/
│   │   └── prologue.md             # 프롤로그
│   ├── 02-part1/                   # Part 1. 마음의 지도 그리기
│   │   ├── chapter01.md            # Ch.1 감정 인식
│   │   ├── chapter02.md            # Ch.2 애도와 수용
│   │   └── part1-summary.md
│   ├── 03-part2/                   # Part 2. 마음의 짐 내려놓기
│   │   ├── chapter03.md            # Ch.3 비교 탈출
│   │   ├── chapter04.md            # Ch.4 죄책감 내려놓기
│   │   └── part2-summary.md
│   ├── 04-part3/                   # Part 3. 마음의 근육 키우기
│   │   ├── chapter05.md            # Ch.5 감정 관리법
│   │   ├── chapter06.md            # Ch.6 지지 체계
│   │   └── part3-summary.md
│   ├── 05-part4/                   # Part 4. 함께 피어나기
│   │   ├── chapter07.md            # Ch.7 함께 성장
│   │   └── part4-summary.md
│   ├── 06-epilogue/
│   │   └── epilogue.md             # 에필로그
│   └── 07-appendix/
│       ├── appendix-a-emotion-diary.md   # 감정 일기 템플릿
│       ├── appendix-b-checklists.md      # 셀프 체크리스트 모음
│       ├── appendix-c-resources.md       # 추천 도서·기관·커뮤니티
│       └── appendix-d-references.md      # 참고 문헌
├── images/
│   ├── cover/                      # 표지 이미지
│   ├── chapters/                   # 챕터 일러스트
│   └── icons/                      # 아이콘
├── styles/
│   └── ebook-style.css             # PDF 변환용 CSS
├── scripts/
│   ├── generate-images.js          # Gemini API 이미지 생성
│   ├── merge-content.js            # 마크다운 병합
│   ├── build-pdf.sh                # PDF 빌드
│   └── build-all.sh                # 전체 빌드 파이프라인
├── output/                         # 빌드 산출물
│   ├── complete-ebook.md           # 병합된 마크다운
│   ├── ebook.html                  # 중간 HTML
│   └── final.pdf                   # 최종 PDF
├── package.json
├── PRD.md
└── README.md
```

---

## 사전 요구사항

| 도구 | 최소 버전 | 설치 방법 |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **Pandoc** | 3.0+ | `winget install JohnMacFarlane.Pandoc` / `brew install pandoc` |
| **WeasyPrint** | 60+ | `pip install weasyprint` |
| **Pretendard 폰트** | — | [pretendard.github.io](https://cactus.tistory.com/306) 에서 설치 |

> Pretendard 폰트 미설치 시 Noto Sans KR로 폴백됩니다.

---

## 설치 및 빌드

### 전체 빌드 (이미지 생성 → 병합 → PDF)

```bash
cd ebook-healing-parent
npm run build
```

### 단계별 실행

```bash
# 1. 이미지 생성 (Gemini API)
npm run images

# 2. 마크다운 병합
npm run merge

# 3. PDF 빌드
npm run pdf
```

---

## 단계별 상세

### Step 1: 이미지 생성

```bash
npm run images
```

- Google Gemini 2.0 Flash Exp API로 9장의 카와이 일러스트 생성
- 이미 존재하는 이미지는 건너뜀
- 결과: `images/cover/`, `images/chapters/` 에 저장

### Step 2: 콘텐츠 병합

```bash
npm run merge
```

- 19개 마크다운 파일을 정해진 순서로 병합
- 이미지 경로 자동 변환
- 결과: `output/complete-ebook.md`

### Step 3: PDF 빌드

```bash
npm run pdf
```

- Pandoc으로 마크다운 → HTML 변환 (TOC 자동 생성)
- WeasyPrint로 HTML → PDF 변환
- 결과: `output/final.pdf`

---

## 커스터마이징

### 컬러 변경

`styles/ebook-style.css`의 `:root` 섹션에서 CSS 커스텀 프로퍼티 수정:

```css
:root {
  --c-main: #F4A7A3;     /* 메인 컬러 (소프트 코랄) */
  --c-sub1: #C5B9E8;     /* 서브1 (라벤더) */
  --c-sub2: #A8D8C8;     /* 서브2 (민트) */
  --c-bg: #FFF8F0;       /* 배경 (웜 크림) */
  --c-text: #3D3D3D;     /* 텍스트 (다크 차콜) */
  --c-accent: #F5C542;   /* 강조 (머스타드) */
}
```

### 폰트 변경

같은 파일의 `--font-main` 수정:

```css
:root {
  --font-main: 'Your Font', sans-serif;
}
```

### 페이지 설정

`@page` 규칙에서 마진, 페이지 크기 조정:

```css
@page {
  size: A4;
  margin: 25mm 20mm;
}
```

### 이미지 프롬프트 수정

`scripts/generate-images.js`의 `IMAGES` 배열과 `STYLE_SUFFIX` 수정 후 `npm run images` 재실행.

---

## 라이선스

© 피지오 아카데미. All rights reserved.

이 전자책의 저작권은 피지오 아카데미에 있습니다.
무단 전재 및 복제를 금합니다.
