const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// ──────────────────────────────────────────────
// 설정
// ──────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const HTML_FILE = path.join(ROOT, "output", "ebook.html");
const PDF_FILE = path.join(ROOT, "output", "final.pdf");
const CSS_FILE = path.join(ROOT, "styles", "ebook-style.css");

async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  📄 PDF 빌드 (Puppeteer)");
  console.log("══════════════════════════════════════════");
  console.log();

  // 1. 입력 파일 확인
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`❌ HTML 파일이 없습니다: ${HTML_FILE}`);
    console.error("   먼저 pandoc으로 HTML을 생성하세요:");
    console.error("   node scripts/merge-content.js && pandoc 명령 실행");
    process.exit(1);
  }

  // 2. CSS를 HTML에 인라인 삽입 (로컬 파일 참조 문제 방지)
  console.log("📝 HTML + CSS 결합 중...");
  let html = fs.readFileSync(HTML_FILE, "utf-8");
  const css = fs.existsSync(CSS_FILE)
    ? fs.readFileSync(CSS_FILE, "utf-8")
    : "";

  // 기존 CSS 링크를 인라인 스타일로 교체
  if (css) {
    const styleTag = `<style>\n${css}\n</style>`;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${styleTag}\n</head>`);
    } else {
      html = `${styleTag}\n${html}`;
    }
  }

  // 이미지 경로를 절대 경로로 변환
  const imagesAbsPath = path.join(ROOT, "images").replace(/\\/g, "/");
  html = html.replace(
    /src="images\//g,
    `src="file:///${imagesAbsPath}/`
  );

  // page-break div 처리
  html = html.replace(
    /<div class="page-break"><\/div>/g,
    '<div style="page-break-before: always;"></div>'
  );

  // 임시 HTML 파일 저장
  const tempHtml = path.join(ROOT, "output", "ebook-styled.html");
  fs.writeFileSync(tempHtml, html, "utf-8");

  // 3. Puppeteer로 PDF 생성
  console.log("🚀 브라우저 실행 중...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 120000,
    timeout: 120000,
  });

  const page = await browser.newPage();

  const fileUrl = `file:///${tempHtml.replace(/\\/g, "/")}`;
  console.log("📄 HTML 로딩 중...");
  await page.goto(fileUrl, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  // 이미지 로딩 대기
  await page.evaluate(async () => {
    const images = document.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  });

  console.log("📄 PDF 생성 중...");
  await page.pdf({
    path: PDF_FILE,
    format: "A4",
    margin: {
      top: "25mm",
      bottom: "25mm",
      left: "20mm",
      right: "20mm",
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width:100%;text-align:center;font-size:9px;font-family:sans-serif;">
        <span style="
          display:inline-block;
          width:24px;height:24px;line-height:24px;
          background:#F4A7A3;color:#fff;
          border-radius:50%;text-align:center;
          font-weight:bold;
        "><span class="pageNumber"></span></span>
      </div>`,
    timeout: 120000,
  });

  await browser.close();

  // 임시 파일 정리
  fs.unlinkSync(tempHtml);

  // 4. 결과
  const stats = fs.statSync(PDF_FILE);
  const sizeMB = (stats.size / 1048576).toFixed(2);

  console.log();
  console.log("══════════════════════════════════════════");
  console.log("  ✅ PDF 빌드 완료!");
  console.log("══════════════════════════════════════════");
  console.log(`  📄 출력 파일: output/final.pdf`);
  console.log(`  📦 파일 크기: ${sizeMB} MB`);
  console.log();
}

main().catch((err) => {
  console.error("PDF 빌드 오류:", err.message);
  process.exit(1);
});
