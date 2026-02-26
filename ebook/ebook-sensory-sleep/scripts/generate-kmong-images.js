const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

// API 설정 — 환경변수에서 키 로드
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, "..", "images", "kmong-listing");

const COMMON_STYLE = `
Style: Clean, modern Korean infographic design.
Color palette: lavender (#9B89B3), mint (#A8E6CF), coral (#FF8B94), warm cream (#FFF8F0), dark text (#333333).
All text must be in Korean.
Font style: Clean, rounded sans-serif (like Noto Sans KR).
Layout: Vertical, 1000x1500 pixels aspect ratio (2:3).
No photorealistic elements. Use flat illustration style with soft gradients.
`;

const detailImages = [
  {
    filename: "detail-01-intro.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Top section: Large title "코로 숨쉬고 꿈꾸는 아이" in dark purple (#9B89B3) on cream background.
Subtitle: "발달장애 아동을 위한 후각·호흡 수면 훈련 프로그램"

Middle section: A warm watercolor illustration of a child sleeping peacefully in bed with a small aroma diffuser glowing softly beside the bed. Lavender flowers and soft breath swirls around.

Bottom section: Three key stats in rounded boxes:
- "발달장애 아동 50~80% 수면 문제"
- "약물 없는 자연 수면 훈련"
- "4주 완성 프로그램"

${COMMON_STYLE}`,
  },
  {
    filename: "detail-02-target.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "이런 분들께 추천합니다" in large dark text on cream background.

Four rows, each with a cute icon on the left and text on the right:
1. (parent+child icon) "자폐, ADHD, 지적장애 아동의 부모님"
2. (tired face icon) "아이의 수면 문제로 지쳐있는 가족"
3. (leaf/nature icon) "약물 외 자연스러운 수면 훈련을 찾는 분"
4. (professional icon) "특수교육 교사, 치료사 등 전문가"

Bottom: A soft watercolor illustration of diverse parents holding their children with warm smiles. Lavender and mint color accents.

${COMMON_STYLE}`,
  },
  {
    filename: "detail-03-program.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "4주 완성 프로그램" in large dark text.

Four steps shown as a vertical timeline with connecting lines:

Step 1 (lavender circle): "1주차" - "향기와 친해지기" with small diffuser icon
Step 2 (mint circle): "2주차" - "호흡 훈련 시작" with breathing/wind icon
Step 3 (coral circle): "3주차" - "수면 루틴 만들기" with moon+stars icon
Step 4 (purple circle): "4주차" - "습관으로 굳히기" with checkmark icon

Each step has a brief description and a small cute illustration.
Arrow or flowing line connecting all 4 steps from top to bottom.
Background: soft cream with subtle gradient.

${COMMON_STYLE}`,
  },
  {
    filename: "detail-04-science.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "과학이 증명한 효과" in large dark text on cream background.

Three research result cards stacked vertically:

Card 1 (lavender background):
"라벤더 향 연구"
"입면 시간 28분 단축"
Small bar chart showing before/after comparison

Card 2 (mint background):
"호흡 훈련 연구"
"밤중 각성 42% 감소"
Small icon of a child sleeping peacefully

Card 3 (coral background):
"향기+호흡 병행"
"수면의 질 35% 향상"
Small upward trend graph

Bottom: Small text "실제 연구 논문에 기반한 프로그램입니다"
Decorative elements: small scientific icons, lavender flowers

${COMMON_STYLE}`,
  },
  {
    filename: "detail-05-cases.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "실제 적용 사례" in large dark text.

Three case study cards stacked vertically:

Card 1 (soft lavender border):
"민준이 (7세, 자폐 스펙트럼)"
Before: "잠들기까지 1시간 이상" (with sad face)
After: "20분 이내 입면" (with happy face)
Small illustration of a boy

Card 2 (soft mint border):
"서연이 (5세, 발달지연)"
Before: "밤중 3~4회 각성" (with sad face)
After: "0~1회로 감소" (with happy face)
Small illustration of a girl

Card 3 (soft coral border):
"지훈이 (10세, 지적장애)"
Before: "불규칙 수면 주기" (with sad face)
After: "매일 밤 9시 취침 성공" (with happy face)
Small illustration of a boy with grandmother

${COMMON_STYLE}`,
  },
  {
    filename: "detail-06-contents.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "전자책 구성" in large dark text on cream background.

A visual table of contents shown as a book layout:

"Part 1. 이해하기" (lavender section)
- 수면 문제 유형과 원인
- 후각·호흡의 과학적 근거

"Part 2. 4주 프로그램" (mint section)
- 1~4주차 단계별 훈련

"Part 3. 실제 사례" (coral section)
- 3가지 성공 사례

"Part 4. Q&A" (light purple section)
- FAQ 20가지 + 긴급 대처

"부록" (cream section)
- 훈련 기록지, 향기 가이드

Each section has a small representative icon.
Total: "12챕터 + 부록 4종"

${COMMON_STYLE}`,
  },
  {
    filename: "detail-07-bonus.png",
    prompt: `Create a Korean ebook product detail image (vertical infographic).

Title at top: "포함된 부록 자료" in large dark text.

Four bonus items shown as document/card mockups:

1. "일일/주간 훈련 기록지" - image of a printable checklist with checkboxes
2. "향기 선택 가이드" - image showing three essential oil bottles (lavender, orange, chamomile) with comparison chart
3. "긴급 상황 대처법" - image of a safety guide card with warning icon
4. "전문기관 네트워크" - image of a resource list with contact icons

Text at bottom: "인쇄하여 바로 사용 가능한 실용 자료"

Decorative: lavender sprigs, soft mint accents
Background: warm cream

${COMMON_STYLE}`,
  },
];

async function generateImage(imageData, index) {
  const { filename, prompt } = imageData;
  const outputPath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(outputPath)) {
    console.log(`  [${index + 1}/${detailImages.length}] Skip (exists): ${filename}`);
    return { filename, status: "skipped" };
  }

  try {
    console.log(`  [${index + 1}/${detailImages.length}] Generating: ${filename}...`);

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    let imageFound = false;
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, buffer);
          console.log(`  Saved: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
          imageFound = true;
          break;
        }
      }
    }

    if (!imageFound) {
      const textResponse = response.candidates?.[0]?.content?.parts
        ?.filter((p) => p.text)
        ?.map((p) => p.text)
        ?.join(" ");
      console.log(`  No image in response for ${filename}. Text:`, textResponse || "none");
      return { filename, status: "no_image" };
    }

    return { filename, status: "success" };
  } catch (error) {
    console.error(`  Error generating ${filename}:`, error.message);
    return { filename, status: "error", error: error.message };
  }
}

async function main() {
  console.log("===========================================");
  console.log("  크몽 상세이미지 생성");
  console.log("  (gemini-3-pro-image-preview + thinking)");
  console.log("===========================================\n");

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const forceRegenerate = process.argv.includes("--force");
  if (forceRegenerate) {
    console.log("Force regeneration mode: deleting existing files...\n");
    for (const img of detailImages) {
      const filePath = path.join(OUTPUT_DIR, img.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  console.log(`Total images to generate: ${detailImages.length}\n`);

  const results = [];
  for (let i = 0; i < detailImages.length; i++) {
    const result = await generateImage(detailImages[i], i);
    results.push(result);

    // API rate limit 방지 (5초 대기)
    if (result.status === "success" && i < detailImages.length - 1) {
      console.log("  Waiting 5s...\n");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // 결과 요약
  console.log("\n===========================================");
  console.log("  결과 요약");
  console.log("===========================================\n");

  const success = results.filter((r) => r.status === "success");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "error" || r.status === "no_image");

  console.log(`성공: ${success.length}`);
  console.log(`스킵: ${skipped.length}`);
  console.log(`실패: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n실패 항목:");
    for (const f of failed) {
      console.log(`  - ${f.filename}: ${f.error || f.status}`);
    }
  }

  console.log(`\n출력 폴더: ${OUTPUT_DIR}`);
  console.log("Done!");
}

main().catch(console.error);
