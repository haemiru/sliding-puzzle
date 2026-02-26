/**
 * generate-kmong-cover.js
 *
 * 크몽 판매용 겉표지 이미지 생성 (652x488px)
 *
 * 사용법:
 *   node scripts/generate-kmong-cover.js
 *   node scripts/generate-kmong-cover.js --force   # 기존 파일 덮어쓰기
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "images");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "kmong-cover.png");

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config = JSON.parse(raw);
  if (!config.gemini?.apiKey) {
    console.error("❌ config.json에 gemini.apiKey가 설정되지 않았습니다.");
    process.exit(1);
  }
  return config;
}

const PROMPT = `
Create a professional Korean ebook product thumbnail image. Exact resolution: 652x488 pixels, landscape.

Layout — split composition:
- LEFT 60%: Dark gradient background from deep navy (#1A3A5C) to blue (#2C5F8D)
  - Top-left corner: small orange (#FF9933) rounded pill/badge with white text "AI 시대 필독서"
  - Main title in large bold white Korean text, two lines:
    Line 1: "바이브 코딩으로"
    Line 2: "1인 사업가 되기" (slightly larger than line 1)
  - Below title: subtitle in light gray (#CCCCCC) smaller text: "코딩 몰라도 괜찮아요, AI가 함께 합니다"
  - Bottom-left: small text "J.M 지음 | 전자책 (PDF)" in light gray

- RIGHT 40%: A realistic 3D floating ebook/tablet mockup angled slightly, displaying the book cover (dark blue cover with a glowing laptop, AI brain icon, and business chart icons)

Background accents:
- Subtle glowing particle dots and thin geometric connecting lines in the dark background, suggesting AI/tech neural network
- Semi-transparent small floating icons scattered: laptop, upward trending chart, coin/money symbol
- Soft blue glow effects around the ebook mockup

Typography:
- Clean modern sans-serif Korean font (like Pretendard, Noto Sans KR)
- Strong contrast: white/orange text on dark background
- Professional hierarchy: badge → title → subtitle → author

Overall feel: Premium, trustworthy, modern tech — like a top-selling ebook thumbnail on a Korean digital marketplace. No border, no watermark, clean edges.
`.trim();

async function main() {
  const force = process.argv.includes("--force");

  console.log();
  console.log("🛒 크몽 겉표지 이미지 생성기");
  console.log("=".repeat(45));

  if (fs.existsSync(OUTPUT_FILE) && !force) {
    console.log(`\n  ⏭️  이미 존재합니다: ${OUTPUT_FILE}`);
    console.log("     덮어쓰기: --force 옵션 사용");
    return;
  }

  const config = loadConfig();
  const model = config.gemini.model || "gemini-3-pro-image-preview";
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  console.log(`\n  🤖 모델: ${model}`);
  console.log(`  📐 크기: 652 x 488px`);
  console.log(`  📂 출력: ${OUTPUT_FILE}`);
  console.log(`\n  🖼️  이미지 생성 중... (최대 30초 소요)`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: PROMPT,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p) => p.inlineData);

      if (!imagePart) {
        throw new Error("응답에 이미지 데이터가 없습니다.");
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(OUTPUT_FILE, buffer);

      console.log(`\n  ✅ 생성 완료: ${OUTPUT_FILE}`);
      console.log(`  📦 파일 크기: ${(buffer.length / 1024).toFixed(1)}KB`);
      console.log();
      return;
    } catch (error) {
      console.log(`\n  ⚠️  시도 ${attempt}/3 실패: ${error.message}`);
      if (attempt < 3) {
        const wait = Math.pow(2, attempt) * 1000;
        console.log(`     ${wait / 1000}초 후 재시도...`);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        console.error(`\n  ❌ 3번 시도 모두 실패했습니다.`);
        process.exit(1);
      }
    }
  }
}

main().catch((err) => {
  console.error("\n❌ 오류:", err.message);
  process.exit(1);
});
