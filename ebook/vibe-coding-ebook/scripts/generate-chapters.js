/**
 * generate-chapters.js
 *
 * chapters-outline.json을 기반으로 Gemini API를 사용하여
 * 각 챕터의 마크다운 원고를 자동 생성하는 스크립트
 *
 * 사용법:
 *   node scripts/generate-chapters.js                  # 빈 챕터만 생성
 *   node scripts/generate-chapters.js --force           # 모든 챕터 재생성
 *   node scripts/generate-chapters.js --chapter 2       # 특정 챕터만 생성
 *   node scripts/generate-chapters.js --practices       # 실습 파일만 생성
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ============================================================
// 설정 로드
// ============================================================
function loadConfig() {
  const raw = fs.readFileSync(path.join(PROJECT_ROOT, "config.json"), "utf-8");
  return JSON.parse(raw);
}

function loadOutline() {
  const raw = fs.readFileSync(path.join(PROJECT_ROOT, "chapters-outline.json"), "utf-8");
  return JSON.parse(raw);
}

// ============================================================
// Chapter 1 템플릿 읽기 (스타일 참고용)
// ============================================================
function loadTemplateChapter() {
  const templatePath = path.join(PROJECT_ROOT, "manuscript", "part1-intro", "chapter01.md");
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, "utf-8");
  }
  return "";
}

// ============================================================
// 챕터 생성 프롬프트 구성
// ============================================================
function buildChapterPrompt(chapter, template) {
  const num = chapter.id.replace("chapter", "");
  return `당신은 "바이브 코딩으로 1인 사업가 되기" 전자책의 저자입니다.
아래 정보를 바탕으로 Chapter ${num}을 마크다운으로 작성해주세요.

## 챕터 정보
- 제목: ${chapter.title}
- 주제: ${chapter.topics.join(", ")}
- 실제 사례: ${chapter.case_study}
- 비유: ${chapter.analogy}
- 핵심 포인트: ${chapter.key_points.join(" / ")}

## 필수 구조 (이 순서대로 작성)
1. # Chapter ${num}. ${chapter.title}
2. ![챕터${num} 이미지](../../images/chapters/${chapter.id}.png)
3. --- (구분선)
4. ## 학습 목표 (3개, 번호 리스트)
5. --- (구분선)
6. ## 본문 섹션 2~3개 (h2 + h3 소제목 구조)
7. --- (구분선)
8. ## 실생활 비유: (비유 제목)
9. --- (구분선)
10. ## 실제 사례: (사례 제목)
11. --- (구분선)
12. ## 핵심 포인트 (번호 리스트 3~5개)
13. --- (구분선)
14. ## 다음 챕터 미리보기

## 작성 규칙 (매우 중요!)
- 대상 독자: 50~60대, 코딩 경험 전혀 없는 분
- 문장 길이: 20~25자 이내로 짧게
- 단락: 3~4문장 이내로 짧게
- 전문 용어는 반드시 쉬운 설명 추가
- 존댓말 사용 ("~합니다", "~입니다")
- 따뜻하고 격려하는 톤
- 본문 전체 분량: 약 3000~4000자 (A4 3~4페이지)

## 참고 템플릿 (Chapter 1 스타일)
아래 Chapter 1의 작성 스타일과 톤을 동일하게 유지해주세요:

${template.substring(0, 2000)}

마크다운만 출력하세요. 다른 설명은 불필요합니다.`;
}

// ============================================================
// 실습 파일 생성 프롬프트
// ============================================================
function buildPracticePrompt(practice, outline) {
  const coveredChapters = practice.chapters_covered
    .map((id) => {
      const ch = outline.chapters.find((c) => c.id === id);
      return ch ? `- ${ch.id}: ${ch.title}` : "";
    })
    .join("\n");

  return `당신은 "바이브 코딩으로 1인 사업가 되기" 전자책의 저자입니다.
아래 정보를 바탕으로 종합 실습 파일을 마크다운으로 작성해주세요.

## 실습 정보
- 제목: ${practice.title}
- 실습 과제: ${practice.exercise}
- 다루는 챕터:
${coveredChapters}

## 필수 구조
1. # ${practice.title}
2. ![실습 이미지](../../images/chapters/${practice.id}.png)
3. --- (구분선)
4. ## 핵심 요약 (각 챕터 3줄 요약)
5. --- (구분선)
6. ## 실습 과제: ${practice.exercise}
   - 구체적인 단계별 가이드
   - 빈칸 채우기 또는 작성 공간
   - 예시 포함
7. --- (구분선)
8. ## 자가 진단 체크리스트 (${practice.checklist_items}개 항목)
   - 체크박스 형태
   - 결과 해석 포함
9. --- (구분선)
10. ## 격려 메시지 (Pieter Levels 또는 Marc Lou 사례 언급)
11. --- (구분선)
12. ## 다음 Part 미리보기

## 작성 규칙
- 대상 독자: 50~60대
- 문장 짧게 (20~25자)
- 실제로 펜으로 적을 수 있는 실습
- 따뜻하고 격려하는 톤
- 분량: 약 2000~3000자

마크다운만 출력하세요.`;
}

// ============================================================
// Gemini API로 콘텐츠 생성
// ============================================================
async function generateContent(ai, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.candidates?.[0]?.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("");

      if (!text) throw new Error("응답에 텍스트가 없습니다.");
      return text;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const wait = Math.pow(2, attempt) * 1000;
      console.log(`     ⚠️ 시도 ${attempt}/${maxRetries} 실패, ${wait / 1000}초 후 재시도...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// ============================================================
// 프로그레스 표시
// ============================================================
function showProgress(current, total, label) {
  const barLen = 30;
  const filled = Math.round((current / total) * barLen);
  const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total}) ${label}`);
  if (current === total) console.log();
}

// ============================================================
// 파일이 빈 파일인지 확인 (제목만 있는 경우 포함)
// ============================================================
function isEmptyChapter(filePath) {
  if (!fs.existsSync(filePath)) return true;
  const content = fs.readFileSync(filePath, "utf-8").trim();
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  return lines.length <= 1;
}

// ============================================================
// CLI 인자 파싱
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { force: false, chapter: null, practices: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") opts.force = true;
    if (args[i] === "--practices") opts.practices = true;
    if (args[i] === "--chapter" && args[i + 1]) {
      opts.chapter = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return opts;
}

// ============================================================
// 메인
// ============================================================
async function main() {
  console.log();
  console.log("📖 바이브 코딩 전자책 — 챕터 자동 생성기");
  console.log("=".repeat(50));

  const config = loadConfig();
  const outline = loadOutline();
  const template = loadTemplateChapter();
  const opts = parseArgs();

  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

  const results = { success: [], failed: [], skipped: [] };

  // 생성 대상 결정
  let chapters = outline.chapters;
  let practices = outline.practices;

  if (opts.chapter !== null) {
    const id = `chapter${String(opts.chapter).padStart(2, "0")}`;
    chapters = chapters.filter((c) => c.id === id);
    practices = [];
    if (chapters.length === 0) {
      console.error(`\n  ❌ Chapter ${opts.chapter}을 찾을 수 없습니다.`);
      process.exit(1);
    }
  }
  if (opts.practices) {
    chapters = [];
  }

  const totalItems = chapters.length + practices.length;
  let current = 0;

  console.log(`\n  📝 총 ${totalItems}개 파일 처리 예정\n`);

  // ── 챕터 생성 ──
  for (const chapter of chapters) {
    const filePath = path.join(
      PROJECT_ROOT, "manuscript", chapter.part, `${chapter.id}.md`
    );

    current++;

    // 이미 내용이 있으면 건너뛰기 (--force 제외)
    if (!opts.force && !isEmptyChapter(filePath)) {
      results.skipped.push(chapter.id);
      showProgress(current, totalItems, `${chapter.id} (건너뜀)`);
      continue;
    }

    showProgress(current, totalItems, `${chapter.id} 생성 중...`);

    try {
      const prompt = buildChapterPrompt(chapter, template);
      const content = await generateContent(ai, prompt);

      // 마크다운 코드 펜스 제거 (Gemini가 감쌀 수 있음)
      const cleaned = content.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");

      fs.writeFileSync(filePath, cleaned, "utf-8");
      results.success.push(chapter.id);
    } catch (error) {
      results.failed.push({ id: chapter.id, error: error.message });
      console.log(`\n  ❌ ${chapter.id} 실패: ${error.message}`);
    }

    // Rate limit 방지: 2초 대기
    await new Promise((r) => setTimeout(r, 2000));
  }

  // ── 실습 파일 생성 ──
  for (const practice of practices) {
    const filePath = path.join(
      PROJECT_ROOT, "manuscript", practice.part, `${practice.id}.md`
    );

    current++;

    if (!opts.force && !isEmptyChapter(filePath)) {
      results.skipped.push(practice.id);
      showProgress(current, totalItems, `${practice.id} (건너뜀)`);
      continue;
    }

    showProgress(current, totalItems, `${practice.id} 생성 중...`);

    try {
      const prompt = buildPracticePrompt(practice, outline);
      const content = await generateContent(ai, prompt);
      const cleaned = content.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");

      fs.writeFileSync(filePath, cleaned, "utf-8");
      results.success.push(practice.id);
    } catch (error) {
      results.failed.push({ id: practice.id, error: error.message });
      console.log(`\n  ❌ ${practice.id} 실패: ${error.message}`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  // ── 결과 요약 ──
  console.log();
  console.log("=".repeat(50));
  console.log("📊 생성 결과");
  console.log("=".repeat(50));
  if (results.success.length > 0) {
    console.log(`\n  ✅ 생성: ${results.success.length}개`);
    results.success.forEach((id) => console.log(`     └─ ${id}`));
  }
  if (results.skipped.length > 0) {
    console.log(`\n  ⏭️  건너뜀: ${results.skipped.length}개 (이미 내용 있음)`);
  }
  if (results.failed.length > 0) {
    console.log(`\n  ❌ 실패: ${results.failed.length}개`);
    results.failed.forEach(({ id, error }) => console.log(`     └─ ${id}: ${error}`));
  }
  console.log();

  if (results.failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n  ❌ 오류:", err.message);
  process.exit(1);
});
