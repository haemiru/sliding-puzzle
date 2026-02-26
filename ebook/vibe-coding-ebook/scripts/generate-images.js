/**
 * generate-images.js
 *
 * 전자책 핵심 이미지 13개를 Gemini 3 API로 생성하는 스크립트
 * 전문 서적 수준의 깔끔한 인포그래픽/다이어그램 스타일
 *
 * 사용법:
 *   npm run generate-images                          # 없는 이미지만 생성
 *   npm run generate-images:force                    # 모든 이미지 강제 재생성
 *   node scripts/generate-images.js --only cover     # 특정 이미지만 생성
 *   node scripts/generate-images.js --force          # 기존 이미지 덮어쓰기
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
// 공통 스타일 지침 (모든 프롬프트에 적용)
// ============================================================
const STYLE_GUIDE = `
Style requirements for ALL images:
- Clean, professional infographic/diagram style suitable for a published business book
- Color palette: primary #2C5F8D (navy blue), secondary #FF9933 (orange), accent #E74C3C (red), background white or very light gray #F8F9FA
- Flat design with minimal shadows, no 3D effects, no gradients except subtle ones
- Korean text labels where applicable, using clean sans-serif font
- High contrast, legible at small print sizes (A4 page, ~60% width)
- No cartoon characters, no clip art, no emojis — professional and authoritative
- Consistent visual language across all images
- 1024x768 resolution, landscape orientation
`.trim();

// ============================================================
// 13개 핵심 이미지 프롬프트
// ============================================================
const IMAGE_PROMPTS = [
  {
    file: "cover.png",
    label: "책 표지",
    prompt: `Create a professional book cover image for a Korean ebook titled "바이브 코딩으로 1인 사업가 되기" (Become a Solo Entrepreneur with Vibe Coding).

Design:
- Modern, clean cover with a tech-meets-entrepreneurship theme
- Central visual: a stylized laptop with code/AI elements flowing out, transforming into business icons (store, chart, money)
- Title "바이브 코딩으로 1인 사업가 되기" in large bold Korean text at the top
- Subtitle "코딩 몰라도 괜찮아요, AI가 함께 합니다" in smaller text below
- Author "J.M" at the bottom
- Color palette: deep navy (#2C5F8D) background, orange (#FF9933) accents, white text
- Professional, authoritative feel — like a bestselling business/tech book
- 1024x1024 resolution, portrait orientation`,
  },

  {
    file: "ch01-compare.png",
    label: "전통 코딩 vs 바이브 코딩 비교",
    prompt: `Create a professional comparison diagram: "전통 코딩 vs 바이브 코딩" (Traditional Coding vs Vibe Coding).

Layout: Two-column comparison with a vertical divider.

Left column "전통 코딩" (Traditional Coding):
- Icon: complex code editor with many lines of syntax
- "수개월 학습 필요" (Months of study needed)
- "프로그래밍 언어 암기" (Memorize programming languages)
- "에러 직접 디버깅" (Debug errors yourself)
- Visual tone: complex, dense, intimidating

Right column "바이브 코딩" (Vibe Coding):
- Icon: chat interface with AI assistant
- "바로 시작 가능" (Start immediately)
- "한국어로 대화" (Chat in Korean)
- "AI가 에러 해결" (AI fixes errors)
- Visual tone: simple, friendly, approachable

${STYLE_GUIDE}`,
  },

  {
    file: "ch01-timeline.png",
    label: "코딩 진입장벽 변화 타임라인",
    prompt: `Create a professional horizontal timeline diagram showing the evolution of coding accessibility from 2015 to 2025.

Timeline points:
- 2015: "전문 개발자만 가능" (Only for professional developers) — tall barrier icon
- 2018: "노코드 도구 등장" (No-code tools emerge) — medium barrier
- 2020: "GPT 시대 시작" (GPT era begins) — lower barrier
- 2023: "AI 코딩 도구 폭발" (AI coding tools explode) — very low barrier
- 2025: "누구나 바이브 코딩" (Anyone can vibe code) — no barrier, open door

Visual: descending staircase or decreasing wall height from left to right, with an arrow showing the trend. Each year marked clearly.

Title at top: "코딩 진입장벽의 변화 (2015→2025)"

${STYLE_GUIDE}`,
  },

  {
    file: "ch02-speed.png",
    label: "개발 속도 비교 차트",
    prompt: `Create a professional bar chart comparing development speed between traditional coding and vibe coding.

Chart data — time to build a simple website:
- "전통 코딩" (Traditional): tall bar showing "2~3개월" (2-3 months), colored gray
- "바이브 코딩" (Vibe Coding): short bar showing "1~2주" (1-2 weeks), colored orange (#FF9933)

Additional annotation: "약 10배 빠름!" (About 10x faster!) with an arrow between the two bars.

Below the chart, three mini-comparisons in icon form:
- "학습 시간: 수백 시간 → 수 시간" (Learning: hundreds of hours → few hours)
- "비용: 수천만원 → 거의 무료" (Cost: tens of millions won → nearly free)
- "난이도: ★★★★★ → ★☆☆☆☆" (Difficulty: 5 stars → 1 star)

Title: "개발 속도 비교"

${STYLE_GUIDE}`,
  },

  {
    file: "ch05-prompt.png",
    label: "프롬프트 → AI → 웹페이지 변환 플로우",
    prompt: `Create a professional horizontal flow diagram showing: Prompt → AI Processing → Web Page.

Three stages connected by arrows:

Stage 1 "프롬프트 작성" (Write Prompt):
- Chat bubble icon with Korean text example: "카페 메뉴판 웹사이트 만들어줘"
- Label: "한국어로 요청"

Stage 2 "AI 처리" (AI Processing):
- Brain/gear icon with code symbols flowing around it
- Label: "코드 자동 생성"
- Sub-items: HTML, CSS, JavaScript icons

Stage 3 "결과물" (Result):
- Browser window showing a clean cafe menu website
- Label: "완성된 웹페이지"

Arrow from Stage 3 back to Stage 1 labeled "수정 요청" (Request modifications) — showing the iterative loop.

Title: "프롬프트에서 웹페이지까지"

${STYLE_GUIDE}`,
  },

  {
    file: "ch06-deploy.png",
    label: "로컬 → 인터넷 배포 개념도",
    prompt: `Create a professional diagram showing the deployment concept: local computer to the internet.

Layout: Left to right flow.

Left side "내 컴퓨터" (My Computer):
- Laptop icon with a file folder labeled "my-website"
- Status: "나만 볼 수 있음" (Only I can see it)

Center "배포" (Deploy):
- Upload/rocket icon
- Arrow labeled "클릭 한 번" (One click)
- Cloud icon labeled "Netlify / Vercel"

Right side "인터넷" (Internet):
- Globe icon with a URL bar showing "mysite.netlify.app"
- Multiple user icons around the globe
- Status: "전세계 누구나 접속" (Anyone worldwide can access)

Title: "배포: 내 컴퓨터에서 인터넷으로"

${STYLE_GUIDE}`,
  },

  {
    file: "ch07-mvp.png",
    label: "MVP 피라미드 다이어그램",
    prompt: `Create a professional pyramid/triangle diagram showing MVP (Minimum Viable Product) concept.

Pyramid with 3 layers (bottom to top):

Bottom layer (largest, colored navy #2C5F8D):
- "핵심 기능" (Core Features)
- Icons: one main feature (e.g., product listing)
- Label: "반드시 필요한 것만" (Only what's absolutely necessary)

Middle layer (medium, colored orange #FF9933):
- "편의 기능" (Convenience Features)
- Icons: search, filter
- Label: "있으면 좋은 것" (Nice to have)

Top layer (smallest, colored light gray):
- "고급 기능" (Advanced Features)
- Icons: AI recommendation, analytics
- Label: "나중에 추가" (Add later)

Arrow on the side pointing to bottom layer: "여기서 시작!" (Start here!)

Title: "MVP — 최소 기능 제품"

${STYLE_GUIDE}`,
  },

  {
    file: "ch08-features.png",
    label: "기능 추가 우선순위 다이어그램",
    prompt: `Create a professional 2x2 priority matrix diagram for feature prioritization.

Matrix axes:
- X-axis: "구현 난이도" (Implementation Difficulty) — 쉬움(Easy) to 어려움(Hard)
- Y-axis: "사용자 가치" (User Value) — 낮음(Low) to 높음(High)

Four quadrants with example features:

Top-Left (High value, Easy) — colored green, labeled "1순위: 지금 바로!" (Priority 1: Do now!)
- "연락처 폼" (Contact form)
- "상품 목록" (Product list)

Top-Right (High value, Hard) — colored orange, labeled "2순위: 계획 후 실행" (Priority 2: Plan then do)
- "결제 시스템" (Payment system)
- "회원 관리" (Member management)

Bottom-Left (Low value, Easy) — colored light blue, labeled "3순위: 시간 날 때" (Priority 3: When time allows)
- "다크 모드" (Dark mode)
- "애니메이션" (Animations)

Bottom-Right (Low value, Hard) — colored gray, labeled "4순위: 보류" (Priority 4: Hold)
- "AI 추천" (AI recommendations)
- "실시간 채팅" (Real-time chat)

Title: "기능 추가 우선순위 매트릭스"

${STYLE_GUIDE}`,
  },

  {
    file: "ch09-colors.png",
    label: "색상/폰트 변경 전후 비교",
    prompt: `Create a professional before/after comparison showing the impact of color and font choices on web design.

Two browser mockups side by side:

Left "변경 전" (Before):
- Garish, mismatched colors (bright red background, green text, yellow buttons)
- Comic-sans style font
- Cluttered, unprofessional appearance
- Red X mark overlay

Right "변경 후" (After):
- Harmonious color palette (navy #2C5F8D header, white body, orange #FF9933 CTA buttons)
- Clean sans-serif font
- Professional, trustworthy appearance
- Green checkmark overlay

Below: Three color palette swatches showing a "good" combination:
- Primary: #2C5F8D (Navy)
- Secondary: #FF9933 (Orange)
- Background: #FFFFFF (White)
- Text: #333333 (Dark gray)

Title: "색상과 폰트가 만드는 차이"

${STYLE_GUIDE}`,
  },

  {
    file: "ch09-layout.png",
    label: "레이아웃 여백 비교",
    prompt: `Create a professional before/after comparison showing the impact of whitespace/margin on web design.

Two browser mockups side by side:

Left "밀집된 레이아웃" (Cramped Layout):
- Text and elements packed tightly together
- No margins, no breathing room
- Hard to read, overwhelming
- Red X mark

Right "여유 있는 레이아웃" (Spacious Layout):
- Same content but with proper margins and padding
- Clear section separation
- Easy to scan, professional
- Green checkmark

Annotations with arrows pointing to specific improvements:
- "여백 (Whitespace)" arrows pointing to margins
- "줄간격 (Line height)" showing text spacing
- "섹션 구분 (Section separation)" showing clear breaks

Title: "여백의 미학: 밀집 vs 여유"

${STYLE_GUIDE}`,
  },

  {
    file: "ch09-responsive.png",
    label: "반응형 디자인 3단계",
    prompt: `Create a professional diagram showing responsive web design across three device sizes.

Three devices shown left to right, all displaying the same website but adapted:

1. "데스크톱" (Desktop) — Large monitor:
- 3-column layout
- Full navigation bar
- Large hero image
- Sidebar visible
- Label: "1200px+"

2. "태블릿" (Tablet) — iPad-sized:
- 2-column layout
- Hamburger menu
- Smaller hero
- No sidebar
- Label: "768px~1199px"

3. "모바일" (Mobile) — Phone:
- 1-column layout
- Hamburger menu
- Stacked content
- Large touch-friendly buttons
- Label: "~767px"

Arrows between devices showing "같은 코드, 다른 화면" (Same code, different screens).

Title: "반응형 디자인: 하나의 사이트, 세 가지 화면"

${STYLE_GUIDE}`,
  },

  {
    file: "ch11-models.png",
    label: "4가지 수익 모델 시각화",
    prompt: `Create a professional diagram showing 4 revenue models for solo entrepreneurs.

Layout: 2x2 grid of four cards/boxes, each with an icon and description:

Top-Left — "광고 수익" (Ad Revenue):
- Icon: monitor with ad banner
- "블로그/웹사이트 방문자 → 광고 수익"
- "월 예상: 30~100만원"
- Color accent: blue

Top-Right — "디지털 상품" (Digital Products):
- Icon: ebook/template/course icon
- "전자책, 템플릿, 온라인 강의 판매"
- "월 예상: 50~300만원"
- Color accent: orange

Bottom-Left — "구독 서비스" (Subscription):
- Icon: recurring payment/calendar
- "월정액 서비스, 멤버십"
- "월 예상: 100~500만원"
- Color accent: green

Bottom-Right — "외주/컨설팅" (Freelance/Consulting):
- Icon: handshake/briefcase
- "바이브 코딩 대행, 기술 컨설팅"
- "월 예상: 200~1000만원"
- Color accent: red

Title: "1인 사업가의 4가지 수익 모델"

${STYLE_GUIDE}`,
  },

  {
    file: "ch17-marathon.png",
    label: "단거리 vs 마라톤 지속가능성",
    prompt: `Create a professional diagram comparing sprint vs marathon approach to solo business.

Two-panel horizontal comparison:

Left panel "단거리 질주" (Sprint):
- Graph line: sharp spike up then crash down
- Icon: exhausted runner
- Labels: "번아웃" (Burnout), "포기" (Give up)
- Timeline: "3개월" (3 months)
- Red/warning tone

Right panel "마라톤" (Marathon):
- Graph line: steady gradual upward curve
- Icon: steady runner with smile
- Labels: "꾸준한 성장" (Steady growth), "지속 가능" (Sustainable)
- Timeline: "1년+" (1 year+)
- Green/positive tone

Below both panels, key principles:
- "매일 1시간 > 주말 10시간" (1 hour daily > 10 hours on weekend)
- "작은 성공 축적 → 큰 결과" (Accumulate small wins → big results)
- "완벽보다 완성, 완성보다 지속" (Consistency over perfection)

Title: "지속 가능한 1인 사업의 비결"

${STYLE_GUIDE}`,
  },
];

// ============================================================
// 프로그레스 바
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
async function generateImage(ai, model, prompt, outputPath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) {
        throw new Error("응답에 parts가 없습니다.");
      }

      const imagePart = parts.find((part) => part.inlineData);
      if (!imagePart) {
        throw new Error("응답에 이미지 데이터가 없습니다.");
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);

      return { success: true };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
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

// ============================================================
// CLI 인자 파싱
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { only: null, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--only" && args[i + 1]) {
      options.only = args[i + 1];
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
  console.log("📖 바이브 코딩 전자책 — 핵심 이미지 생성기 (Gemini 3)");
  console.log("=".repeat(55));

  const config = loadConfig();
  const model = config.gemini.model || "gemini-3-pro-image-preview";

  console.log(`\n  🤖 모델: ${model}`);
  console.log(`  📂 출력 폴더: ${OUTPUT_DIR}`);

  const options = parseArgs();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log("  📁 출력 폴더를 생성했습니다.");
  }

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  // 생성할 이미지 필터링
  let targets = IMAGE_PROMPTS;
  if (options.only) {
    const keyword = options.only.toLowerCase();
    targets = IMAGE_PROMPTS.filter(
      (p) =>
        p.file.toLowerCase().includes(keyword) ||
        p.label.toLowerCase().includes(keyword)
    );

    if (targets.length === 0) {
      console.error(`\n  ❌ "${options.only}"에 해당하는 이미지가 없습니다.`);
      process.exit(1);
    }
    console.log(
      `\n  🎯 "${options.only}" 필터: ${targets.length}개 이미지 선택`
    );
  }

  // 이미 존재하는 이미지 건너뛰기
  if (!options.force) {
    const before = targets.length;
    targets = targets.filter((t) => {
      const filePath = path.join(OUTPUT_DIR, t.file);
      return !fs.existsSync(filePath);
    });
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

    const result = await generateImage(ai, model, target.prompt, outputPath);

    if (result.success) {
      results.success.push(target.file);
    } else {
      results.failed.push({ file: target.file, error: result.error });
      console.log(`\n  ❌ 실패: ${target.file} — ${result.error}`);
    }

    // Rate limit 방지: 마지막이 아니면 2초 대기
    if (i < targets.length - 1) {
      await sleep(2000);
    }
  }

  showProgress(targets.length, targets.length, "완료!");

  // ── 결과 요약 ──
  console.log();
  console.log("=".repeat(55));
  console.log("📊 생성 결과 요약");
  console.log("=".repeat(55));

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

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ 예상치 못한 오류:", error.message);
  process.exit(1);
});
