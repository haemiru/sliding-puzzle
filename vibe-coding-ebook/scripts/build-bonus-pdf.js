/**
 * build-bonus-pdf.js
 *
 * 부가자료(프롬프트 템플릿, 실습 체크리스트)를 PDF로 변환
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");

const md = new MarkdownIt({ html: true, typographer: true });

const BONUS_FILES = [
  {
    input: "prompt-templates.md",
    output: "바이브코딩-프롬프트-템플릿-모음.pdf",
    label: "프롬프트 템플릿",
  },
  {
    input: "practice-checklist.md",
    output: "바이브코딩-실습-체크리스트.pdf",
    label: "실습 체크리스트",
  },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap');

@page {
  size: A4;
  margin: 2cm;
}

body {
  font-family: 'Nanum Gothic', 'Malgun Gothic', sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: #2B2B2B;
  max-width: 100%;
}

h1 {
  font-size: 22pt;
  font-weight: 800;
  color: #2C5F8D;
  border-bottom: 3px solid #FF9933;
  padding-bottom: 10px;
  margin-top: 0;
}

h2 {
  font-size: 16pt;
  font-weight: 700;
  color: #2C5F8D;
  border-left: 4px solid #FF9933;
  padding-left: 12px;
  margin-top: 2em;
  page-break-after: avoid;
}

h3 {
  font-size: 13pt;
  font-weight: 700;
  color: #2B2B2B;
  margin-top: 1.5em;
  page-break-after: avoid;
}

code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10pt;
}

pre {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px 20px;
  border-radius: 8px;
  font-size: 10pt;
  line-height: 1.5;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  page-break-inside: avoid;
}

pre code {
  background: none;
  padding: 0;
  color: inherit;
}

blockquote {
  border-left: 4px solid #FF9933;
  margin: 1em 0;
  padding: 0.5em 1em;
  background: #FFF8F0;
  border-radius: 0 8px 8px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 10pt;
  page-break-inside: avoid;
}

th {
  background: #2C5F8D;
  color: white;
  padding: 10px 12px;
  text-align: left;
  font-weight: 700;
}

td {
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
}

tr:nth-child(even) td {
  background: #f8f9fa;
}

ul {
  padding-left: 1.5em;
}

li {
  margin-bottom: 0.3em;
}

hr {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 2em 0;
}

strong {
  color: #2C5F8D;
}
`;

async function main() {
  console.log("\n📄 부가자료 PDF 생성\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  for (const file of BONUS_FILES) {
    const mdPath = path.join(OUTPUT_DIR, file.input);
    const pdfPath = path.join(OUTPUT_DIR, file.output);

    if (!fs.existsSync(mdPath)) {
      console.log(`  ⚠️  ${file.input} 파일이 없습니다. 건너뜁니다.`);
      continue;
    }

    const markdown = fs.readFileSync(mdPath, "utf-8");
    const htmlBody = md.render(markdown);

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>${CSS}</style>
</head>
<body>${htmlBody}</body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1000));

    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: { top: "2cm", right: "2cm", bottom: "2cm", left: "2cm" },
      printBackground: true,
    });

    await page.close();

    const size = (fs.statSync(pdfPath).size / 1024).toFixed(0);
    console.log(`  ✅  ${file.label} → ${file.output} (${size}KB)`);
  }

  await browser.close();
  console.log(`\n  📁  경로: ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error("  ❌  오류:", err.message);
  process.exit(1);
});
