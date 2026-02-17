# 바이브 코딩으로 1인 사업가 되기

> 코딩 몰라도 괜찮아요, AI가 함께 합니다

## 프로젝트 소개

AI 기반 바이브 코딩을 활용하여 비개발자도 1인 사업가로 성장할 수 있는 방법을 안내하는 전자책 프로젝트입니다. Markdown으로 원고를 작성하고 PDF로 변환합니다.

## 구조

```
vibe-coding-ebook/
├── manuscript/          # 원고 (Markdown)
│   ├── 00-front-matter/ # 표지, 저자 소개, 프롤로그
│   ├── part1-intro/     # Part 1: 바이브 코딩 소개
│   ├── part2-start/     # Part 2: 시작하기
│   ├── part3-projects/  # Part 3: 프로젝트 실전
│   ├── part4-monetize/  # Part 4: 수익화
│   ├── part5-sustain/   # Part 5: 지속 성장
│   └── 99-back-matter/  # 에필로그, 부록
├── images/              # 이미지 리소스
├── styles/              # CSS 스타일 (ebook, PDF)
├── scripts/             # 빌드 스크립트
├── output/              # PDF 출력물
└── config.json          # 책 설정 (폰트, 색상, API 등)
```

## 설치

```bash
cd vibe-coding-ebook
npm install
```

## 사용 방법

```bash
# 이미지 생성 (Gemini API)
npm run generate-images

# PDF 빌드
npm run build

# 이미지 생성 + PDF 빌드 한번에
npm run dev
```

## 기술 스택

- **원고 작성**: Markdown
- **PDF 변환**: Puppeteer + markdown-it
- **이미지 생성**: Google Gemini API
- **스타일링**: CSS (ebook.css, pdf-styles.css)
