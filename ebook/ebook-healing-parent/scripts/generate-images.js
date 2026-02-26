const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
// 설정
// ──────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  console.error("   설정 방법:");
  console.error('   - Windows: set GEMINI_API_KEY=your-api-key');
  console.error("   - macOS/Linux: export GEMINI_API_KEY=your-api-key");
  process.exit(1);
}
const MODEL = "gemini-2.0-flash-exp-image-generation";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const DELAY_MS = 5000;

const IMAGES_DIR = path.resolve(__dirname, "..", "images");
const CHAPTERS_DIR = path.join(IMAGES_DIR, "chapters");
const COVER_DIR = path.join(IMAGES_DIR, "cover");

// ──────────────────────────────────────────────
// 공통 프롬프트 접미사
// ──────────────────────────────────────────────
const STYLE_SUFFIX = [
  "Style: cute kawaii illustration with soft pastel watercolor fills and minimal clean line art.",
  "Color palette: soft coral (#F4A7A3), lavender (#C5B9E8), mint (#A8D8C8), warm cream background (#FFF8F0).",
  "Mood: warm, healing, hopeful.",
  "No text in image.",
  "High quality, clean composition, suitable for professional e-book publication.",
  "Aspect ratio 16:9.",
].join(" ");

// ──────────────────────────────────────────────
// 이미지 목록
// ──────────────────────────────────────────────
const IMAGES = [
  {
    filename: "cover.png",
    dir: COVER_DIR,
    prompt:
      "A warm and cozy scene of a parent gently holding a small child, surrounded by soft flowers and warm light. The parent looks peaceful and the child is smiling. Gentle pastel tones.",
  },
  {
    filename: "ch01-emotions.png",
    dir: CHAPTERS_DIR,
    prompt:
      "Multiple cute round characters each showing different emotions - sadness, anxiety, anger, guilt, loneliness, shame, helplessness. Each character is small and expressive with simple faces. Arranged in a friendly circle.",
  },
  {
    filename: "ch02-spiral-path.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A cute small character walking along a gentle upward spiral path. The path goes through different weather - rain, clouds, sunshine. At the top there are flowers blooming. Journey and hope concept.",
  },
  {
    filename: "ch03-comparison-escape.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A cute character climbing out of a dark swamp area into a bright colorful flower field. Butterflies around. Transformation from darkness to light. Before and after contrast.",
  },
  {
    filename: "ch04-letting-go.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A cute character who just put down a very heavy oversized backpack. The character looks relieved and light, floating slightly. Small hearts and sparkles around. Freedom concept.",
  },
  {
    filename: "ch05-first-aid-kit.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A cute character proudly holding an oversized emotional first aid kit box decorated with a heart. Inside the open box: a breathing symbol, a journal, and a small plant. Self-care tools concept.",
  },
  {
    filename: "ch06-support-circle.png",
    dir: CHAPTERS_DIR,
    prompt:
      "Multiple cute characters holding hands in a warm circle, supporting each other. Different sizes and appearances representing diversity. Warm glowing light in the center.",
  },
  {
    filename: "ch07-growing-together.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A parent character and a small child character walking together through a beautiful flower garden path. Small flowers growing along the path. Sunset warm light. Growth and journey together.",
  },
  {
    filename: "epilogue-starry-night.png",
    dir: CHAPTERS_DIR,
    prompt:
      "A parent and child sitting together on a window seat, looking out at a beautiful starry night sky. Cozy room interior. Peaceful and hopeful atmosphere. Stars twinkling.",
  },
];

// ──────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Gemini API 호출
// ──────────────────────────────────────────────
async function generateImage(promptText) {
  const fullPrompt = `${promptText} ${STYLE_SUFFIX}`;

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates in response");
  }

  const parts = data.candidates[0].content.parts;
  const imagePart = parts.find(
    (p) => p.inlineData && p.inlineData.mimeType?.startsWith("image/")
  );

  if (!imagePart) {
    throw new Error("No image data found in response parts");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
async function main() {
  console.log("=".repeat(50));
  console.log("  전자책 이미지 생성 스크립트");
  console.log('  "괜찮아, 엄마도 아프니까"');
  console.log("=".repeat(50));
  console.log();

  // 디렉토리 생성
  ensureDir(CHAPTERS_DIR);
  ensureDir(COVER_DIR);

  let successCount = 0;
  let failCount = 0;
  const failed = [];

  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    const outputPath = path.join(img.dir, img.filename);
    const label = `[${i + 1}/${IMAGES.length}]`;

    // 이미 존재하면 스킵
    if (fs.existsSync(outputPath)) {
      console.log(`${label} ${img.filename} — 이미 존재, 건너뜀`);
      successCount++;
      continue;
    }

    console.log(`${label} ${img.filename} — 생성 중...`);

    try {
      const imageBuffer = await generateImage(img.prompt);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`${label} ${img.filename} — 완료 (${imageBuffer.length} bytes)`);
      successCount++;
    } catch (err) {
      console.error(`${label} ${img.filename} — 실패: ${err.message}`);
      failCount++;
      failed.push(img.filename);
    }

    // 마지막 이미지가 아니면 딜레이
    if (i < IMAGES.length - 1) {
      console.log(`     ${DELAY_MS / 1000}초 대기...`);
      await sleep(DELAY_MS);
    }
  }

  // 결과 요약
  console.log();
  console.log("=".repeat(50));
  console.log("  생성 결과");
  console.log("=".repeat(50));
  console.log(`  성공: ${successCount}장`);
  console.log(`  실패: ${failCount}장`);
  if (failed.length > 0) {
    console.log(`  실패 목록: ${failed.join(", ")}`);
  }
  console.log();
}

main().catch((err) => {
  console.error("스크립트 실행 오류:", err);
  process.exit(1);
});
