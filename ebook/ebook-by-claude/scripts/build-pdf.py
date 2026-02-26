"""
전자책 PDF 빌드 스크립트 (Pandoc 방식)

Pandoc + XeLaTeX 또는 Pandoc → HTML 변환을 제공합니다.
기본(추천) 빌드는 Node.js 기반 build-pdf.js를 사용하세요.

사용법:
  python scripts/build-pdf.py                  # pandoc → HTML 생성 (PDF는 Node.js 빌드 추천)
  python scripts/build-pdf.py --engine=xelatex # XeLaTeX PDF (한글 폰트 필요)
"""

import os
import sys
import argparse
import subprocess
import re
from pathlib import Path
from datetime import datetime

# Windows 인코딩
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

# ─── 경로 설정 ────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MANUSCRIPT_DIR = PROJECT_ROOT / "manuscript"
IMAGES_DIR = PROJECT_ROOT / "images"
STYLES_DIR = PROJECT_ROOT / "styles"
OUTPUT_DIR = PROJECT_ROOT / "output"
CSS_FILE = STYLES_DIR / "ebook.css"

MANUSCRIPT_FILES = [
    "00-cover.md",
    "01-chapter1.md",
    "02-chapter2.md",
    "03-chapter3.md",
    "04-chapter4.md",
    "05-chapter5.md",
    "06-chapter6.md",
    "07-appendix.md",
    "08-closing.md",
]

CHAPTER_IMAGES = {
    "01-chapter1.md": "chapters/ch1-header.png",
    "02-chapter2.md": "chapters/ch2-header.png",
    "03-chapter3.md": "chapters/ch3-header.png",
    "04-chapter4.md": "chapters/ch4-header.png",
    "05-chapter5.md": "chapters/ch5-header.png",
    "06-chapter6.md": "chapters/ch6-header.png",
    "07-appendix.md": "chapters/ch7-header.png",
}

METADATA = {
    "title": "Claude로 전자책 작성하기",
    "author": "J.M",
    "date": datetime.now().strftime("%Y년 %m월"),
    "lang": "ko",
}

OUTPUT_FILENAME = "claude-ebook-guide-by-jm"


def merge_manuscripts() -> str:
    """원고 파일을 순서대로 병합하고 챕터 이미지를 삽입"""
    parts = []

    for filename in MANUSCRIPT_FILES:
        filepath = MANUSCRIPT_DIR / filename
        if not filepath.exists():
            print(f"  [WARN] {filename} 없음, 스킵")
            continue

        content = filepath.read_text(encoding="utf-8")
        content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)

        if filename in CHAPTER_IMAGES:
            img_path = IMAGES_DIR / CHAPTER_IMAGES[filename]
            if img_path.exists():
                rel_img = os.path.relpath(img_path, PROJECT_ROOT).replace("\\", "/")
                img_tag = f'\n![챕터 이미지]({rel_img}){{.chapter-header-image}}\n'
                content = re.sub(
                    r'(^#\s+.+$)', r'\1' + img_tag,
                    content, count=1, flags=re.MULTILINE,
                )

        parts.append(content.strip())

    return "\n\n---\n\n".join(parts)


def build_html():
    """Pandoc으로 HTML 생성 (CSS 인라인 포함)"""
    print("\n[BUILD] Pandoc -> HTML")
    print("=" * 50)

    print("  [1/3] 원고 병합 중...")
    merged = merge_manuscripts()
    merged_md = OUTPUT_DIR / "_merged.md"
    merged_md.write_text(merged, encoding="utf-8")
    print(f"        {len(merged):,}자 병합됨")

    print("  [2/3] Pandoc HTML 변환 중...")
    html_file = OUTPUT_DIR / f"{OUTPUT_FILENAME}-pandoc.html"

    pandoc_cmd = [
        "pandoc", str(merged_md),
        "-o", str(html_file),
        "--standalone",
        "--from=markdown+raw_html+fenced_divs+bracketed_spans",
        "--to=html5",
        f"--metadata=title:{METADATA['title']}",
        f"--metadata=author:{METADATA['author']}",
        f"--metadata=lang:{METADATA['lang']}",
        "--wrap=none",
        f"--resource-path={PROJECT_ROOT}",
    ]

    result = subprocess.run(pandoc_cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        print(f"  [ERROR] Pandoc 실패:\n{result.stderr}")
        return False

    # CSS 인라인 삽입
    html_content = html_file.read_text(encoding="utf-8")
    css_content = CSS_FILE.read_text(encoding="utf-8")
    html_content = html_content.replace("</head>", f"\n<style>\n{css_content}\n</style>\n</head>")
    html_file.write_text(html_content, encoding="utf-8")

    print(f"  [3/3] 완료!")
    print(f"        출력: {html_file.name}")
    print(f"        이 HTML을 build-pdf.js (Puppeteer)로 PDF 변환하세요.")

    # 임시 MD 정리
    merged_md.unlink(missing_ok=True)
    return True


def build_xelatex():
    """Pandoc + XeLaTeX → PDF"""
    print("\n[BUILD] Pandoc + XeLaTeX")
    print("=" * 50)

    print("  [1/3] 원고 병합 중...")
    merged = merge_manuscripts()
    merged_md = OUTPUT_DIR / "_merged.md"
    merged_md.write_text(merged, encoding="utf-8")
    print(f"        {len(merged):,}자 병합됨")

    print("  [2/3] XeLaTeX PDF 변환 중...")
    pdf_file = OUTPUT_DIR / f"{OUTPUT_FILENAME}-xelatex.pdf"

    pandoc_cmd = [
        "pandoc", str(merged_md),
        "-o", str(pdf_file),
        "--pdf-engine=xelatex",
        "--from=markdown+raw_html+fenced_divs",
        f"--metadata=title:{METADATA['title']}",
        f"--metadata=author:{METADATA['author']}",
        f"--metadata=date:{METADATA['date']}",
        f"--metadata=lang:{METADATA['lang']}",
        "-V", "geometry:a4paper,top=25mm,bottom=25mm,left=22mm,right=22mm",
        "-V", "mainfont:Noto Sans KR",
        "-V", "monofont:D2Coding",
        "-V", "fontsize=11pt",
        "-V", "linestretch=1.7",
        "-V", "colorlinks=true",
        "-V", "linkcolor=blue",
        f"--resource-path={PROJECT_ROOT}",
    ]

    result = subprocess.run(pandoc_cmd, capture_output=True, text=True, encoding="utf-8")
    if result.returncode != 0:
        print(f"  [ERROR] XeLaTeX 실패:\n{result.stderr[:500]}")
        merged_md.unlink(missing_ok=True)
        return False

    size_mb = pdf_file.stat().st_size / (1024 * 1024)
    print(f"  [3/3] 완료!")
    print(f"        출력: {pdf_file.name} ({size_mb:.1f} MB)")

    merged_md.unlink(missing_ok=True)
    return True


def main():
    parser = argparse.ArgumentParser(description="전자책 PDF 빌드 (Pandoc)")
    parser.add_argument(
        "--engine", choices=["html", "xelatex"], default="html",
        help="빌드 방식 (기본: html)",
    )
    args = parser.parse_args()

    print("=" * 50)
    print("  전자책 PDF 빌드 (Pandoc)")
    print(f"  {METADATA['title']} -- {METADATA['author']}")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # pandoc 체크
    try:
        subprocess.run(["pandoc", "--version"], capture_output=True, check=True, timeout=10)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("  [ERROR] pandoc이 설치되어 있지 않습니다.")
        sys.exit(1)

    if args.engine == "xelatex":
        ok = build_xelatex()
    else:
        ok = build_html()

    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
