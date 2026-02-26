/**
 * generate-kmong-details.js
 *
 * 크몽 상세 이미지 4장 생성 (가로 1024px, 세로 1536px)
 *
 * 사용법:
 *   node scripts/generate-kmong-details.js
 *   node scripts/generate-kmong-details.js --force
 *   node scripts/generate-kmong-details.js --only 1
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

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config = JSON.parse(raw);
  if (!config.gemini?.apiKey) {
    console.error("❌ config.json에 gemini.apiKey가 설정되지 않았습니다.");
    process.exit(1);
  }
  return config;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const COMMON_STYLE = `
Image specifications:
- Resolution: 1024x1536 pixels, portrait/vertical orientation
- Background: clean white (#FFFFFF) with subtle light gray (#F5F5F5) section dividers
- Primary color: navy blue (#2C5F8D), accent: orange (#FF9933), text: dark (#2B2B2B)
- Typography: clean modern Korean sans-serif font (Pretendard / Noto Sans KR style)
- Layout: well-structured sections with clear hierarchy, generous whitespace
- Style: professional Korean product detail page (like top-selling Kmong/Class101 listings)
- All text must be in Korean
- No watermarks, no borders
`.trim();

const DETAIL_IMAGES = [
  {
    file: "kmong-detail-01.png",
    label: "상세이미지 1 — 이런 분께 추천합니다",
    prompt: `Create a Korean ebook product detail image — "Who is this for?" section.

Top area:
- Header text: "이런 분께 추천합니다" in large bold navy text
- Thin orange (#FF9933) underline below the header

Main content — 5 items in a vertical list, each with an icon on the left and text on the right:

1. Icon: confused person at computer
   Title: "코딩이 겁나는 분"
   Description: "프로그래밍을 전혀 몰라도 괜찮습니다"

2. Icon: lightbulb with question mark
   Title: "아이디어는 있지만 만들 줄 모르는 분"
   Description: "AI가 여러분의 아이디어를 현실로 만들어 줍니다"

3. Icon: moon/clock (after work)
   Title: "퇴근 후 부업 수익을 원하는 분"
   Description: "하루 1시간, 온라인 수익의 첫걸음"

4. Icon: growing plant/sprout
   Title: "은퇴 후 새 출발을 준비하는 분"
   Description: "나이와 상관없이 디지털 사업을 시작하세요"

5. Icon: rocket/trending up
   Title: "AI 1인 창업에 관심 있는 분"
   Description: "2025년 가장 핫한 트렌드, 바이브 코딩"

Bottom area:
- Motivational quote in a soft blue (#E6F3FF) rounded box:
  "코딩을 몰라도 괜찮아요, AI가 함께 합니다"

${COMMON_STYLE}`,
  },

  {
    file: "kmong-detail-02.png",
    label: "상세이미지 2 — 이 전자책에서 배우는 것",
    prompt: `Create a Korean ebook product detail image — "What you'll learn" section.

Top area:
- Header: "이 전자책에서 배우는 것" in large bold navy text
- Orange underline

Main content — a visual roadmap/journey with 5 steps connected by a vertical dotted line on the left:

Step 1 (circle with "1"):
  Title: "바이브 코딩 이해하기"
  Subtitle: "Part 1 | 3개 챕터"
  Detail: "AI 시대의 새로운 코딩 방식을 이해합니다"

Step 2 (circle with "2"):
  Title: "첫 웹페이지 만들고 배포하기"
  Subtitle: "Part 2 | 3개 챕터"
  Detail: "10분 만에 웹페이지를 만들고 인터넷에 공개합니다"

Step 3 (circle with "3"):
  Title: "실전 프로젝트 완성하기"
  Subtitle: "Part 3 | 4개 챕터"
  Detail: "기획부터 디자인, 피드백 반영까지 실전 경험"

Step 4 (circle with "4"):
  Title: "수익화 시작하기"
  Subtitle: "Part 4 | 4개 챕터"
  Detail: "4가지 수익 모델로 첫 수익을 만듭니다"

Step 5 (circle with "5"):
  Title: "지속 성장하기"
  Subtitle: "Part 5 | 3개 챕터"
  Detail: "자동화, 커뮤니티, 장기 비전 수립"

Bottom box with orange accent:
  "총 17개 챕터 + 파트별 실습 과제 | 약 150페이지"

${COMMON_STYLE}`,
  },

  {
    file: "kmong-detail-03.png",
    label: "상세이미지 3 — 다른 책과 다른 점",
    prompt: `Create a Korean ebook product detail image — "Why this book is different" comparison section.

Top area:
- Header: "다른 책과 다른 점" in large bold navy text
- Orange underline

Main content — 4 comparison cards in a 2x2 grid layout:

Card 1 (top-left, light blue background):
  Icon: hands-on practice icon
  Title: "실습 중심"
  Text: "읽기만 하는 책이 아닙니다. 매 파트마다 직접 만들어봅니다."

Card 2 (top-right, light orange background):
  Icon: beginner-friendly icon
  Title: "비개발자 눈높이"
  Text: "전문 용어 최소화. 모든 개념을 일상 비유로 쉽게 설명합니다."

Card 3 (bottom-left, light green background):
  Icon: money/revenue icon
  Title: "수익화까지 연결"
  Text: "만들기에서 끝나지 않고, 실제로 돈 버는 방법까지 다룹니다."

Card 4 (bottom-right, light purple background):
  Icon: 2025 calendar/latest icon
  Title: "2025년 최신 기준"
  Text: "Claude, Cursor 등 최신 AI 도구 기준으로 작성되었습니다."

Below the grid — a dark navy (#2C5F8D) banner section:
  Large white text: "실제 사례 수록"
  Two mini profiles side by side:
  - "Pieter Levels — 연 38억 원 1인 사업가"
  - "Marc Lou — 27번 실패 후 성공한 개발자"

${COMMON_STYLE}`,
  },

  {
    file: "kmong-detail-04.png",
    label: "상세이미지 4 — 구매 안내",
    prompt: `Create a Korean ebook product detail image — purchase info and final CTA section.

Top area:
- Header: "구매 후 받으시는 것" in large bold navy text
- Orange underline

Section 1 — What you get (icon + text list):
  - PDF icon: "전체 전자책 PDF (약 150페이지)"
  - Chart icon: "13개 전문 인포그래픽 본문 포함"
  - Checklist icon: "파트별 실습 과제 + 자가진단 체크리스트"
  - Book icon: "부록: 도구 목록, FAQ, 용어 사전"

Section 2 — Book specs in a clean info table:
  "분량: 약 150페이지"
  "구성: 5개 파트, 17개 챕터"
  "형식: PDF (A4)"
  "예상 독서 시간: 약 2시간 40분"

Section 3 — Light yellow (#FFF8E1) notice box:
  Title: "안내 사항"
  - "결제 후 바로 PDF 다운로드 가능"
  - "개인 학습 목적으로만 사용해 주세요"

Bottom — Large CTA area with dark navy background:
  Main text in large white bold: "지금 시작하세요"
  Sub text in orange: "코딩 몰라도 괜찮아요, AI가 함께 합니다"

${COMMON_STYLE}`,
  },
];

async function generateImage(ai, model, prompt, outputPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((p) => p.inlineData);
      if (!imagePart) throw new Error("응답에 이미지 데이터가 없습니다.");

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return { success: true, size: buffer.length };
    } catch (error) {
      if (attempt === maxRetries) return { success: false, error: error.message };
      const wait = Math.pow(2, attempt) * 1000;
      console.log(`\n  ⚠️  시도 ${attempt}/${maxRetries} 실패: ${error.message}`);
      console.log(`     ${wait / 1000}초 후 재시도...`);
      await sleep(wait);
    }
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const onlyIdx = process.argv.indexOf("--only");
  const onlyNum = onlyIdx !== -1 ? parseInt(process.argv[onlyIdx + 1]) : null;

  console.log();
  console.log("🛒 크몽 상세 이미지 생성기");
  console.log("=".repeat(45));

  const config = loadConfig();
  const model = config.gemini.model || "gemini-3-pro-image-preview";
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  let targets = DETAIL_IMAGES;
  if (onlyNum !== null) {
    targets = [DETAIL_IMAGES[onlyNum - 1]].filter(Boolean);
    if (targets.length === 0) {
      console.error(`\n  ❌ 이미지 ${onlyNum}번이 없습니다. (1~${DETAIL_IMAGES.length})`);
      process.exit(1);
    }
  }

  if (!force) {
    const before = targets.length;
    targets = targets.filter((t) => !fs.existsSync(path.join(OUTPUT_DIR, t.file)));
    const skipped = before - targets.length;
    if (skipped > 0) console.log(`\n  ⏭️  ${skipped}개 건너뜀 (덮어쓰기: --force)`);
  }

  if (targets.length === 0) {
    console.log("\n  ✅ 모든 이미지가 이미 존재합니다.");
    return;
  }

  console.log(`\n  🤖 모델: ${model}`);
  console.log(`  🖼️  ${targets.length}개 이미지 생성 시작\n`);

  const results = { success: [], failed: [] };

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const outputPath = path.join(OUTPUT_DIR, target.file);

    console.log(`  [${i + 1}/${targets.length}] ${target.label}...`);

    const result = await generateImage(ai, model, target.prompt, outputPath);

    if (result.success) {
      console.log(`     ✅ 완료 (${(result.size / 1024).toFixed(1)}KB)`);
      results.success.push(target.file);
    } else {
      console.log(`     ❌ 실패: ${result.error}`);
      results.failed.push(target.file);
    }

    if (i < targets.length - 1) await sleep(2000);
  }

  console.log(`\n  📊 결과: ${results.success.length}개 성공, ${results.failed.length}개 실패`);
  if (results.failed.length > 0) {
    console.log(`  ❌ 실패 파일: ${results.failed.join(", ")}`);
    process.exit(1);
  }
  console.log();
}

main().catch((err) => {
  console.error("\n❌ 오류:", err.message);
  process.exit(1);
});
