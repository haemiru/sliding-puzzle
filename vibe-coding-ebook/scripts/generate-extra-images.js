/**
 * generate-extra-images.js
 *
 * 전자책 챕터별 추가 이미지 45개를 Gemini API로 자동 생성하는 스크립트
 * 기존 generate-images.js와 동일한 패턴 사용
 *
 * 사용법:
 *   node scripts/generate-extra-images.js
 *   node scripts/generate-extra-images.js --force     # 기존 이미지 덮어쓰기
 *   node scripts/generate-extra-images.js --batch 1   # 배치 1만 실행 (1-15)
 *   node scripts/generate-extra-images.js --batch 2   # 배치 2만 실행 (16-30)
 *   node scripts/generate-extra-images.js --batch 3   # 배치 3만 실행 (31-45)
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config.json");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "images", "chapters");

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
// 45개 추가 이미지 프롬프트 정의
// ============================================================
const EXTRA_PROMPTS = [
  // ── Part 1: ch01 (3개) ──
  {
    file: "ch01-compare.png",
    label: "Ch01 — 전통 코딩 vs 바이브 코딩 비교",
    prompt:
      "Split comparison illustration: left side shows a stressed person surrounded by complex code and error messages in dark colors, right side shows a happy elderly person chatting with a friendly AI robot in bright pastel colors. Clear dividing line between both sides. Simple flat illustration style, warm and encouraging, minimalist design, no text",
  },
  {
    file: "ch01-timeline.png",
    label: "Ch01 — 코딩 진입장벽 타임라인",
    prompt:
      "Timeline infographic illustration showing coding evolution: 2015 (many barriers, thick wall with books), 2020 (wall getting smaller), 2025 (no wall, open door with AI assistant welcoming). Pastel colors, simple flat illustration style, hopeful progression, minimalist design, no text",
  },
  {
    file: "ch01-cooking.png",
    label: "Ch01 — 요리 비유 시각화",
    prompt:
      "Three-panel illustration: Panel 1 - person struggling with raw ingredients and complex recipe (traditional cooking). Panel 2 - person happily using a meal kit with pre-cut ingredients. Panel 3 - friendly chef robot assistant helping beside them. Pastel colors, cute simple style, warm kitchen atmosphere, no text",
  },

  // ── Part 1: ch02 (3개) ──
  {
    file: "ch02-error.png",
    label: "Ch02 — 코드 에러 좌절 장면",
    prompt:
      "A frustrated elderly person at a computer screen full of red error messages and warning signs, crumpled papers around, contrasted with a second scene where the same person smiles as AI fixes errors with a magic wand. Split before/after composition, pastel colors, simple illustration style, no text",
  },
  {
    file: "ch02-speed.png",
    label: "Ch02 — 속도 비교 인포그래픽",
    prompt:
      "Visual comparison showing two paths: a long winding road with obstacles labeled with time markers (weeks, months) for traditional coding, versus a short straight highway with a rocket for vibe coding. An elderly person choosing the fast path. Pastel colors, simple flat infographic style, cheerful, no text",
  },
  {
    file: "ch02-driving.png",
    label: "Ch02 — 자율주행 비유",
    prompt:
      "Two-panel illustration: Left panel shows a person struggling with manual transmission car (gears, clutch, sweat drops). Right panel shows same person relaxing in a self-driving car, just saying the destination. Cute car designs, pastel colors, simple illustration style, no text",
  },

  // ── Part 1: ch03 (3개) ──
  {
    file: "ch03-latestart.png",
    label: "Ch03 — 늦은 시작 성공 사례",
    prompt:
      "Portrait gallery of three inspirational elderly entrepreneurs at different ages (52, 62, 65), each standing proudly next to their successful business icons (restaurant, shop, digital product). Timeline showing 'start age' with upward arrows. Pastel colors, simple illustration style, inspiring atmosphere, no text",
  },
  {
    file: "ch03-experience.png",
    label: "Ch03 — 경험에서 아이디어로 전환",
    prompt:
      "An elderly person's head in profile with thought bubbles showing life experiences (cooking, hiking, office work, parenting) transforming into digital product ideas (recipe app, trail guide, productivity tool, education site) via arrows. Pastel colors, simple illustration style, creative transformation concept, no text",
  },
  {
    file: "ch03-seed.png",
    label: "Ch03 — 씨앗에서 정원으로 성장",
    prompt:
      "Four-stage growth illustration: tiny seed in small pot, small sprout, growing plant with flowers, full beautiful garden with multiple plants. An elderly person nurturing at each stage. Pastel colors, simple illustration style, hopeful growth metaphor, no text",
  },

  // ── Part 2: ch04 (3개) ──
  {
    file: "ch04-claude.png",
    label: "Ch04 — Claude 가입 화면 안내",
    prompt:
      "A friendly AI assistant character (cute robot with warm eyes) holding a welcome sign, standing next to a simplified signup form with email and password fields. Step-by-step numbered arrows (1, 2, 3) showing the process. Pastel colors, simple illustration style, welcoming atmosphere, no text in fields",
  },
  {
    file: "ch04-cursor.png",
    label: "Ch04 — Cursor 인터페이스",
    prompt:
      "A simplified code editor interface with a friendly AI chat panel on the right side. The chat shows a conversation bubble between a person icon and an AI robot icon. Code on the left, conversation on the right. Clean, modern design, pastel colors, simple illustration style, no real code text",
  },
  {
    file: "ch04-conversation.png",
    label: "Ch04 — AI 대화 예시",
    prompt:
      "Chat conversation illustration showing an elderly person asking questions (speech bubbles on left) and a friendly AI robot responding helpfully (speech bubbles on right). Three exchange rounds shown vertically. Hearts and lightbulb icons floating around. Pastel colors, simple illustration style, friendly conversation, no text in bubbles",
  },

  // ── Part 2: ch05 (3개) ──
  {
    file: "ch05-prompt.png",
    label: "Ch05 — 프롬프트 작성 예시",
    prompt:
      "An elderly person typing on a laptop with a large speech bubble above showing a structured request (represented by organized bullet points and icons, not real text). The speech bubble transforms into a beautiful webpage preview on a screen nearby. Pastel colors, simple illustration style, creative process visualization, no text",
  },
  {
    file: "ch05-iteration.png",
    label: "Ch05 — 수정 반복 사이클",
    prompt:
      "Circular diagram showing iterative improvement cycle: Request → AI Creates → Review → Request Changes → AI Updates → Better Result. Each step shown with cute icons (person, robot, magnifying glass, arrow). The result gets better with each cycle (shown by stars increasing). Pastel colors, simple illustration style, no text",
  },
  {
    file: "ch05-template.png",
    label: "Ch05 — 구체적 프롬프트 템플릿",
    prompt:
      "Two prompt cards side by side: Left card is vague and messy (faded, crumpled), right card is detailed and organized (bright, clean with checkmarks). A friendly AI robot giving thumbs up to the right card and confused face to the left card. Pastel colors, simple illustration style, comparison concept, no text on cards",
  },

  // ── Part 2: ch06 (3개) ──
  {
    file: "ch06-deploy.png",
    label: "Ch06 — 배포 개념도",
    prompt:
      "Illustration showing a webpage flying from a laptop (labeled 'my computer' with a house icon) through the clouds to a globe (labeled 'internet' with a world icon). Dotted arrow path from laptop to globe. People around the globe accessing the webpage on their devices. Pastel colors, simple illustration style, no text",
  },
  {
    file: "ch06-netlify.png",
    label: "Ch06 — Netlify 업로드 과정",
    prompt:
      "Step-by-step illustration showing drag-and-drop deployment: Step 1 - a folder icon, Step 2 - hand dragging folder to a cloud platform, Step 3 - loading/processing animation, Step 4 - celebration with a live website URL appearing. Numbered steps with arrows. Pastel colors, simple illustration style, easy process visualization, no text",
  },
  {
    file: "ch06-domain.png",
    label: "Ch06 — 도메인 주소 비유",
    prompt:
      "Comparison illustration: a house with a street address number plate (physical address) next to a website with a domain name plate (web address). Both connected by an equals sign showing they serve the same purpose. A friendly postman/delivery robot carrying data packets. Pastel colors, simple illustration style, analogy visualization, no text on plates",
  },

  // ── Part 3: ch07 (4개) ──
  {
    file: "ch07-discomfort.png",
    label: "Ch07 — 불편함 찾기 일상",
    prompt:
      "An elderly person going through daily activities with thought bubbles showing small frustrations (waiting in line, complicated form, lost recipe, hard to find information). Each frustration has a lightbulb nearby suggesting it could become a solution. Pastel colors, simple illustration style, observational mood, no text",
  },
  {
    file: "ch07-mvp.png",
    label: "Ch07 — MVP 피라미드",
    prompt:
      "Pyramid diagram with three layers: bottom layer is 'Core Feature' (large, solid), middle layer is 'Nice to Have' (medium), top layer is 'Future Dreams' (small, translucent). An elderly person building the bottom layer first with AI assistant. Star on top. Pastel colors, simple illustration style, building blocks concept, no text",
  },
  {
    file: "ch07-menu.png",
    label: "Ch07 — 식당 메뉴 비유",
    prompt:
      "Two restaurant scenes side by side: Left shows an overwhelmed diner facing a huge 10-page menu book. Right shows a happy diner with a simple 3-item menu card with clear pictures. The simple menu restaurant is busier and more successful. Pastel colors, simple illustration style, less-is-more concept, no text on menus",
  },
  {
    file: "ch07-planning.png",
    label: "Ch07 — 프로젝트 기획서",
    prompt:
      "An elderly person at a desk with a simple project planning board: three columns (To Do, Doing, Done) with colorful sticky notes. AI robot assistant helping organize the notes. Simple whiteboard layout. Pastel colors, simple illustration style, organized planning atmosphere, no text on notes",
  },

  // ── Part 3: ch08 (3개) ──
  {
    file: "ch08-prompts.png",
    label: "Ch08 — 좋은 vs 나쁜 프롬프트",
    prompt:
      "Two-panel comparison: Left panel shows a vague request cloud (blurry, scattered dots) going to confused AI robot producing messy result. Right panel shows a clear structured request (organized dots and arrows) going to happy AI robot producing perfect result. Pastel colors, simple illustration style, clarity concept, no text",
  },
  {
    file: "ch08-features.png",
    label: "Ch08 — 기능 추가 순서도",
    prompt:
      "Flowchart showing step-by-step feature addition: Start with base (simple house), add feature 1 (door), add feature 2 (windows), add feature 3 (roof decoration). Each step shows the product growing more complete. Numbered steps with arrows. Pastel colors, simple illustration style, progressive building concept, no text",
  },
  {
    file: "ch08-error.png",
    label: "Ch08 — 에러 해결 플로우",
    prompt:
      "Three-step error resolution flow: Step 1 - red warning sign appears on screen (problem). Step 2 - person copies error and shows to AI robot (communication). Step 3 - AI robot fixes with wrench tool, green checkmark appears (solution). Arrows connecting steps. Pastel colors, simple illustration style, problem-solving process, no text",
  },

  // ── Part 3: ch09 (3개) ──
  {
    file: "ch09-colors.png",
    label: "Ch09 — 색상/폰트 변경 전후",
    prompt:
      "Before/after website design comparison: Left shows a dull, gray, poorly designed webpage. Right shows the same layout transformed with harmonious colors, better fonts, and visual hierarchy. Arrow between them with a paint palette icon. Pastel colors, simple illustration style, dramatic improvement, no text on pages",
  },
  {
    file: "ch09-layout.png",
    label: "Ch09 — 레이아웃 개선",
    prompt:
      "Before/after layout comparison: Left shows a cluttered webpage with elements cramped together, no spacing. Right shows the same content with proper spacing, alignment, and visual breathing room. An elderly person admiring the improved version. Pastel colors, simple illustration style, clean design concept, no text on pages",
  },
  {
    file: "ch09-responsive.png",
    label: "Ch09 — 반응형 디자인 3화면",
    prompt:
      "Three devices showing the same website adapting: large desktop monitor, medium tablet, small smartphone. Each shows the same content rearranged to fit perfectly. Arrows between devices showing the responsive transformation. Pastel colors, simple illustration style, adaptive design concept, no text on screens",
  },

  // ── Part 3: ch10 (3개) ──
  {
    file: "ch10-network.png",
    label: "Ch10 — 피드백 대상자 네트워크",
    prompt:
      "An elderly person in the center connected to 5 different people around them (family member, friend, colleague, neighbor, online community member). Each person has a speech bubble with different feedback icons (star, heart, question mark, lightbulb, thumbs up). Network/connection lines between them. Pastel colors, simple illustration style, feedback network, no text",
  },
  {
    file: "ch10-sort.png",
    label: "Ch10 — 피드백 분류법",
    prompt:
      "Three colorful baskets/boxes for sorting feedback: Green basket (important - do now) with urgent icons, Yellow basket (later - do next) with clock icons, Gray basket (ignore - skip) with X icons. Feedback cards being sorted into each basket by an elderly person. Pastel colors, simple illustration style, organization concept, no text on cards",
  },
  {
    file: "ch10-priority.png",
    label: "Ch10 — 개선 우선순위",
    prompt:
      "Priority matrix diagram: vertical axis shows impact (low to high), horizontal axis shows effort (easy to hard). Four quadrants with different items placed in each. The top-left quadrant (high impact, easy) is highlighted with a star as 'Do First'. An elderly person pointing at it. Pastel colors, simple illustration style, decision-making tool, no text labels",
  },

  // ── Part 4: ch11 (3개) ──
  {
    file: "ch11-models.png",
    label: "Ch11 — 4가지 수익 모델 아이콘",
    prompt:
      "Four distinct revenue model icons arranged in a 2x2 grid: Top-left: newspaper with coins (ad revenue), Top-right: calendar with recurring arrows (subscription), Bottom-left: shopping bag with price tag (one-time sale), Bottom-right: lock becoming unlocked (freemium). Each icon in its own pastel-colored card. Simple flat illustration style, business concept, no text",
  },
  {
    file: "ch11-combine.png",
    label: "Ch11 — 수익 모델 조합",
    prompt:
      "Puzzle pieces fitting together, each piece representing a different revenue stream (different colors and icons). An elderly person assembling the puzzle to create a complete revenue picture. Some pieces already connected, some being placed. Pastel colors, simple illustration style, strategic combination concept, no text",
  },
  {
    file: "ch11-pricing.png",
    label: "Ch11 — 가격 기준",
    prompt:
      "Balance scale illustration: one side has the product/service (represented by a gift box), the other side has coins/money. The scale is balanced, showing fair pricing. Around it, small icons showing value factors (time saved, quality, uniqueness). An elderly person adjusting the balance. Pastel colors, simple illustration style, value-based pricing concept, no text",
  },

  // ── Part 4: ch12 (3개) ──
  {
    file: "ch12-payment.png",
    label: "Ch12 — 결제 플로우",
    prompt:
      "Simple payment flow diagram: Customer (person icon) → clicks buy button → payment form appears → card processed (shield with checkmark) → confirmation (envelope with receipt) → happy merchant (elderly person) receives notification on phone. Connected by arrows. Pastel colors, simple illustration style, secure and trustworthy, no text",
  },
  {
    file: "ch12-customers.png",
    label: "Ch12 — 고객 획득 경로",
    prompt:
      "Funnel diagram showing customer acquisition: Wide top (many people hearing about product through social media, word of mouth, search), narrowing middle (people visiting website, trying free version), narrow bottom (paying customers with hearts). Numbers decreasing but engagement increasing. Pastel colors, simple illustration style, marketing funnel, no text",
  },
  {
    file: "ch12-pricing.png",
    label: "Ch12 — 3단계 가격표",
    prompt:
      "Three pricing tier cards side by side: Basic (small plant icon, few features), Standard (medium tree icon, more features, highlighted as popular with a ribbon), Premium (large tree with fruits icon, all features). Each card has different heights showing increasing value. Pastel colors, simple illustration style, tiered pricing, no text on cards",
  },

  // ── Part 4: ch13 (3개) ──
  {
    file: "ch13-sns.png",
    label: "Ch13 — SNS 플랫폼 비교",
    prompt:
      "Four social media platform representations as friendly characters: Camera character (Instagram/visual), Writing pad character (Blog/text), Play button character (YouTube/video), Bird character (Twitter/short messages). Each has strengths shown by small icons around them. Pastel colors, simple illustration style, platform personality concept, no text",
  },
  {
    file: "ch13-content.png",
    label: "Ch13 — 콘텐츠 마케팅 예시",
    prompt:
      "Content creation cycle illustration: An elderly person creating content (writing, photographing, recording) → content pieces flowing out to multiple platforms → audience growing → audience becoming customers → customers providing ideas for new content. Circular flow with arrows. Pastel colors, simple illustration style, content flywheel, no text",
  },
  {
    file: "ch13-community.png",
    label: "Ch13 — 커뮤니티 네트워크",
    prompt:
      "Growing community network illustration: center person (elderly entrepreneur) connected to first ring of 5 people, each of those connected to their own circles. The network expands outward like ripples in water. Some connections highlighted showing active engagement. Pastel colors, simple illustration style, organic growth, no text",
  },

  // ── Part 5: ch15 (2개) ──
  {
    file: "ch15-manual-auto.png",
    label: "Ch15 — 수동 vs 자동 비교",
    prompt:
      "Two-panel comparison: Left panel shows an exhausted person manually doing many tasks (answering emails, updating website, checking data) with many arms like an octopus. Right panel shows a relaxed person in a chair while friendly robots handle all the same tasks automatically. Dramatic contrast. Pastel colors, simple illustration style, no text",
  },
  {
    file: "ch15-chatbot.png",
    label: "Ch15 — 챗봇 응대 플로우",
    prompt:
      "Customer support flow: Multiple customer icons sending questions (question mark bubbles) → AI chatbot robot in the center answering most questions automatically (80% with checkmarks) → only a few complex questions passed to the human operator (20% with forwarding arrows). Efficient system visualization. Pastel colors, simple illustration style, no text",
  },

  // ── Part 5: ch16 (2개) ──
  {
    file: "ch16-loyalty.png",
    label: "Ch16 — 고객 충성도 단계",
    prompt:
      "Staircase/ladder diagram showing customer loyalty stages: Step 1 - Stranger (gray person), Step 2 - Visitor (light colored), Step 3 - Customer (warmer color), Step 4 - Loyal Fan (bright color with heart), Step 5 - Advocate (brightest with megaphone). Each step higher and brighter. Pastel colors, simple illustration style, progression concept, no text",
  },
  {
    file: "ch16-growth.png",
    label: "Ch16 — 커뮤니티 성장 타임라인",
    prompt:
      "Timeline showing community growth: Month 1 (5 people in a small circle), Month 3 (15 people in a medium circle), Month 6 (50 people in a larger circle with sub-groups), Month 12 (100+ people in a vibrant community with events and activities). Each stage shown as a growing garden. Pastel colors, simple illustration style, organic growth, no text",
  },

  // ── Part 5: ch17 (2개) ──
  {
    file: "ch17-marathon.png",
    label: "Ch17 — 마라톤 페이스 비유",
    prompt:
      "Marathon race illustration: One runner sprinting fast at the start but collapsed at halfway mark. Another runner (elderly person) maintaining steady pace, passing the collapsed sprinter, reaching the finish line with energy remaining. Road with distance markers. Pastel colors, simple illustration style, sustainability concept, no text",
  },
  {
    file: "ch17-future.png",
    label: "Ch17 — 밝은 미래 비전",
    prompt:
      "An elderly person standing at a hilltop sunrise, looking at a bright horizon. Behind them is a path showing their journey (small projects growing into bigger ones). Ahead is a beautiful city of possibilities with multiple successful digital businesses as buildings. Rainbow and warm light. Pastel colors, simple illustration style, hopeful and inspiring, no text",
  },
];

// ============================================================
// 유틸리티 함수들
// ============================================================
function showProgress(current, total, label) {
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const percent = Math.round((current / total) * 100);
  process.stdout.write(
    `\r  [${bar}] ${percent}% (${current}/${total}) ${label}`
  );
  if (current === total) console.log();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("응답에 parts가 없습니다.");

      const imagePart = parts.find((part) => part.inlineData);
      if (!imagePart) throw new Error("응답에 이미지 데이터가 없습니다.");

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(
        `\n  ⚠️  시도 ${attempt}/${maxRetries} 실패: ${error.message}`
      );
      console.log(`     ${waitTime / 1000}초 후 재시도...`);
      await sleep(waitTime);
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { force: false, batch: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") options.force = true;
    if (args[i] === "--batch" && args[i + 1]) {
      options.batch = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return options;
}

// ============================================================
// 메인 실행
// ============================================================
async function main() {
  console.log();
  console.log("📖 바이브 코딩 전자책 — 추가 이미지 생성기 (45개)");
  console.log("=".repeat(50));

  const config = loadConfig();
  const options = parseArgs();

  console.log(`\n  📂 출력 폴더: ${OUTPUT_DIR}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("  📁 출력 폴더를 생성했습니다.");
  }

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  // 배치 필터링
  let targets = [...EXTRA_PROMPTS];
  if (options.batch !== null) {
    const batchSize = 15;
    const start = (options.batch - 1) * batchSize;
    const end = start + batchSize;
    targets = targets.slice(start, end);
    console.log(
      `\n  🎯 배치 ${options.batch} (${start + 1}~${Math.min(end, EXTRA_PROMPTS.length)}번) 실행`
    );
  }

  // 기존 이미지 건너뛰기
  if (!options.force) {
    const before = targets.length;
    targets = targets.filter(
      (t) => !fs.existsSync(path.join(OUTPUT_DIR, t.file))
    );
    const skipped = before - targets.length;
    if (skipped > 0) {
      console.log(
        `\n  ⏭️  이미 존재하는 이미지 ${skipped}개를 건너뜁니다. (덮어쓰기: --force)`
      );
    }
  }

  if (targets.length === 0) {
    console.log(
      "\n  ✅ 생성할 이미지가 없습니다. 모든 이미지가 이미 존재합니다."
    );
    return;
  }

  console.log(`\n  🖼️  총 ${targets.length}개의 이미지를 생성합니다.\n`);

  const results = { success: [], failed: [] };

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

    if (i < targets.length - 1) {
      await sleep(1500);
    }
  }

  showProgress(targets.length, targets.length, "완료!");

  console.log();
  console.log("=".repeat(50));
  console.log("📊 생성 결과 요약");
  console.log("=".repeat(50));

  if (results.success.length > 0) {
    console.log(`\n  ✅ 성공: ${results.success.length}개`);
    results.success.forEach((file) => console.log(`     └─ ${file}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n  ❌ 실패: ${results.failed.length}개`);
    results.failed.forEach(({ file, error }) =>
      console.log(`     └─ ${file}: ${error}`)
    );
  }

  console.log(
    `\n  📈 총 ${targets.length}개 중 ${results.success.length}개 성공, ${results.failed.length}개 실패`
  );
  console.log();

  if (results.failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("\n❌ 예상치 못한 오류:", error.message);
  process.exit(1);
});
