/**
 * generate-images.js
 *
 * 전자책 챕터별 이미지를 Gemini API로 자동 생성하는 스크립트
 *
 * 사용법:
 *   npm run generate-images
 *   node scripts/generate-images.js
 *   node scripts/generate-images.js --chapter 1      # 특정 챕터만 생성
 *   node scripts/generate-images.js --force           # 기존 이미지 덮어쓰기
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname 대체 (ES Module 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 경로 설정
// ============================================================
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "images", "chapters");

// ============================================================
// config.json에서 설정 읽기
// ============================================================
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ config.json 파일을 찾을 수 없습니다:", CONFIG_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config = JSON.parse(raw);

  if (!config.gemini?.apiKey) {
    console.error("❌ config.json에 gemini.apiKey가 설정되지 않았습니다.");
    process.exit(1);
  }

  return config;
}

// ============================================================
// 챕터별 이미지 프롬프트 정의
// ============================================================
const CHAPTER_PROMPTS = [
  // ── Part 1: 바이브 코딩 소개 ──
  {
    file: "chapter01.png",
    label: "Chapter 1 — AI 시대, 코딩의 새로운 패러다임",
    prompt:
      "A cute elderly person having an 'aha moment' while looking at a laptop screen with AI assistant character beside them, lightbulb glowing above their head, pastel colors, simple illustration style, warm and encouraging atmosphere, minimalist design",
  },
  {
    file: "chapter02.png",
    label: "Chapter 2 — 바이브 코딩 도구 살펴보기",
    prompt:
      "Cute comparison illustration showing traditional coding (complex machinery) vs vibe coding (simple friendly interface), elderly person choosing the simpler path, pastel colors, playful style, minimalist",
  },
  {
    file: "chapter03.png",
    label: "Chapter 3 — 바이브 코딩 마인드셋",
    prompt:
      "Multiple cute icons representing different things you can build (website, app, online store), elderly person imagining possibilities in thought bubbles, excited expression, pastel colors, simple illustration, encouraging atmosphere",
  },
  {
    file: "part1-practice.png",
    label: "Part 1 실습 — 바이브 코딩 마인드셋 점검",
    prompt:
      "A cheerful elderly person sitting at a desk with a checklist and a pen, surrounded by floating idea bubbles, warm pastel colors, simple illustration style, encouraging and reflective mood, minimalist design",
  },

  // ── Part 2: 시작하기 ──
  {
    file: "chapter04.png",
    label: "Chapter 4 — AI 도구 설치하고 첫 대화 나누기",
    prompt:
      "An elderly person installing software on a computer with a friendly AI robot helper guiding them step by step, speech bubbles showing simple instructions, pastel colors, warm and patient atmosphere, simple illustration style",
  },
  {
    file: "chapter05.png",
    label: "Chapter 5 — 나의 첫 웹페이지 만들기",
    prompt:
      "An elderly person proudly looking at their first simple webpage on a laptop screen, the webpage showing a colorful hello world page, confetti and celebration atmosphere, pastel colors, simple illustration style, achievement feeling",
  },
  {
    file: "chapter06.png",
    label: "Chapter 6 — 만든 것을 인터넷에 공개하기",
    prompt:
      "An elderly person pressing a big friendly 'publish' button, their webpage flying out to the world represented by a cute globe with smiling faces, pastel colors, simple illustration style, exciting and proud atmosphere",
  },
  {
    file: "part2-practice.png",
    label: "Part 2 실습 — 첫 웹페이지 완성하기",
    prompt:
      "An elderly person showing their completed webpage on a tablet to friends, everyone smiling and impressed, pastel colors, simple illustration style, warm community atmosphere, minimalist design",
  },

  // ── Part 3: 프로젝트 실전 ──
  {
    file: "chapter07.png",
    label: "Chapter 7 — 실전 프로젝트 시작",
    prompt:
      "An elderly person at a workbench with building blocks assembling a miniature website, blueprints and sketches around them, AI robot assistant handing tools, pastel colors, simple illustration style, creative workshop atmosphere",
  },
  {
    file: "chapter08.png",
    label: "Chapter 8 — 기능 추가하기",
    prompt:
      "An elderly person adding colorful puzzle pieces to a growing web application, each piece representing a feature (form, button, image), AI assistant suggesting next piece, pastel colors, simple illustration style, progress feeling",
  },
  {
    file: "chapter09.png",
    label: "Chapter 9 — 디자인 다듬기",
    prompt:
      "An elderly person painting and decorating a webpage on an easel like an artist, color palette and brushes nearby, before/after comparison showing improvement, pastel colors, simple illustration style, artistic atmosphere",
  },
  {
    file: "chapter10.png",
    label: "Chapter 10 — 사용자 피드백 반영하기",
    prompt:
      "An elderly person reading feedback cards from happy users, making adjustments on laptop with AI assistant, speech bubbles with hearts and thumbs up, pastel colors, simple illustration style, responsive and caring atmosphere",
  },
  {
    file: "part3-practice.png",
    label: "Part 3 실습 — 프로젝트 완성하기",
    prompt:
      "An elderly person standing proudly next to their completed project displayed on a big screen, trophy and completion badge nearby, AI assistant celebrating together, pastel colors, simple illustration style, achievement atmosphere",
  },

  // ── Part 4: 수익화 ──
  {
    file: "chapter11.png",
    label: "Chapter 11 — 수익화 전략",
    prompt:
      "An elderly person studying a friendly roadmap with multiple paths to revenue (ads, subscription, digital products), each path illustrated with cute icons, pastel colors, simple illustration style, strategic planning atmosphere",
  },
  {
    file: "chapter12.png",
    label: "Chapter 12 — 첫 수익 만들기",
    prompt:
      "An elderly person receiving their first online payment notification on phone, surprised and happy expression, small coins and dollar signs floating around, AI assistant giving thumbs up, pastel colors, simple illustration style, milestone celebration",
  },
  {
    file: "chapter13.png",
    label: "Chapter 13 — 마케팅 기초",
    prompt:
      "An elderly person using a megaphone made of laptop, social media icons and audience gathering around, friendly and approachable marketing scene, pastel colors, simple illustration style, growing community atmosphere",
  },
  {
    file: "chapter14.png",
    label: "Chapter 14 — 수익 확장하기",
    prompt:
      "An elderly person watering a small money tree that is growing bigger, multiple projects branching out like leaves, upward growth chart in background, pastel colors, simple illustration style, nurturing and growth atmosphere",
  },
  {
    file: "part4-practice.png",
    label: "Part 4 실습 — 수익화 계획 세우기",
    prompt:
      "An elderly person writing a business plan on a whiteboard with colorful sticky notes, calculator and charts nearby, AI assistant organizing ideas, pastel colors, simple illustration style, productive planning atmosphere",
  },

  // ── Part 5: 지속 성장 ──
  {
    file: "chapter15.png",
    label: "Chapter 15 — 자동화와 효율",
    prompt:
      "An elderly person relaxing in a chair while friendly robots handle various tasks (emails, updates, monitoring) on multiple screens, peaceful and efficient atmosphere, pastel colors, simple illustration style",
  },
  {
    file: "chapter16.png",
    label: "Chapter 16 — 커뮤니티 만들기",
    prompt:
      "An elderly person at the center of a growing community circle, people of different ages connected by lines, sharing and helping each other, warm group atmosphere, pastel colors, simple illustration style",
  },
  {
    file: "chapter17.png",
    label: "Chapter 17 — 장기적 비전",
    prompt:
      "An elderly person standing on a hilltop looking at a bright horizon with multiple successful projects visible as buildings in a cute city, sunrise symbolizing new beginnings, pastel colors, simple illustration style, hopeful and inspiring atmosphere",
  },
  {
    file: "part5-practice.png",
    label: "Part 5 실습 — 성장 로드맵 만들기",
    prompt:
      "An elderly person drawing a long winding road on a map leading to a star, milestones marked along the path, AI assistant as travel companion, pastel colors, simple illustration style, journey and adventure atmosphere",
  },
];

// ============================================================
// 프로그레스 바 표시
// ============================================================
function showProgress(current, total, label) {
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const percent = Math.round((current / total) * 100);

  // 한 줄에 덮어쓰기 (\r)
  process.stdout.write(`\r  [${bar}] ${percent}% (${current}/${total}) ${label}`);

  // 마지막이면 줄바꿈
  if (current === total) {
    console.log();
  }
}

// ============================================================
// 대기 함수 (Rate limit 방지)
// ============================================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 단일 이미지 생성 (재시도 로직 포함)
// ============================================================
async function generateImage(ai, prompt, outputPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      // 응답에서 이미지 데이터 추출
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        throw new Error("응답에 parts가 없습니다.");
      }

      // inlineData가 포함된 part 찾기
      const imagePart = parts.find((part) => part.inlineData);
      if (!imagePart) {
        throw new Error("응답에 이미지 데이터가 없습니다.");
      }

      // base64 → 파일로 저장
      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);

      return { success: true };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        return { success: false, error: error.message };
      }

      // 재시도 전 대기 (지수 백오프: 2초, 4초, 8초)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(
        `\n  ⚠️  시도 ${attempt}/${maxRetries} 실패: ${error.message}`
      );
      console.log(`     ${waitTime / 1000}초 후 재시도...`);
      await sleep(waitTime);
    }
  }
}

// ============================================================
// CLI 인자 파싱
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { chapter: null, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chapter" && args[i + 1]) {
      options.chapter = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") {
      options.force = true;
    }
  }

  return options;
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  console.log();
  console.log("📖 바이브 코딩 전자책 — 챕터 이미지 생성기");
  console.log("=".repeat(50));

  // 설정 로드
  const config = loadConfig();
  console.log(`\n  📂 출력 폴더: ${OUTPUT_DIR}`);

  // CLI 옵션 파싱
  const options = parseArgs();

  // 출력 디렉토리 확인
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("  📁 출력 폴더를 생성했습니다.");
  }

  // Gemini API 클라이언트 초기화
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  // 생성할 챕터 필터링
  let targets = CHAPTER_PROMPTS;
  if (options.chapter !== null) {
    // --chapter N 옵션: 해당 번호의 챕터만 생성
    const chapterFile = `chapter${String(options.chapter).padStart(2, "0")}.png`;
    targets = CHAPTER_PROMPTS.filter((p) => p.file === chapterFile);

    if (targets.length === 0) {
      console.error(`\n  ❌ Chapter ${options.chapter}에 해당하는 프롬프트가 없습니다.`);
      process.exit(1);
    }
    console.log(`\n  🎯 Chapter ${options.chapter}만 생성합니다.`);
  }

  // 이미 존재하는 이미지 건너뛰기 (--force가 아닌 경우)
  if (!options.force) {
    const before = targets.length;
    targets = targets.filter((t) => {
      const filePath = path.join(OUTPUT_DIR, t.file);
      return !fs.existsSync(filePath);
    });
    const skipped = before - targets.length;
    if (skipped > 0) {
      console.log(`\n  ⏭️  이미 존재하는 이미지 ${skipped}개를 건너뜁니다. (덮어쓰기: --force)`);
    }
  }

  if (targets.length === 0) {
    console.log("\n  ✅ 생성할 이미지가 없습니다. 모든 이미지가 이미 존재합니다.");
    return;
  }

  console.log(`\n  🖼️  총 ${targets.length}개의 이미지를 생성합니다.\n`);

  // 결과 추적
  const results = { success: [], failed: [] };

  // 순차적으로 이미지 생성
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const outputPath = path.join(OUTPUT_DIR, target.file);

    showProgress(i, targets.length, target.label);

    const result = await generateImage(ai, target.prompt, outputPath);

    if (result.success) {
      results.success.push(target.file);
    } else {
      results.failed.push({ file: target.file, error: result.error });
      console.log(`\n  ❌ 실패: ${target.file} — ${result.error}`);
    }

    // 마지막 이미지가 아니면 1초 대기 (Rate limit 방지)
    if (i < targets.length - 1) {
      await sleep(1000);
    }
  }

  // 프로그레스 바 완료 표시
  showProgress(targets.length, targets.length, "완료!");

  // ── 결과 요약 ──
  console.log();
  console.log("=".repeat(50));
  console.log("📊 생성 결과 요약");
  console.log("=".repeat(50));

  if (results.success.length > 0) {
    console.log(`\n  ✅ 성공: ${results.success.length}개`);
    results.success.forEach((file) => {
      console.log(`     └─ ${file}`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n  ❌ 실패: ${results.failed.length}개`);
    results.failed.forEach(({ file, error }) => {
      console.log(`     └─ ${file}: ${error}`);
    });
  }

  console.log(
    `\n  📈 총 ${targets.length}개 중 ${results.success.length}개 성공, ${results.failed.length}개 실패`
  );
  console.log();

  // 실패가 있으면 종료 코드 1
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

// 실행
main().catch((error) => {
  console.error("\n❌ 예상치 못한 오류:", error.message);
  process.exit(1);
});
