const fs = require("fs");
const path = require("path");

// ──────────────────────────────────────────────
// 설정
// ──────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUTPUT_DIR = path.join(ROOT, "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "complete-ebook.md");

const PAGE_BREAK = '\n\n<div class="page-break"></div>\n\n';

// ──────────────────────────────────────────────
// 병합 순서
// ──────────────────────────────────────────────
const FILES = [
  "00-frontmatter/frontmatter.md",
  "01-prologue/prologue.md",
  "02-part1/chapter01.md",
  "02-part1/chapter02.md",
  "02-part1/part1-summary.md",
  "03-part2/chapter03.md",
  "03-part2/chapter04.md",
  "03-part2/part2-summary.md",
  "04-part3/chapter05.md",
  "04-part3/chapter06.md",
  "04-part3/part3-summary.md",
  "05-part4/chapter07.md",
  "05-part4/part4-summary.md",
  "06-epilogue/epilogue.md",
  "07-appendix/appendix-a-emotion-diary.md",
  "07-appendix/appendix-b-checklists.md",
  "07-appendix/appendix-c-resources.md",
  "07-appendix/appendix-d-references.md",
  "00-frontmatter/colophon.md",
];

// ──────────────────────────────────────────────
// 이미지 경로 변환
// ──────────────────────────────────────────────
// content 하위 파일에서 사용되는 상대 경로 패턴들:
//   ../../images/...  (2단계 하위 폴더에서)
//   ../images/...     (1단계 하위 폴더에서)
// → output/ 기준으로 ../images/... 로 통일
// → 또는 프로젝트 루트 기준 images/... 로 통일

function fixImagePaths(content) {
  // ../../images/ → images/
  content = content.replace(
    /\(\.\.\/\.\.\/images\//g,
    "(images/"
  );
  // ../images/ → images/
  content = content.replace(
    /\(\.\.\/images\//g,
    "(images/"
  );
  return content;
}

// ──────────────────────────────────────────────
// 블록쿼트 클래스 자동 부여
// ──────────────────────────────────────────────
// 마크다운의 > 블록쿼트를 이모지 기반으로 HTML 클래스가 붙은
// div로 변환하는 것은 빌드 단계에서 처리.
// 여기서는 마크다운 원본 그대로 유지.

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
function main() {
  console.log("=".repeat(50));
  console.log("  콘텐츠 병합 스크립트");
  console.log('  "괜찮아, 엄마도 아프니까"');
  console.log("=".repeat(50));
  console.log();

  // output 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sections = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < FILES.length; i++) {
    const relPath = FILES[i];
    const fullPath = path.join(CONTENT_DIR, relPath);
    const label = `[${i + 1}/${FILES.length}]`;

    if (!fs.existsSync(fullPath)) {
      console.error(`${label} ❌ 파일 없음: ${relPath}`);
      failCount++;
      continue;
    }

    let content = fs.readFileSync(fullPath, "utf-8");
    content = fixImagePaths(content);
    sections.push(content.trim());
    successCount++;

    const charCount = content.length;
    console.log(
      `${label} ✅ ${relPath} (${charCount.toLocaleString()}자)`
    );
  }

  // 병합
  const merged = sections.join(PAGE_BREAK);

  // 저장
  fs.writeFileSync(OUTPUT_FILE, merged, "utf-8");

  // 통계
  const totalChars = merged.length;
  const totalCharsNoSpace = merged.replace(/\s/g, "").length;
  // 한국어 기준 대략 A4 1페이지 ≈ 1,000자 (본문 기준)
  const estimatedPages = Math.ceil(totalCharsNoSpace / 1000);

  console.log();
  console.log("=".repeat(50));
  console.log("  병합 결과");
  console.log("=".repeat(50));
  console.log(`  병합 파일 수: ${successCount}/${FILES.length}`);
  if (failCount > 0) {
    console.log(`  실패 파일 수: ${failCount}`);
  }
  console.log(`  총 글자 수:   ${totalChars.toLocaleString()}자 (공백 포함)`);
  console.log(`  총 글자 수:   ${totalCharsNoSpace.toLocaleString()}자 (공백 제외)`);
  console.log(`  예상 페이지:  약 ${estimatedPages}페이지 (A4 기준)`);
  console.log(`  출력 파일:    ${OUTPUT_FILE}`);
  console.log();
}

main();
