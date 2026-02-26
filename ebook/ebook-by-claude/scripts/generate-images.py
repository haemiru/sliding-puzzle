"""
전자책 이미지 생성 스크립트
Gemini 2.0 Flash API를 사용하여 표지, 챕터 헤더, 아이콘 이미지를 생성합니다.
"""

import os
import sys
import time
import base64
from pathlib import Path

# Windows cp949 인코딩 문제 방지
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

from google import genai
from google.genai import types

# ─── 설정 ────────────────────────────────────────────────
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY environment variable is not set.")
    sys.exit(1)
MODEL = "gemini-2.0-flash-exp-image-generation"
DELAY_SECONDS = 3
MAX_RETRIES = 3

# 프로젝트 루트 (scripts/ 기준 한 단계 위)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = PROJECT_ROOT / "images"

# ─── 이미지 정의 ─────────────────────────────────────────
IMAGE_SPECS = [
    {
        "path": "cover/cover-main.png",
        "description": "전자책 메인 표지",
        "prompt": (
            "Modern minimalist ebook cover design, dark navy blue (#1E3A5F) "
            "and amber (#D97706) gradient background, abstract geometric AI neural "
            "network pattern, clean professional typography space, digital knowledge "
            "concept, no text on image, 1400x2100px aspect ratio, high quality"
        ),
    },
    {
        "path": "chapters/ch1-header.png",
        "description": "Chapter 1 장식 이미지",
        "prompt": (
            "Minimalist illustration of a person starting a journey with "
            "a glowing AI companion, warm amber and navy blue color scheme, flat "
            "design style, clean lines, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch2-header.png",
        "description": "Chapter 2 장식 이미지",
        "prompt": (
            "Minimalist illustration of a magnifying glass examining "
            "trending topics and market data, amber and navy color scheme, "
            "flat design, clean geometric shapes, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch3-header.png",
        "description": "Chapter 3 장식 이미지",
        "prompt": (
            "Minimalist illustration of blueprint/architectural planning "
            "with building blocks forming a book structure, amber and navy scheme, "
            "flat design, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch4-header.png",
        "description": "Chapter 4 장식 이미지",
        "prompt": (
            "Minimalist illustration of AI and human hands collaborating "
            "on writing, flowing text streams, amber and navy color scheme, "
            "flat design, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch5-header.png",
        "description": "Chapter 5 장식 이미지",
        "prompt": (
            "Minimalist illustration of design tools, color palette, "
            "and a polished book being assembled, amber and navy scheme, "
            "flat design, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch6-header.png",
        "description": "Chapter 6 장식 이미지",
        "prompt": (
            "Minimalist illustration of a rocket launching from an "
            "open book with coins and growth charts, amber and navy scheme, "
            "flat design, no text, 1200x400px banner"
        ),
    },
    {
        "path": "chapters/ch7-header.png",
        "description": "Chapter 7 (부록) 장식 이미지",
        "prompt": (
            "Minimalist illustration of a toolbox filled with writing "
            "and design tools, checklist floating above, amber and navy scheme, "
            "flat design, no text, 1200x400px banner"
        ),
    },
    {
        "path": "icons/prompt-icon.png",
        "description": "프롬프트 박스 아이콘",
        "prompt": (
            "Simple flat icon of a chat bubble with code brackets, "
            "amber (#D97706) on transparent background, 128x128px, minimal"
        ),
    },
    {
        "path": "icons/worksheet-icon.png",
        "description": "워크시트 아이콘",
        "prompt": (
            "Simple flat icon of a pencil writing on paper with "
            "checkbox, navy blue (#1E3A5F) on transparent background, 128x128px"
        ),
    },
    {
        "path": "icons/tip-icon.png",
        "description": "꿀팁 박스 아이콘",
        "prompt": (
            "Simple flat icon of a lightbulb with sparkle, "
            "green (#10B981) on transparent background, 128x128px, minimal"
        ),
    },
    {
        "path": "icons/warning-icon.png",
        "description": "주의 박스 아이콘",
        "prompt": (
            "Simple flat icon of a warning triangle with exclamation, "
            "red (#EF4444) on transparent background, 128x128px, minimal"
        ),
    },
]


def generate_image(client, spec: dict) -> bool:
    """단일 이미지를 생성하고 저장합니다. 성공 시 True 반환."""
    output_path = IMAGES_DIR / spec["path"]
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 이미 존재하면 스킵
    if output_path.exists() and output_path.stat().st_size > 0:
        print(f"  [SKIP] {spec['path']} (이미 존재)")
        return True

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"  [TRY {attempt}/{MAX_RETRIES}] 생성 중: {spec['description']}...")

            response = client.models.generate_content(
                model=MODEL,
                contents=spec["prompt"],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            # 응답에서 이미지 파트 추출
            image_saved = False
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    image_data = part.inline_data.data
                    output_path.write_bytes(image_data)
                    size_kb = output_path.stat().st_size / 1024
                    print(f"  [OK] {spec['path']} 저장 완료 ({size_kb:.1f} KB)")
                    image_saved = True
                    break

            if image_saved:
                return True
            else:
                print(f"  [WARN] 응답에 이미지가 없습니다 (attempt {attempt})")

        except Exception as e:
            print(f"  [ERROR] attempt {attempt}: {e}")

        if attempt < MAX_RETRIES:
            wait = DELAY_SECONDS * attempt
            print(f"  {wait}초 후 재시도...")
            time.sleep(wait)

    print(f"  [FAIL] {spec['path']} - {MAX_RETRIES}회 시도 모두 실패")
    return False


def main():
    print("=" * 60)
    print("  전자책 이미지 생성기 (Gemini 2.0 Flash)")
    print("=" * 60)
    print(f"  모델: {MODEL}")
    print(f"  저장 경로: {IMAGES_DIR}")
    print(f"  총 이미지: {len(IMAGE_SPECS)}개")
    print(f"  딜레이: {DELAY_SECONDS}초")
    print("=" * 60)
    print()

    # Gemini 클라이언트 초기화
    client = genai.Client(api_key=API_KEY)

    results = {"success": [], "skipped": [], "failed": []}

    for i, spec in enumerate(IMAGE_SPECS, 1):
        output_path = IMAGES_DIR / spec["path"]
        print(f"[{i}/{len(IMAGE_SPECS)}] {spec['description']} → {spec['path']}")

        if output_path.exists() and output_path.stat().st_size > 0:
            print(f"  [SKIP] 이미 존재")
            results["skipped"].append(spec["path"])
        else:
            ok = generate_image(client, spec)
            if ok:
                results["success"].append(spec["path"])
            else:
                results["failed"].append(spec["path"])

        # 다음 이미지 전 딜레이 (마지막 제외)
        if i < len(IMAGE_SPECS):
            time.sleep(DELAY_SECONDS)

        print()

    # ─── 결과 요약 ────────────────────────────────────────
    print("=" * 60)
    print("  결과 요약")
    print("=" * 60)
    print(f"  성공: {len(results['success'])}개")
    for p in results["success"]:
        print(f"    ✓ {p}")
    print(f"  스킵: {len(results['skipped'])}개")
    for p in results["skipped"]:
        print(f"    - {p}")
    print(f"  실패: {len(results['failed'])}개")
    for p in results["failed"]:
        print(f"    ✗ {p}")
    print("=" * 60)

    total = len(IMAGE_SPECS)
    ok_count = len(results["success"]) + len(results["skipped"])
    print(f"\n  완료: {ok_count}/{total} 이미지 준비됨")

    if results["failed"]:
        print("  실패한 이미지가 있습니다. 스크립트를 다시 실행하면 실패분만 재생성됩니다.")
        sys.exit(1)


if __name__ == "__main__":
    main()
