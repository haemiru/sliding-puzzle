/**
 * build-pdf.js
 *
 * 마크다운 원고를 PDF 전자책으로 변환하는 빌드 스크립트
 *
 * 빌드 프로세스:
 *   1. config.json + 마크다운 파일 수집
 *   2. markdown-it으로 HTML 변환
 *   3. CSS 스타일 적용
 *   4. 목차(TOC) 자동 생성
 *   5. Puppeteer로 PDF 생성 (전체 + 미리보기)
 *
 * 사용법:
 *   npm run build
 *   node scripts/build-pdf.js
 *   node scripts/build-pdf.js --preview-only   # 미리보기만 생성
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

// __dirname 대체 (ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 경로 설정
// ============================================================
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config.json");
const MANUSCRIPT_DIR = path.join(PROJECT_ROOT, "manuscript");
const STYLES_DIR = path.join(PROJECT_ROOT, "styles");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");
const IMAGES_DIR = path.join(PROJECT_ROOT, "images");

// 미리보기 페이지 수
const PREVIEW_PAGES = 30;

// ============================================================
// 원고 파일 순서 정의
// ============================================================
const MANUSCRIPT_ORDER = [
  // ── 앞부분 ──
  "00-front-matter/cover.md",
  "00-front-matter/prologue.md",

  // ── Part 1 ──
  "part1-intro/chapter01.md",
  "part1-intro/chapter02.md",
  "part1-intro/chapter03.md",
  "part1-intro/part1-practice.md",

  // ── Part 2 ──
  "part2-start/chapter04.md",
  "part2-start/chapter05.md",
  "part2-start/chapter06.md",
  "part2-start/part2-practice.md",

  // ── Part 3 ──
  "part3-projects/chapter07.md",
  "part3-projects/chapter08.md",
  "part3-projects/chapter09.md",
  "part3-projects/chapter10.md",
  "part3-projects/part3-practice.md",

  // ── Part 4 ──
  "part4-monetize/chapter11.md",
  "part4-monetize/chapter12.md",
  "part4-monetize/chapter13.md",
  "part4-monetize/chapter14.md",
  "part4-monetize/part4-practice.md",

  // ── Part 5 ──
  "part5-sustain/chapter15.md",
  "part5-sustain/chapter16.md",
  "part5-sustain/chapter17.md",
  "part5-sustain/part5-practice.md",

  // ── 뒷부분 ──
  "99-back-matter/epilogue.md",
  "99-back-matter/appendix.md",
];

// ============================================================
// 유틸리티
// ============================================================
function log(icon, message) {
  console.log(`  ${icon}  ${message}`);
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("  ❌  config.json을 찾을 수 없습니다.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

// ============================================================
// 1단계: 마크다운 파일 수집
// ============================================================
function collectMarkdownFiles() {
  const files = [];
  let skipped = 0;

  for (const relativePath of MANUSCRIPT_ORDER) {
    const fullPath = path.join(MANUSCRIPT_DIR, relativePath);

    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8").trim();
      // 제목만 있는 빈 파일 건너뛰기 (내용이 "# 제목" 한 줄뿐인 경우)
      const lines = content.split("\n").filter((l) => l.trim() !== "");
      if (lines.length <= 1) {
        skipped++;
        continue;
      }
      files.push({ path: relativePath, content });
    } else {
      skipped++;
    }
  }

  return { files, skipped };
}

// ============================================================
// 2단계: 마크다운 → HTML 변환
// ============================================================
function createMarkdownConverter() {
  const md = new MarkdownIt({
    html: true,           // HTML 태그 허용 (커스텀 박스 div 등)
    breaks: true,         // 줄바꿈을 <br>로 변환
    linkify: true,        // URL을 자동으로 링크로 변환
    typographer: true,    // 따옴표 등 타이포그래피 변환
  });

  return md;
}

function convertToHtml(md, markdownContent, filePath) {
  // 이미지를 마크다운에서 직접 HTML <img> 태그로 변환 (markdown-it이 file:// URL을 차단하므로)
  // 이미지 파일이 존재하는 경우만 삽입
  let processed = markdownContent.replace(
    /!\[([^\]]*)\]\((\.\.\/)*images\/([^)]+)\)/g,
    (match, alt, dots, imgPath) => {
      const absPath = path.join(IMAGES_DIR, imgPath);
      if (fs.existsSync(absPath)) {
        const fileUrl = absPath.replace(/\\/g, "/");
        return `<img src="file:///${fileUrl}" alt="${alt}" />`;
      }
      // 이미지가 없으면 제거 (깨진 이미지 방지)
      return "";
    }
  );

  return md.render(processed);
}

// ============================================================
// 3단계: 목차(TOC) 자동 생성
// ============================================================
function generateToc(files, md) {
  const tocItems = [];

  for (const file of files) {
    const lines = file.content.split("\n");

    for (const line of lines) {
      // h1: 챕터/파트 제목
      const h1Match = line.match(/^# (.+)$/);
      if (h1Match) {
        const title = h1Match[1].trim();
        const id = slugify(title);
        tocItems.push({ level: 1, title, id });
        continue;
      }

      // h2: 섹션 제목
      const h2Match = line.match(/^## (.+)$/);
      if (h2Match) {
        const title = h2Match[1].trim();
        const id = slugify(title);
        tocItems.push({ level: 2, title, id });
      }
    }
  }

  // TOC HTML 생성
  let html = '<div class="toc">\n';
  html += '  <h2>목차</h2>\n';
  html += '  <div class="toc-list">\n';

  for (let i = 0; i < tocItems.length; i++) {
    const item = tocItems[i];

    if (item.level === 1) {
      html += `    <div class="toc-h1"><a href="#${item.id}">${item.title}</a></div>\n`;
    } else if (item.level === 2) {
      html += `    <div class="toc-h2"><a href="#${item.id}">${item.title}</a></div>\n`;
    }
  }

  html += '  </div>\n</div>\n';

  return html;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")    // 특수문자 제거 (한글 유지)
    .replace(/\s+/g, "-")             // 공백 → 하이픈
    .replace(/-+/g, "-")              // 중복 하이픈 제거
    .trim();
}

// ============================================================
// 4단계: 전체 HTML 문서 조립
// ============================================================
function assembleHtmlDocument(config, tocHtml, chaptersHtml, cssContent) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <meta name="author" content="${config.author}">
  <meta name="description" content="${config.subtitle}">
  <style>${cssContent}</style>
</head>
<body>
  <!-- 목차 -->
  ${tocHtml}

  <!-- 본문 -->
  ${chaptersHtml}
</body>
</html>`;
}

// ============================================================
// 5단계: Puppeteer로 PDF 생성
// ============================================================
async function generatePdf(htmlFilePath, outputPath, config, options = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--allow-file-access-from-files"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(300000); // 5분 타임아웃

  // 로컬 HTML 파일을 file:// URL로 열기 (로컬 이미지 로딩 허용)
  const fileUrl = `file:///${htmlFilePath.replace(/\\/g, "/")}`;
  await page.goto(fileUrl, {
    waitUntil: "networkidle2",
    timeout: 300000,
  });

  // 이미지 로딩 대기 (최대 30초)
  await page.evaluate(() => {
    const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    return Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener("load", resolve);
                img.addEventListener("error", resolve);
              })
          )
      ),
      timeout(30000),
    ]);
  });

  // PDF 옵션
  const pdfOptions = {
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "2.5cm",
      bottom: "2.5cm",
      left: "2.5cm",
      right: "2.5cm",
    },
    displayHeaderFooter: true,
    // 헤더: 책 제목
    headerTemplate: `
      <div style="
        width: 100%;
        font-size: 8pt;
        font-family: 'Nanum Gothic', sans-serif;
        color: #888888;
        padding: 0 2.5cm;
        text-align: center;
      ">
        <span>${config.title}</span>
      </div>
    `,
    // 푸터: 페이지 번호
    footerTemplate: `
      <div style="
        width: 100%;
        font-size: 9pt;
        font-family: 'Nanum Gothic', sans-serif;
        color: #888888;
        padding: 0 2.5cm;
        text-align: center;
      ">
        <span class="pageNumber"></span>
      </div>
    `,
  };

  // 미리보기 모드: 페이지 수 제한
  if (options.pageRange) {
    pdfOptions.pageRanges = options.pageRange;
  }

  await page.pdf({ ...pdfOptions, timeout: 300000 });

  // 전체 페이지 수 확인
  const totalPages = await page.evaluate(() => {
    // 대략적인 페이지 수 계산 (A4 높이 기준)
    const bodyHeight = document.body.scrollHeight;
    const pageHeight = 1122; // A4 at 96dpi ≈ 1122px
    return Math.ceil(bodyHeight / pageHeight);
  });

  await browser.close();

  return totalPages;
}

// ============================================================
// CLI 인자 파싱
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    previewOnly: args.includes("--preview-only"),
  };
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log();
  console.log("📖 바이브 코딩 전자책 — PDF 빌드");
  console.log("=".repeat(50));

  const options = parseArgs();

  // ── 1단계: 설정 로드 ──
  log("📂", "설정 파일 로드 중...");
  const config = loadConfig();
  log("✅", `제목: ${config.title}`);
  log("  ", `부제: ${config.subtitle}`);
  log("  ", `저자: ${config.author}`);

  // ── 2단계: 마크다운 파일 수집 ──
  console.log();
  log("📑", "마크다운 파일 수집 중...");
  const { files, skipped } = collectMarkdownFiles();
  log("✅", `${files.length}개 파일 수집 완료 (빈 파일 ${skipped}개 건너뜀)`);

  if (files.length === 0) {
    log("⚠️", "변환할 마크다운 파일이 없습니다.");
    process.exit(0);
  }

  // 수집된 파일 목록 출력
  files.forEach((f) => {
    log("  ", `└─ ${f.path}`);
  });

  // ── 3단계: HTML 변환 ──
  console.log();
  log("🔄", "마크다운 → HTML 변환 중...");
  const md = createMarkdownConverter();

  // 각 챕터를 HTML로 변환하고 합치기
  let chaptersHtml = "";
  for (const file of files) {
    const html = convertToHtml(md, file.content, file.path);

    // 제목(h1)에 id 속성 추가 (목차 링크용)
    const processedHtml = html.replace(/<h1>(.*?)<\/h1>/g, (match, title) => {
      const id = slugify(title);
      return `<h1 id="${id}">${title}</h1>`;
    }).replace(/<h2>(.*?)<\/h2>/g, (match, title) => {
      const id = slugify(title);
      return `<h2 id="${id}">${title}</h2>`;
    });

    // 표지는 .chapter 래퍼 없이 출력 (page-break-before 방지)
    if (file.path === "00-front-matter/cover.md") {
      chaptersHtml += `\n<!-- ${file.path} -->\n${processedHtml}\n`;
    } else {
      chaptersHtml += `\n<!-- ${file.path} -->\n<section class="chapter">\n${processedHtml}\n</section>\n`;
    }
  }
  log("✅", "HTML 변환 완료");

  // ── 4단계: 목차 생성 ──
  log("📋", "목차 생성 중...");
  const tocHtml = generateToc(files, md);
  log("✅", "목차 생성 완료");

  // ── 5단계: CSS 로드 ──
  log("🎨", "스타일 적용 중...");
  const cssPath = path.join(STYLES_DIR, "ebook.css");
  const pdfCssPath = path.join(STYLES_DIR, "pdf-styles.css");
  let cssContent = "";
  if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, "utf-8");
    log("✅", "ebook.css 로드 완료");
  } else {
    log("⚠️", "ebook.css를 찾을 수 없습니다. 기본 스타일로 진행합니다.");
  }
  if (fs.existsSync(pdfCssPath)) {
    cssContent += "\n" + fs.readFileSync(pdfCssPath, "utf-8");
    log("✅", "pdf-styles.css 로드 완료");
  }

  // ── 6단계: HTML 문서 조립 ──
  log("📄", "HTML 문서 조립 중...");
  const fullHtml = assembleHtmlDocument(config, tocHtml, chaptersHtml, cssContent);

  // 출력 디렉토리 확인
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 디버깅용 HTML 저장
  const htmlOutputPath = path.join(OUTPUT_DIR, "vibe-coding-ebook.html");
  fs.writeFileSync(htmlOutputPath, fullHtml, "utf-8");
  log("✅", `HTML 저장: ${path.relative(PROJECT_ROOT, htmlOutputPath)}`);

  // ── 7단계: PDF 생성 ──
  console.log();
  log("🖨️", "PDF 생성 중 (Puppeteer)...");
  log("  ", "브라우저 실행 중... 잠시 기다려 주세요.");

  let totalPages = 0;

  if (!options.previewOnly) {
    // 전체 PDF 생성
    const fullPdfPath = path.join(OUTPUT_DIR, "vibe-coding-ebook.pdf");
    log("📘", "전체 PDF 생성 중...");
    totalPages = await generatePdf(htmlOutputPath, fullPdfPath, config);
    const fullSize = (fs.statSync(fullPdfPath).size / 1024 / 1024).toFixed(2);
    log("✅", `전체 PDF 완료: ${path.relative(PROJECT_ROOT, fullPdfPath)} (${fullSize}MB)`);
  }

  // 미리보기 PDF 생성 (처음 N페이지)
  const previewPdfPath = path.join(OUTPUT_DIR, "vibe-coding-ebook-preview.pdf");
  log("📗", `미리보기 PDF 생성 중 (처음 ${PREVIEW_PAGES}페이지)...`);
  await generatePdf(htmlOutputPath, previewPdfPath, config, {
    pageRange: `1-${PREVIEW_PAGES}`,
  });
  const previewSize = (fs.statSync(previewPdfPath).size / 1024 / 1024).toFixed(2);
  log("✅", `미리보기 PDF 완료: ${path.relative(PROJECT_ROOT, previewPdfPath)} (${previewSize}MB)`);

  // ── 빌드 통계 수집 ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 단어 수 & 이미지 수 계산
  let totalChars = 0;
  let totalImages = 0;
  const fileStats = [];

  for (const file of files) {
    const chars = file.content.replace(/\s/g, "").length;
    const images = (file.content.match(/!\[.*?\]\(.*?\)/g) || []).length;
    totalChars += chars;
    totalImages += images;
    fileStats.push({ path: file.path, chars, images });
  }

  // 한국어 기준 분당 400자 읽기 속도
  const readingMinutes = Math.ceil(totalChars / 400);

  // ── 빌드 결과 요약 (콘솔) ──
  console.log();
  console.log("=".repeat(50));
  console.log("📊 빌드 결과 요약");
  console.log("=".repeat(50));
  log("📑", `원고 파일: ${files.length}개`);
  if (totalPages > 0) {
    log("📄", `전체 페이지: 약 ${totalPages}페이지`);
  }
  log("📝", `총 글자 수: ${totalChars.toLocaleString()}자`);
  log("🖼️", `이미지 참조: ${totalImages}개`);
  log("⏱️", `예상 독서 시간: 약 ${readingMinutes}분`);
  log("🔧", `빌드 시간: ${elapsed}초`);
  console.log();

  if (!options.previewOnly) {
    log("📘", `전체: output/vibe-coding-ebook.pdf`);
  }
  log("📗", `미리보기: output/vibe-coding-ebook-preview.pdf`);
  log("📄", `HTML: output/vibe-coding-ebook.html`);
  log("📋", `리포트: output/build-report.txt`);
  console.log();

  // ── 빌드 리포트 파일 생성 ──
  const reportLines = [
    `========================================`,
    `바이브 코딩 전자책 — 빌드 리포트`,
    `========================================`,
    `빌드 시각: ${new Date().toLocaleString("ko-KR")}`,
    ``,
    `[전체 통계]`,
    `  원고 파일:     ${files.length}개`,
    `  전체 페이지:   약 ${totalPages}페이지`,
    `  총 글자 수:    ${totalChars.toLocaleString()}자`,
    `  이미지 참조:   ${totalImages}개`,
    `  예상 독서 시간: 약 ${readingMinutes}분`,
    `  빌드 시간:     ${elapsed}초`,
    ``,
    `[출력 파일]`,
  ];

  if (!options.previewOnly) {
    const fullSize = (fs.statSync(path.join(OUTPUT_DIR, "vibe-coding-ebook.pdf")).size / 1024 / 1024).toFixed(2);
    reportLines.push(`  전체 PDF:     output/vibe-coding-ebook.pdf (${fullSize}MB)`);
  }
  const pvSize = (fs.statSync(path.join(OUTPUT_DIR, "vibe-coding-ebook-preview.pdf")).size / 1024 / 1024).toFixed(2);
  reportLines.push(`  미리보기 PDF: output/vibe-coding-ebook-preview.pdf (${pvSize}MB)`);
  reportLines.push(`  HTML:         output/vibe-coding-ebook.html`);
  reportLines.push(``);
  reportLines.push(`[파일별 상세]`);
  reportLines.push(`  ${"파일".padEnd(45)} ${"글자수".padStart(8)} ${"이미지".padStart(6)}`);
  reportLines.push(`  ${"-".repeat(45)} ${"-".repeat(8)} ${"-".repeat(6)}`);

  for (const stat of fileStats) {
    reportLines.push(
      `  ${stat.path.padEnd(45)} ${String(stat.chars).padStart(8)} ${String(stat.images).padStart(6)}`
    );
  }

  reportLines.push(``);
  reportLines.push(`========================================`);

  const reportPath = path.join(OUTPUT_DIR, "build-report.txt");
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf-8");
}

// 실행
main().catch((error) => {
  console.error("\n  ❌  빌드 실패:", error.message);
  console.error(error.stack);
  process.exit(1);
});
