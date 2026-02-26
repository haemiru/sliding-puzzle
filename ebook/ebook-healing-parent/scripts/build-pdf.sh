#!/bin/bash
# ══════════════════════════════════════════════
# 전자책 PDF 빌드 스크립트
# "괜찮아, 엄마도 아프니까"
# ══════════════════════════════════════════════

set -e

# 프로젝트 루트 (이 스크립트의 상위 디렉토리)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INPUT_MD="$PROJECT_ROOT/output/complete-ebook.md"
OUTPUT_HTML="$PROJECT_ROOT/output/ebook.html"
OUTPUT_PDF="$PROJECT_ROOT/output/final.pdf"
CSS_FILE="$PROJECT_ROOT/styles/ebook-style.css"

echo "──────────────────────────────────────────"
echo "  📄 PDF 빌드 시작"
echo "──────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────
# 1. 의존성 체크
# ──────────────────────────────────────────────
MISSING=0

if ! command -v pandoc &> /dev/null; then
  echo "❌ pandoc이 설치되어 있지 않습니다."
  echo "   설치 방법:"
  echo "   - Windows: winget install JohnMacFarlane.Pandoc"
  echo "   - macOS:   brew install pandoc"
  echo "   - Linux:   sudo apt install pandoc"
  echo ""
  MISSING=1
fi

if ! command -v weasyprint &> /dev/null; then
  echo "❌ weasyprint이 설치되어 있지 않습니다."
  echo "   설치 방법:"
  echo "   - pip install weasyprint"
  echo "   - 또는: pipx install weasyprint"
  echo ""
  MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
  echo "⚠️  필수 도구가 설치되지 않았습니다. 위 안내를 참고해 설치 후 다시 실행하세요."
  exit 1
fi

echo "✅ pandoc:     $(pandoc --version | head -1)"
echo "✅ weasyprint: $(weasyprint --version 2>&1 | head -1)"
echo ""

# ──────────────────────────────────────────────
# 2. 입력 파일 확인
# ──────────────────────────────────────────────
if [ ! -f "$INPUT_MD" ]; then
  echo "❌ 병합된 마크다운 파일이 없습니다: $INPUT_MD"
  echo "   먼저 'node scripts/merge-content.js'를 실행하세요."
  exit 1
fi

if [ ! -f "$CSS_FILE" ]; then
  echo "❌ CSS 파일이 없습니다: $CSS_FILE"
  exit 1
fi

# ──────────────────────────────────────────────
# 3. 기존 출력 파일 정리
# ──────────────────────────────────────────────
echo "🧹 기존 빌드 파일 정리..."
[ -f "$OUTPUT_HTML" ] && rm "$OUTPUT_HTML"
[ -f "$OUTPUT_PDF" ] && rm "$OUTPUT_PDF"

# ──────────────────────────────────────────────
# 4. Step A: 마크다운 → HTML (Pandoc)
# ──────────────────────────────────────────────
echo "📝 Step A: 마크다운 → HTML 변환 중..."

cd "$PROJECT_ROOT"

pandoc output/complete-ebook.md \
  -o output/ebook.html \
  --standalone \
  --metadata title="괜찮아, 엄마도 아프니까" \
  --metadata author="피지오 아카데미" \
  --metadata lang="ko" \
  --css=styles/ebook-style.css \
  --toc \
  --toc-depth=2 \
  --wrap=none \
  -f markdown+emoji

if [ ! -f "$OUTPUT_HTML" ]; then
  echo "❌ HTML 변환 실패"
  exit 1
fi

HTML_SIZE=$(wc -c < "$OUTPUT_HTML" | tr -d ' ')
echo "   ✅ HTML 생성 완료 ($(echo "scale=1; $HTML_SIZE / 1024" | bc) KB)"

# ──────────────────────────────────────────────
# 5. Step B: HTML → PDF (WeasyPrint)
# ──────────────────────────────────────────────
echo "📄 Step B: HTML → PDF 변환 중..."

weasyprint output/ebook.html output/final.pdf \
  --stylesheet=styles/ebook-style.css

if [ ! -f "$OUTPUT_PDF" ]; then
  echo "❌ PDF 변환 실패"
  exit 1
fi

PDF_SIZE=$(wc -c < "$OUTPUT_PDF" | tr -d ' ')
PDF_SIZE_MB=$(echo "scale=2; $PDF_SIZE / 1048576" | bc)

echo ""
echo "──────────────────────────────────────────"
echo "  ✅ PDF 빌드 완료!"
echo "──────────────────────────────────────────"
echo "  📄 출력 파일: output/final.pdf"
echo "  📦 파일 크기: ${PDF_SIZE_MB} MB"
echo ""
