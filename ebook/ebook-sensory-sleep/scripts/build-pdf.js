const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const puppeteer = require("puppeteer");

const md = markdownIt({ html: true, breaks: true, typographer: true });

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

// 샘플 버전 (Part 1만)
const sampleOrder = [
  "00-cover.md",
  "01-toc.md",
  "part1-foundation/chapter01-sleep-problems.md",
  "part1-foundation/chapter02-connection.md",
  "part1-foundation/chapter03-science.md",
  "part1-foundation/part1-summary.md",
];

const ROOT_DIR = path.join(__dirname, "..");
const MANUSCRIPT_DIR = path.join(ROOT_DIR, "manuscript");
const STYLES_DIR = path.join(ROOT_DIR, "styles");
const BUILD_DIR = path.join(ROOT_DIR, "build");

function stripFrontMatter(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  return match ? content.slice(match[0].length) : content;
}

function resolveImagePaths(html, currentFileDir) {
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    if (src.startsWith("http") || src.startsWith("data:")) return match;
    const absolutePath = path.resolve(currentFileDir, src);
    if (fs.existsSync(absolutePath)) {
      const ext = path.extname(absolutePath).toLowerCase();
      const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      const base64 = fs.readFileSync(absolutePath).toString("base64");
      return `src="data:${mime};base64,${base64}"`;
    }
    console.log(`    ⚠️ 이미지 없음: ${src}`);
    return match;
  });
}

function convertMarkdownFiles(fileList) {
  let allHtml = "";
  let fileCount = 0;

  for (const file of fileList) {
    const filePath = path.join(MANUSCRIPT_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  파일 없음: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, "utf-8");
    content = stripFrontMatter(content);
    let html = md.render(content);
    html = resolveImagePaths(html, path.dirname(filePath));

    // 파일별 CSS 클래스 적용
    let sectionClass = "chapter";
    if (file === "00-cover.md") sectionClass = "chapter cover";
    else if (file === "01-toc.md") sectionClass = "chapter toc";

    allHtml += `<section class="${sectionClass}" data-file="${file}">\n${html}\n</section>\n`;
    fileCount++;
    console.log(`  📄 ${file}`);
  }

  return { html: allHtml, count: fileCount };
}

function buildFullHtml(bodyHtml, title) {
  const css = fs.readFileSync(path.join(STYLES_DIR, "markdown-styles.css"), "utf-8");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    ${css}

    /* 한글 단어 잘림 방지 */
    * { word-break: keep-all; overflow-wrap: break-word; }

    .page-break { page-break-before: always; }
    section.chapter { page-break-before: always; }
    section.chapter:first-child { page-break-before: avoid; }

    /* 표지 */
    section.cover { text-align: center; }
    section.cover h1 {
      margin-top: 2cm;
      font-size: 30pt;
      color: #9B89B3;
      page-break-before: avoid;
    }
    section.cover h2 {
      font-size: 16pt;
      color: #555;
      font-weight: 400;
      margin-bottom: 1cm;
    }
    section.cover img {
      max-width: 70%;
      margin: 1cm auto;
      border-radius: 12px;
    }

    /* 목차 */
    section.toc h2 {
      color: #9B89B3;
      border-bottom: 2px solid #A8E6CF;
      padding-bottom: 5px;
      margin-top: 1cm;
    }
    section.toc ul { list-style: none; padding-left: 1em; }
    section.toc li { padding: 3px 0; }

    /* 블록인용문 스타일 강화 */
    blockquote {
      background-color: #F5F0FA;
      border-left: 4px solid #9B89B3;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    blockquote strong { display: block; margin-bottom: 6px; }

    /* 체크박스 */
    li { list-style-position: outside; }

    /* 이미지 최적화 */
    img {
      max-width: 85%;
      margin: 15px auto;
      display: block;
      border-radius: 6px;
    }
    img[src*="cover"] {
      max-width: 70%;
      border-radius: 12px;
    }
    img[src*="diagrams"] {
      max-width: 90%;
    }

    /* 표 줄무늬 */
    tr:nth-child(even) { background-color: #F8F6FB; }
    th { background-color: #9B89B3; color: white; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function generatePDF(browser, html, outputPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load", timeout: 120000 });

  // 이미지 로딩 대기
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => { img.onload = img.onerror = r; }))
    )
  );

  await new Promise((r) => setTimeout(r, 1000));

  const pdfConfig = JSON.parse(fs.readFileSync(path.join(STYLES_DIR, "pdf-config.json"), "utf-8"));

  await page.pdf({
    path: outputPath,
    format: pdfConfig.format,
    margin: {
      top: pdfConfig.margins.top,
      right: pdfConfig.margins.right,
      bottom: pdfConfig.margins.bottom,
      left: pdfConfig.margins.left,
    },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `
      <div style="width:100%;text-align:center;font-size:9pt;color:#888;padding-top:5px;">
        <span class="pageNumber"></span>
      </div>`,
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
  });

  await page.close();

  const stats = fs.statSync(outputPath);
  return { size: stats.size };
}

function generateMergedMarkdown() {
  console.log("\n📋 통합 마크다운 생성...");
  let merged = "";

  for (const file of manuscriptOrder) {
    const filePath = path.join(MANUSCRIPT_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, "utf-8");
    content = stripFrontMatter(content);
    merged += `\n\n<!-- === ${file} === -->\n\n${content}`;
  }

  const mergedPath = path.join(MANUSCRIPT_DIR, "complete-ebook.md");
  fs.writeFileSync(mergedPath, merged.trim());
  const words = merged.split(/\s+/).filter(Boolean).length;
  console.log(`  ✅ complete-ebook.md (${words} words)`);
  return { path: mergedPath, words };
}

function qualityCheck() {
  console.log("\n🔍 품질 검수...");
  const results = [];

  // 1. 모든 파일 존재 확인
  let missingFiles = 0;
  for (const file of manuscriptOrder) {
    if (!fs.existsSync(path.join(MANUSCRIPT_DIR, file))) {
      results.push(`  ❌ 파일 없음: ${file}`);
      missingFiles++;
    }
  }
  if (missingFiles === 0) results.push("  ✅ 모든 마크다운 파일 존재 (24개)");

  // 2. 이미지 파일 존재 확인
  const imgDirs = ["chapter-illustrations", "diagrams"];
  let totalImages = 0;
  let missingImages = 0;
  for (const dir of imgDirs) {
    const imgDir = path.join(ROOT_DIR, "images", dir);
    if (fs.existsSync(imgDir)) {
      const files = fs.readdirSync(imgDir).filter((f) => f.endsWith(".png"));
      totalImages += files.length;
    }
  }

  // 마크다운에서 참조된 이미지 경로 추출 & 확인
  let referencedImages = 0;
  let foundImages = 0;
  for (const file of manuscriptOrder) {
    const filePath = path.join(MANUSCRIPT_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const imgMatches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
    for (const m of imgMatches) {
      referencedImages++;
      const src = m.match(/\((.*?)\)/)[1];
      const absPath = path.resolve(path.dirname(filePath), src);
      if (fs.existsSync(absPath)) foundImages++;
    }
  }
  results.push(`  ✅ 이미지 파일: ${totalImages}개 존재`);
  results.push(`  ${foundImages === referencedImages ? "✅" : "⚠️"} 이미지 참조: ${foundImages}/${referencedImages}개 연결됨`);

  // 3. 콘텐츠 일관성 체크
  let totalWords = 0;
  for (const file of manuscriptOrder) {
    const filePath = path.join(MANUSCRIPT_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    totalWords += content.split(/\s+/).filter(Boolean).length;
  }
  results.push(`  ✅ 총 단어 수: ${totalWords.toLocaleString()}`);

  // 4. 박스 스타일 일관성
  let tipBoxes = 0, warnBoxes = 0, expertBoxes = 0, keyBoxes = 0;
  for (const file of manuscriptOrder) {
    const filePath = path.join(MANUSCRIPT_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    tipBoxes += (content.match(/💡/g) || []).length;
    warnBoxes += (content.match(/⚠️/g) || []).length;
    expertBoxes += (content.match(/📌/g) || []).length;
    keyBoxes += (content.match(/✅/g) || []).length;
  }
  results.push(`  ✅ 콘텐츠 박스: 실습(💡)${tipBoxes}개, 주의(⚠️)${warnBoxes}개, 전문가(📌)${expertBoxes}개, 핵심(✅)${keyBoxes}개`);

  return results;
}

async function main() {
  console.log("=============================================");
  console.log("  숙면으로 가는 향기로운 호흡 — 최종 빌드");
  console.log("=============================================");

  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });

  const TITLE = "숙면으로 가는 향기로운 호흡 — 발달장애 아동을 위한 후각·호흡 훈련 가이드";

  // === 품질 검수 ===
  const checkResults = qualityCheck();
  checkResults.forEach((r) => console.log(r));

  // === 통합 마크다운 생성 ===
  const merged = generateMergedMarkdown();

  // === 1. 전체 PDF (디지털용) ===
  console.log("\n📖 [1/3] 디지털용 PDF 빌드...");
  const { html: fullBody, count: fullCount } = convertMarkdownFiles(manuscriptOrder);
  const fullHtml = buildFullHtml(fullBody, TITLE);

  // HTML 저장
  fs.writeFileSync(path.join(BUILD_DIR, "ebook.html"), fullHtml);
  console.log(`  ✅ HTML 저장 완료 (${fullCount}개 섹션)`);

  // === 브라우저 시작 (1회) ===
  console.log("\n🌐 브라우저 시작...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    timeout: 180000,
    protocolTimeout: 180000,
  });

  const digitalPath = path.join(BUILD_DIR, "final-ebook.pdf");
  const digitalResult = await generatePDF(browser, fullHtml, digitalPath);
  console.log(`  ✅ final-ebook.pdf (${(digitalResult.size / 1024 / 1024).toFixed(1)} MB)`);

  // === 2. 인쇄용 PDF (동일 내용, 별도 파일명) ===
  console.log("\n📖 [2/3] 인쇄용 PDF 빌드...");
  const printPath = path.join(BUILD_DIR, "final-ebook-print.pdf");
  const printResult = await generatePDF(browser, fullHtml, printPath);
  console.log(`  ✅ final-ebook-print.pdf (${(printResult.size / 1024 / 1024).toFixed(1)} MB)`);

  // === 3. 샘플 PDF (Part 1만) ===
  console.log("\n📖 [3/3] 샘플 PDF 빌드 (Part 1)...");
  const { html: sampleBody } = convertMarkdownFiles(sampleOrder);
  const sampleHtml = buildFullHtml(sampleBody, TITLE + " [샘플]");
  const samplePath = path.join(BUILD_DIR, "sample-ebook.pdf");
  const sampleResult = await generatePDF(browser, sampleHtml, samplePath);
  console.log(`  ✅ sample-ebook.pdf (${(sampleResult.size / 1024 / 1024).toFixed(1)} MB)`);

  await browser.close();

  // === 최종 보고 ===
  console.log("\n=============================================");
  console.log("  최종 빌드 완료!");
  console.log("=============================================\n");

  console.log("📁 생성된 파일:");
  console.log(`  build/final-ebook.pdf       ${(digitalResult.size / 1024 / 1024).toFixed(1)} MB  (디지털 배포용)`);
  console.log(`  build/final-ebook-print.pdf ${(printResult.size / 1024 / 1024).toFixed(1)} MB  (인쇄용)`);
  console.log(`  build/sample-ebook.pdf      ${(sampleResult.size / 1024 / 1024).toFixed(1)} MB  (샘플, Part 1)`);
  console.log(`  build/ebook.html            HTML 원본`);
  console.log(`  manuscript/complete-ebook.md 통합 마크다운 (${merged.words} words)`);
  console.log("");
}

main().catch((err) => {
  console.error("❌ 빌드 실패:", err.message);
  process.exit(1);
});
