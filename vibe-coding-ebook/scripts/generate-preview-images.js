/**
 * generate-preview-images.js
 *
 * 크몽 미리보기용 이미지 생성
 * HTML 전자책에서 주요 페이지를 캡처하여 PNG로 저장
 *
 * 사용법: node scripts/generate-preview-images.js
 * 출력: output/preview-01.png ~ preview-07.png
 *
 * 크몽 요구사항: 가로 652px 이상, 세로 3000px 이하, PNG/JPG
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");
const HTML_PATH = path.join(OUTPUT_DIR, "vibe-coding-ebook.html");

// 캡처할 섹션 정의 (CSS 선택자 기준)
const SECTIONS = [
  {
    name: "preview-01",
    label: "표지",
    scrollTo: ".cover-page",
    offsetY: 0,
  },
  {
    name: "preview-02",
    label: "목차",
    scrollTo: null, // 문서 맨 위 = 목차
    offsetY: 0,
  },
  {
    name: "preview-03",
    label: "프롤로그",
    scrollTo: "#프롤로그-두-사람의-이야기",
    offsetY: -40,
  },
  {
    name: "preview-04",
    label: "Chapter 1",
    scrollTo: "#chapter-1-ai-시대-코딩의-새로운-패러다임",
    offsetY: -40,
  },
  {
    name: "preview-05",
    label: "Chapter 5",
    scrollTo: "#chapter-5-10분-만에-첫-웹페이지-만들기",
    offsetY: -40,
  },
  {
    name: "preview-06",
    label: "Chapter 7",
    scrollTo: "#chapter-07-실전-프로젝트-기획하기",
    offsetY: -40,
  },
  {
    name: "preview-07",
    label: "Chapter 11",
    scrollTo: "#chapter-11-수익화-전략-세우기",
    offsetY: -40,
  },
  {
    name: "preview-08",
    label: "Chapter 17",
    scrollTo: "#chapter-17-1인-사업가의-장기-비전",
    offsetY: -40,
  },
  {
    name: "preview-09",
    label: "에필로그",
    scrollTo: "#에필로그-당신의-이야기는-이제-시작입니다",
    offsetY: -40,
  },
];

// 캡처 크기 (A4 비율, 652px 이상)
const WIDTH = 800;
const HEIGHT = 1131; // A4 비율 (800 * 297/210)

async function main() {
  console.log("\n📸 크몽 미리보기 이미지 생성\n");

  if (!fs.existsSync(HTML_PATH)) {
    console.error("  ❌  HTML 파일이 없습니다. 먼저 npm run build를 실행하세요.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  // HTML 파일 로드
  const fileUrl = `file://${HTML_PATH.replace(/\\/g, "/")}`;
  console.log(`  📄  HTML 로드 중...`);
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 30000 });

  // 폰트 로딩 대기
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`  ✅  HTML 로드 완료\n`);

  for (const section of SECTIONS) {
    const outputPath = path.join(OUTPUT_DIR, `${section.name}.png`);

    if (section.scrollTo) {
      // 해당 요소의 절대 위치를 구해서 scrollTo로 이동
      const pos = await page.evaluate(
        (selector, offsetY) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          const absTop = window.scrollY + rect.top + offsetY;
          return Math.max(0, absTop);
        },
        section.scrollTo,
        section.offsetY
      );

      if (pos === null) {
        console.log(`  ⚠️  "${section.label}" 요소를 찾을 수 없어 건너뜁니다.`);
        continue;
      }

      await page.evaluate((y) => window.scrollTo(0, y), pos);
    } else {
      // 문서 맨 위로
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // 스크롤 후 렌더링 대기
    await new Promise((r) => setTimeout(r, 500));

    // 현재 스크롤 위치 기준으로 clip 영역 계산
    const scrollY = await page.evaluate(() => window.scrollY);

    await page.screenshot({
      path: outputPath,
      type: "png",
      clip: {
        x: 0,
        y: scrollY,
        width: WIDTH,
        height: HEIGHT,
      },
    });

    console.log(`  📸  ${section.label} → ${section.name}.png`);
  }

  await browser.close();

  console.log(`\n  ✅  미리보기 이미지 ${SECTIONS.length}장 생성 완료!`);
  console.log(`  📁  경로: ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error("  ❌  오류:", err.message);
  process.exit(1);
});
