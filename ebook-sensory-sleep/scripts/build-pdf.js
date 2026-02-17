const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const puppeteer = require("puppeteer");

// 마크다운 파서 설정
const md = markdownIt({
  html: true,
  breaks: true,
  typographer: true,
});

// 원고 파일 순서
const manuscriptOrder = [
  "00-cover.md",
  "01-toc.md",
  "part1-foundation/chapter01-sleep-problems.md",
  "part1-foundation/chapter02-connection.md",
  "part1-foundation/chapter03-science.md",
  "part1-foundation/part1-summary.md",
  "part2-program/chapter04-preparation.md",
  "part2-program/chapter05-week1.md",
  "part2-program/chapter06-week2.md",
  "part2-program/chapter07-week3.md",
  "part2-program/chapter08-week4.md",
  "part2-program/part2-summary.md",
  "part3-cases/chapter09-case-minjun.md",
  "part3-cases/chapter10-case-seoyeon.md",
  "part3-cases/chapter11-case-jihoon.md",
  "part3-cases/chapter12-expert-tips.md",
  "part3-cases/part3-summary.md",
  "part4-qa/faq.md",
  "part4-qa/emergency.md",
  "appendix/training-log.md",
  "appendix/scent-guide.md",
  "appendix/resources.md",
  "appendix/network.md",
  "99-closing.md",
];

const ROOT_DIR = path.join(__dirname, "..");
const MANUSCRIPT_DIR = path.join(ROOT_DIR, "manuscript");
const STYLES_DIR = path.join(ROOT_DIR, "styles");
const BUILD_DIR = path.join(ROOT_DIR, "build");
const IMAGES_DIR = path.join(ROOT_DIR, "images");

function stripFrontMatter(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
}

function resolveImagePaths(html, currentFileDir) {
  // 상대 이미지 경로를 절대 경로로 변환
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    if (src.startsWith("http") || src.startsWith("data:")) return match;
    const absolutePath = path.resolve(currentFileDir, src);
    // file:// URL로 변환
    const fileUrl = "file:///" + absolutePath.replace(/\\/g, "/");
    return `src="${fileUrl}"`;
  });
}

async function buildPDF() {
  console.log("===========================================");
  console.log("  후각·호흡 수면 훈련 전자책 PDF 빌드");
  console.log("===========================================\n");

  // 빌드 디렉토리 생성
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // CSS 읽기
  const cssPath = path.join(STYLES_DIR, "markdown-styles.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  console.log("✅ CSS 로드 완료\n");

  // PDF 설정 읽기
  const pdfConfig = JSON.parse(
    fs.readFileSync(path.join(STYLES_DIR, "pdf-config.json"), "utf-8")
  );

  // 마크다운 파일 읽기 및 변환
  let allHtml = "";
  let fileCount = 0;

  for (const file of manuscriptOrder) {
    const filePath = path.join(MANUSCRIPT_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일 없음 (건너뜀): ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, "utf-8");
    content = stripFrontMatter(content);

    // 마크다운 → HTML 변환
    let html = md.render(content);

    // 이미지 경로 해결
    const fileDir = path.dirname(filePath);
    html = resolveImagePaths(html, fileDir);

    // 챕터 구분 (페이지 나누기)
    if (fileCount > 0) {
      allHtml += '<div class="page-break"></div>\n';
    }
    allHtml += `<section class="chapter" data-file="${file}">\n${html}\n</section>\n`;
    fileCount++;

    console.log(`📄 변환 완료: ${file}`);
  }

  console.log(`\n✅ ${fileCount}개 파일 변환 완료\n`);

  // 전체 HTML 구성
  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>코로 숨쉬고 꿈꾸는 아이 — 발달장애 아동을 위한 후각·호흡 수면 훈련 프로그램</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

    ${css}

    /* 추가 PDF 전용 스타일 */
    .page-break {
      page-break-before: always;
    }

    section.chapter {
      page-break-before: always;
    }

    section.chapter:first-child {
      page-break-before: avoid;
    }

    /* 체크박스 스타일 */
    input[type="checkbox"] {
      margin-right: 6px;
    }

    /* 블록인용문 내부 강조 */
    blockquote strong {
      display: block;
      margin-bottom: 8px;
      font-size: 11pt;
    }

    /* 블록인용문 기본 스타일 강화 */
    blockquote {
      background-color: #F5F0FA;
      border-left: 4px solid #9B89B3;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
    }

    /* 이미지가 없을 때 alt 텍스트 표시 */
    img {
      max-width: 80%;
      margin: 15px auto;
      display: block;
    }

    img[src*="diagrams"] {
      max-width: 90%;
    }

    /* 표지 스타일 */
    section.chapter[data-file="00-cover.md"] h1 {
      margin-top: 6cm;
      text-align: center;
      font-size: 32pt;
      page-break-before: avoid;
    }

    section.chapter[data-file="00-cover.md"] h2 {
      text-align: center;
      color: #666;
      font-weight: 400;
    }

    section.chapter[data-file="00-cover.md"] p {
      text-align: center;
    }

    /* 목차 스타일 */
    section.chapter[data-file="01-toc.md"] h2 {
      color: #9B89B3;
      border-bottom: 2px solid #A8E6CF;
      padding-bottom: 5px;
    }

    section.chapter[data-file="01-toc.md"] ul {
      list-style: none;
      padding-left: 1em;
    }

    section.chapter[data-file="01-toc.md"] li {
      padding: 3px 0;
    }
  </style>
</head>
<body>
${allHtml}
</body>
</html>`;

  // HTML 저장 (디버깅용)
  const htmlPath = path.join(BUILD_DIR, "ebook.html");
  fs.writeFileSync(htmlPath, fullHtml);
  console.log(`📝 HTML 저장: build/ebook.html\n`);

  // Puppeteer로 PDF 생성
  console.log("🖨️  PDF 생성 중...\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // 로컬 파일 접근 허용
  await page.setContent(fullHtml, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // 이미지 로딩 대기
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
        )
    );
  });

  const pdfPath = path.join(BUILD_DIR, "final-ebook.pdf");

  await page.pdf({
    path: pdfPath,
    format: pdfConfig.format,
    margin: {
      top: pdfConfig.margins.top,
      right: pdfConfig.margins.right,
      bottom: pdfConfig.margins.bottom,
      left: pdfConfig.margins.left,
    },
    displayHeaderFooter: pdfConfig.displayHeaderFooter,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width: 100%; text-align: center; font-size: 10pt; color: #2C3E50;"><span class="pageNumber"></span></div>`,
    printBackground: pdfConfig.printBackground,
    preferCSSPageSize: pdfConfig.preferCSSPageSize,
  });

  await browser.close();

  // 파일 크기 확인
  const stats = fs.statSync(pdfPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  console.log("===========================================");
  console.log(`✅ PDF 생성 완료!`);
  console.log(`📁 경로: build/final-ebook.pdf`);
  console.log(`📏 크기: ${sizeMB} MB`);
  console.log("===========================================");
}

buildPDF().catch((err) => {
  console.error("❌ PDF 빌드 실패:", err.message);
  process.exit(1);
});
