const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const HTML_PATH = path.join(__dirname, "..", "build", "ebook.html");
const OUTPUT_DIR = path.join(__dirname, "..", "images", "kmong-listing", "preview");

async function main() {
  console.log("===========================================");
  console.log("  크몽 미리보기 이미지 생성");
  console.log("  HTML → PNG (Puppeteer screenshot)");
  console.log("===========================================\n");

  if (!fs.existsSync(HTML_PATH)) {
    console.error(`HTML not found: ${HTML_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // A4 비율 뷰포트 (가로 652px 이상 필요)
  const pageWidth = 800;
  const pageHeight = 1132; // A4 비율 (800 * 297/210)
  await page.setViewport({ width: pageWidth, height: pageHeight, deviceScaleFactor: 1.5 });

  const htmlUrl = `file:///${HTML_PATH.replace(/\\/g, "/")}`;
  console.log(`Loading HTML: ${htmlUrl}\n`);

  await page.goto(htmlUrl, { waitUntil: "networkidle0", timeout: 60000 });

  // 전체 페이지 높이 확인
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const totalPages = Math.ceil(totalHeight / 1132);
  console.log(`Total content height: ${totalHeight}px (~${totalPages} pages)\n`);

  // 캡처할 페이지 영역 (0-indexed scroll positions)
  // 표지, 목차, 주요 챕터 시작 부분 등
  const captures = [
    { name: "preview-01-cover", scrollY: 0, label: "표지" },
    { name: "preview-02-toc", scrollY: pageHeight * 1, label: "목차" },
    { name: "preview-03-chapter1", scrollY: pageHeight * 2, label: "Chapter 1 시작" },
    { name: "preview-04-content1", scrollY: pageHeight * 4, label: "본문 내용" },
    { name: "preview-05-program", scrollY: pageHeight * 8, label: "프로그램 소개" },
    { name: "preview-06-case", scrollY: pageHeight * 16, label: "사례 소개" },
    { name: "preview-07-appendix", scrollY: pageHeight * 22, label: "부록" },
  ];

  // 실제 page-break 위치를 찾아서 더 정확하게 캡처
  const breakPositions = await page.evaluate(() => {
    const elements = document.querySelectorAll("h1, h2");
    const positions = [];
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      positions.push({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 40),
        top: rect.top + window.scrollY,
      });
    });
    return positions;
  });

  console.log("주요 제목 위치:");
  breakPositions.slice(0, 25).forEach((p, i) => {
    console.log(`  ${i}: [${p.tag}] "${p.text}" → ${Math.round(p.top)}px`);
  });

  // 주요 위치 기반으로 캡처 대상 재설정
  const smartCaptures = [];

  // 1. 표지 (첫 페이지)
  smartCaptures.push({ scrollY: 0, name: "preview-01-cover", label: "표지" });

  // h1/h2 제목 위치에서 주요 섹션 찾기
  const h1Positions = breakPositions.filter((p) => p.tag === "H1");

  // 처음 5~6개 H1 위치를 미리보기로 사용
  for (let i = 0; i < Math.min(h1Positions.length, 6); i++) {
    const pos = h1Positions[i];
    // 제목 약간 위에서 시작하도록 오프셋
    const scrollY = Math.max(0, pos.top - 50);
    smartCaptures.push({
      scrollY,
      name: `preview-${String(i + 2).padStart(2, "0")}-${pos.text.substring(0, 10).replace(/[^a-zA-Z0-9가-힣]/g, "")}`,
      label: pos.text,
    });
  }

  console.log(`\n캡처 대상: ${smartCaptures.length}개\n`);

  for (const capture of smartCaptures) {
    const outputPath = path.join(OUTPUT_DIR, `${capture.name}.png`);

    try {
      console.log(`  [${capture.label}] scrollY=${Math.round(capture.scrollY)}...`);

      await page.evaluate((y) => window.scrollTo(0, y), capture.scrollY);
      await new Promise((r) => setTimeout(r, 500));

      await page.screenshot({
        path: outputPath,
        type: "png",
        clip: {
          x: 0,
          y: capture.scrollY,
          width: pageWidth,
          height: pageHeight,
        },
      });

      const fileSize = fs.statSync(outputPath).size;
      console.log(`  Saved: ${path.basename(outputPath)} (${(fileSize / 1024).toFixed(1)}KB)`);
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  await browser.close();

  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\n===========================================`);
  console.log(`  완료: ${files.length}개 미리보기 이미지 생성`);
  console.log(`  출력 폴더: ${OUTPUT_DIR}`);
  console.log(`===========================================`);
}

main().catch(console.error);
