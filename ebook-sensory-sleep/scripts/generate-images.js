const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// API 설정
const GEMINI_API_KEY = "***REMOVED***";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 스타일 가이드 (모든 프롬프트에 공통 적용)
const STYLE_GUIDE = `
Style: Soft, warm watercolor illustration style.
Color palette: Pastel tones - lavender (#9B89B3), mint (#A8E6CF), peach (#FFD3B6), coral (#FF8B94).
Mood: Gentle, nurturing, safe, and hopeful.
Characters: Simple, rounded, friendly figures (no detailed facial features - use soft suggestions).
Background: Minimal, clean, with soft gradient washes.
Format: Horizontal, suitable for book illustration.
No text or words in the image.
`;

// 12개 챕터 일러스트 프롬프트
const chapterPrompts = {
  "01": {
    filename: "chapter01.png",
    dir: "chapter-illustrations",
    prompt: `A child tossing and turning in bed at night, unable to sleep. A tired but loving parent sits beside the bed, gently watching over the child. Soft moonlight through a window. The room feels warm but the child is restless. ${STYLE_GUIDE}`,
  },
  "02": {
    filename: "chapter02.png",
    dir: "chapter-illustrations",
    prompt: `A whimsical, educational illustration showing the connection between nose, lungs, and brain. Gentle flowing lines connect a cute nose to a simplified brain, with small flower-like scent particles floating along the path. Warm and friendly scientific feel. ${STYLE_GUIDE}`,
  },
  "03": {
    filename: "chapter03.png",
    dir: "chapter-illustrations",
    prompt: `A reassuring illustration combining science and nature. Lavender flowers on one side, a peacefully sleeping child on the other, connected by soft flowing lines suggesting research and evidence. A gentle upward graph line suggesting improvement. ${STYLE_GUIDE}`,
  },
  "04": {
    filename: "chapter04.png",
    dir: "chapter-illustrations",
    prompt: `A cozy preparation scene: an essential oil diffuser, small bottles of oils, bubble wands, a feather, and a pinwheel arranged neatly on a soft surface. A checklist with checkmarks nearby. Warm, organized, inviting atmosphere. ${STYLE_GUIDE}`,
  },
  "05": {
    filename: "chapter05.png",
    dir: "chapter-illustrations",
    prompt: `A curious child leaning forward to smell something wonderful from a small diffuser. Expression of discovery and delight. Soft scent particles (like tiny flowers or sparkles) floating from the diffuser toward the child. Parent watching with a warm smile nearby. ${STYLE_GUIDE}`,
  },
  "06": {
    filename: "chapter06.png",
    dir: "chapter-illustrations",
    prompt: `A parent and child sitting together, blowing bubbles. The child is focused on making a big bubble by blowing slowly. A diffuser is nearby with soft scent particles in the air. Warm evening lighting. Playful but calm atmosphere. ${STYLE_GUIDE}`,
  },
  "07": {
    filename: "chapter07.png",
    dir: "chapter-illustrations",
    prompt: `A bedtime routine scene: a child in pajamas lying in bed with a small stuffed animal on their belly (for belly breathing). A diffuser glowing softly nearby. Warm dim lighting. The child looks relaxed and ready for sleep. A visual timeline/sequence of bedtime steps shown as small icons. ${STYLE_GUIDE}`,
  },
  "08": {
    filename: "chapter08.png",
    dir: "chapter-illustrations",
    prompt: `A child peacefully sleeping in bed, with a soft smile. A parent peeking through a slightly open door with a relieved, happy expression. A diffuser glowing softly. Stars and a crescent moon visible through the window. Deep sense of peace and accomplishment. ${STYLE_GUIDE}`,
  },
  "09": {
    filename: "chapter09.png",
    dir: "chapter-illustrations",
    prompt: `A 5-year-old boy (Minjun) happily approaching a diffuser with curiosity. Visual cards showing bedtime routine steps are on the wall behind him. A mandarin orange and a balloon are nearby. Warm, hopeful atmosphere showing transformation. ${STYLE_GUIDE}`,
  },
  "10": {
    filename: "chapter10.png",
    dir: "chapter-illustrations",
    prompt: `An energetic 8-year-old girl (Seoyeon) blowing bubbles during a "scent party". She has a focused, happy expression. Star stickers on a chart visible in the background. A chamomile flower motif. Transition from energy to calm. ${STYLE_GUIDE}`,
  },
  "11": {
    filename: "chapter11.png",
    dir: "chapter-illustrations",
    prompt: `A 10-year-old boy (Jihoon) cuddled in grandmother's arms, both doing breathing together. A color-coded daily schedule (yellow, orange, purple sections) on the wall. A cedar wood and lavender scent motif. Deep sense of comfort and safety. ${STYLE_GUIDE}`,
  },
  "12": {
    filename: "chapter12.png",
    dir: "chapter-illustrations",
    prompt: `Five friendly professional figures (therapist, doctor, sleep specialist, teacher, psychologist) arranged in a warm circle, each offering a gentle hand or a kind gesture. Speech bubbles with heart symbols (no text). Collaborative, supportive atmosphere. ${STYLE_GUIDE}`,
  },
};

// 다이어그램 프롬프트 (주요 다이어그램)
const diagramPrompts = {
  "cover": {
    filename: "cover.png",
    dir: "chapter-illustrations",
    prompt: `Book cover illustration: A child sleeping peacefully in bed, surrounded by soft lavender flowers and gentle breath-like swirls. A diffuser emitting soft light nearby. Title area at top (leave blank space for text). Dreamy, magical nighttime atmosphere. Colors: deep purple sky, lavender, mint, peach accents. ${STYLE_GUIDE}`,
  },
};

async function generateImage(promptData, key) {
  const { filename, dir, prompt } = promptData;
  const outputDir = path.join(__dirname, "..", "images", dir);
  const outputPath = path.join(outputDir, filename);

  // 이미 존재하면 건너뛰기
  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  Skip (exists): ${dir}/${filename}`);
    return { key, status: "skipped", path: outputPath };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ["image", "text"],
      },
    });

    console.log(`🎨 Generating: ${dir}/${filename}...`);

    const response = await model.generateContent(prompt);
    const result = response.response;

    // 이미지 파트 찾기
    let imageFound = false;
    if (result.candidates && result.candidates[0]) {
      const parts = result.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");

          // 디렉토리 확인
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          fs.writeFileSync(outputPath, buffer);
          console.log(`✅ Saved: ${dir}/${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
          imageFound = true;
          break;
        }
      }
    }

    if (!imageFound) {
      console.log(`⚠️  No image in response for ${filename}. Text response:`, result.text?.() || "none");
      return { key, status: "no_image", path: null };
    }

    return { key, status: "success", path: outputPath };
  } catch (error) {
    console.error(`❌ Error generating ${filename}:`, error.message);
    return { key, status: "error", error: error.message, path: null };
  }
}

async function main() {
  console.log("===========================================");
  console.log("  후각·호흡 수면 훈련 전자책 이미지 생성기");
  console.log("===========================================\n");

  const forceRegenerate = process.argv.includes("--force");
  const specificChapter = process.argv.find((arg) => arg.startsWith("--chapter="));

  // 모든 프롬프트 합치기
  const allPrompts = { ...chapterPrompts, ...diagramPrompts };

  // 특정 챕터만 생성
  let promptsToGenerate = allPrompts;
  if (specificChapter) {
    const chapterNum = specificChapter.split("=")[1].padStart(2, "0");
    if (allPrompts[chapterNum]) {
      promptsToGenerate = { [chapterNum]: allPrompts[chapterNum] };
    } else {
      console.error(`Chapter ${chapterNum} not found.`);
      process.exit(1);
    }
  }

  // 강제 재생성 시 기존 파일 무시
  if (forceRegenerate) {
    console.log("🔄 Force regeneration mode: existing files will be overwritten.\n");
    for (const [key, data] of Object.entries(promptsToGenerate)) {
      const filePath = path.join(__dirname, "..", "images", data.dir, data.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  const keys = Object.keys(promptsToGenerate);
  console.log(`📋 Total images to process: ${keys.length}\n`);

  const results = [];

  // 순차 실행 (API rate limit 고려)
  for (const key of keys) {
    const result = await generateImage(promptsToGenerate[key], key);
    results.push(result);

    // API rate limit 방지 (2초 대기)
    if (result.status === "success") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // 결과 요약
  console.log("\n===========================================");
  console.log("  생성 결과 요약");
  console.log("===========================================\n");

  const success = results.filter((r) => r.status === "success");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "error" || r.status === "no_image");

  console.log(`✅ 성공: ${success.length}개`);
  console.log(`⏭️  건너뜀 (이미 존재): ${skipped.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);

  if (failed.length > 0) {
    console.log("\n실패한 항목:");
    for (const f of failed) {
      console.log(`  - ${f.key}: ${f.error || f.status}`);
    }
  }

  console.log("\n🎉 이미지 생성 완료!");
}

main().catch(console.error);
