/**
 * 전자책 PDF 빌드 스크립트 (Puppeteer)
 *
 * markdown-it → HTML → Puppeteer → PDF
 *
 * 사용법:
 *   node scripts/build-pdf.js              # 전체 빌드
 *   node scripts/build-pdf.js --preview    # 미리보기 (20페이지)
 *   node scripts/build-pdf.js --html-only  # HTML만 생성 (디버깅용)
 *   node scripts/build-pdf.js --keep-html  # HTML 파일 유지
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const MarkdownIt = require('markdown-it');

// ─── 경로 설정 ──────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MANUSCRIPT_DIR = path.join(PROJECT_ROOT, 'manuscript');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'images');
const STYLES_DIR = path.join(PROJECT_ROOT, 'styles');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const CSS_FILE = path.join(STYLES_DIR, 'ebook.css');

const OUTPUT_FILENAME = 'claude-ebook-guide-by-jm';

// 원고 파일 순서
const MANUSCRIPT_FILES = [
  '00-cover.md',
  '01-chapter1.md',
  '02-chapter2.md',
  '03-chapter3.md',
  '04-chapter4.md',
  '05-chapter5.md',
  '06-chapter6.md',
  '07-appendix.md',
  '08-closing.md',
];

// 챕터 → 헤더 이미지 매핑
const CHAPTER_IMAGES = {
  '01-chapter1.md': 'chapters/ch1-header.png',
  '02-chapter2.md': 'chapters/ch2-header.png',
  '03-chapter3.md': 'chapters/ch3-header.png',
  '04-chapter4.md': 'chapters/ch4-header.png',
  '05-chapter5.md': 'chapters/ch5-header.png',
  '06-chapter6.md': 'chapters/ch6-header.png',
  '07-appendix.md': 'chapters/ch7-header.png',
};

// 메타데이터
const METADATA = {
  title: 'Claude로 전자책 작성하기',
  author: 'J.M',
  lang: 'ko',
};

// ─── Markdown-it 설정 ───────────────────────────────────
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// ─── 유틸 함수 ──────────────────────────────────────────

/** 이미지 경로를 file:// URI로 변환 (Puppeteer 호환) */
function toFileUri(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

/** YAML 프론트매터 제거 */
function stripFrontmatter(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

/** 원고 파일을 읽고 병합 */
function mergeManuscripts() {
  const parts = [];

  for (const filename of MANUSCRIPT_FILES) {
    const filepath = path.join(MANUSCRIPT_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.log(`  [WARN] ${filename} 없음, 스킵`);
      continue;
    }

    let content = fs.readFileSync(filepath, 'utf-8');
    content = stripFrontmatter(content);

    // 이미지는 원고 마크다운에 이미 삽입되어 있으므로 추가 삽입 불필요
    // buildHtml()에서 상대경로 → 절대경로 변환 처리

    parts.push(content.trim());
  }

  return parts.join('\n\n');
}

/** Markdown → HTML 변환 후 완전한 HTML 문서 생성 */
function buildHtml(markdownContent) {
  let bodyHtml = md.render(markdownContent);
  const cssContent = fs.readFileSync(CSS_FILE, 'utf-8');

  // 모든 이미지 상대경로를 절대 file:// URI로 변환
  // ../images/... → file:///C:/Users/.../images/...
  const imagesAbsolute = toFileUri(IMAGES_DIR);
  bodyHtml = bodyHtml.replace(
    /src="\.\.\/images\//g,
    `src="${imagesAbsolute}/`
  );

  const html = `<!DOCTYPE html>
<html lang="${METADATA.lang}">
<head>
  <meta charset="utf-8">
  <meta name="author" content="${METADATA.author}">
  <title>${METADATA.title}</title>
  <style>
${cssContent}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  return html;
}

/** Puppeteer로 PDF 생성 */
async function generatePdf(htmlPath, pdfPath, options = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();

  // HTML 파일 로드
  const fileUrl = toFileUri(htmlPath);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  // 폰트 로딩 대기
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 1000));

  // PDF 생성
  const pdfOptions = {
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '25mm',
      bottom: '25mm',
      left: '22mm',
      right: '22mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="width:100%; font-size:8pt; font-family:'Noto Sans KR',sans-serif; color:#94A3B8; padding:0 22mm;">
        <span style="float:left;">${METADATA.title}</span>
        <span style="float:right;">${METADATA.author}</span>
      </div>`,
    footerTemplate: `
      <div style="width:100%; text-align:center; font-size:9pt; font-family:'Noto Sans KR',sans-serif; color:#94A3B8;">
        <span class="pageNumber"></span>
      </div>`,
    preferCSSPageSize: false,
  };

  // 미리보기 모드: 페이지 제한
  if (options.previewPages) {
    pdfOptions.pageRanges = `1-${options.previewPages}`;
  }

  await page.pdf(pdfOptions);
  await browser.close();
}

// ─── 메인 ───────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const htmlOnly = args.includes('--html-only');
  const keepHtml = args.includes('--keep-html');

  console.log('='.repeat(55));
  console.log(`  전자책 PDF 빌드 (Puppeteer)`);
  console.log(`  ${METADATA.title} — ${METADATA.author}`);
  console.log('='.repeat(55));
  console.log();

  // 출력 디렉토리 생성
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. 원고 병합
  console.log('[1/3] 원고 병합 중...');
  const merged = mergeManuscripts();
  const charCount = merged.length.toLocaleString();
  console.log(`      완료: ${charCount}자, ${MANUSCRIPT_FILES.length}개 파일`);

  // 2. HTML 변환
  console.log('[2/3] HTML 변환 중...');
  const html = buildHtml(merged);
  const htmlPath = path.join(OUTPUT_DIR, `${OUTPUT_FILENAME}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`      HTML 저장: ${path.basename(htmlPath)}`);

  if (htmlOnly) {
    console.log('\n[완료] --html-only 모드. HTML만 생성했습니다.');
    console.log(`      ${htmlPath}`);
    return;
  }

  // 3. PDF 생성
  const pdfFilename = isPreview
    ? `${OUTPUT_FILENAME}-preview.pdf`
    : `${OUTPUT_FILENAME}.pdf`;
  const pdfPath = path.join(OUTPUT_DIR, pdfFilename);

  console.log(`[3/3] PDF 생성 중${isPreview ? ' (미리보기 20p)' : ''}...`);

  try {
    await generatePdf(htmlPath, pdfPath, {
      previewPages: isPreview ? 20 : null,
    });

    const stats = fs.statSync(pdfPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`      PDF 저장: ${pdfFilename} (${sizeMb} MB)`);
  } catch (err) {
    console.error(`  [ERROR] PDF 생성 실패: ${err.message}`);
    process.exit(1);
  }

  // HTML 정리
  if (!keepHtml) {
    fs.unlinkSync(htmlPath);
  }

  // 결과 요약
  console.log();
  console.log('='.repeat(55));
  console.log('  빌드 완료!');
  console.log(`  출력: output/${pdfFilename}`);
  console.log('='.repeat(55));
}

main().catch(err => {
  console.error('빌드 오류:', err);
  process.exit(1);
});
