const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const GEMINI_API_KEY = "***REMOVED***";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const STYLE =
  "Clean, minimal infographic style. Pastel colors (lavender #9B89B3, mint #A8E6CF, peach #FFD3B6). Korean text labels. Simple icons and shapes. White background. Horizontal layout. No photographs.";

const diagrams = {
  "diagram01-sleep-comparison.png": `Infographic comparing sleep patterns of normal children vs children with developmental disabilities. Two side-by-side bar charts. Left side labeled 일반 아동 with short bars showing 20min sleep onset, 1 night waking, 10hr total sleep. Right side labeled 발달장애 아동 with longer bars showing 60-90min sleep onset, 4-5 night wakings, 7-8hr total sleep. ${STYLE}`,

  "diagram02-brain-pathway.png": `Educational brain diagram showing olfactory pathway. Simplified cute nose on left, arrow labeled 후각 신경 to a brain showing 편도체 (labeled 감정의 뇌) and 해마 (labeled 기억의 뇌). Flowing arrows connecting them. ${STYLE}`,

  "diagram03-comparison.png": `Bar chart comparing three groups. Group A 향기만: 18min improvement. Group B 호흡만: 15min improvement. Group C 향기+호흡: 32min improvement. Combined group clearly the tallest bar. Title: 수면 개선 효과 비교. ${STYLE}`,

  "diagram04-oils.png": `Three essential oil bottles. Purple bottle with lavender flower labeled 라벤더, orange bottle with citrus fruit labeled 오렌지, brown bottle with cedar tree labeled 시더우드. Clean arrangement. ${STYLE}`,

  "diagram04-room-layout.png": `Simple room layout diagram from above. Bed in center, diffuser 1-2m away marked with dotted line showing distance, small basket of tools nearby, warm light icon, window with curtains. Korean labels. ${STYLE}`,

  "diagram05-timeline.png": `Horizontal timeline showing 4 steps of Week 1 routine: Step 1 분위기 만들기 3분 (dim light icon), Step 2 향기 소개 5-7분 (diffuser icon), Step 3 호흡 놀이 5분 (bubble icon), Step 4 마무리 2-3분 (bed icon). Total 15-20분. ${STYLE}`,

  "diagram06-timeline.png": `Horizontal timeline for Week 2: Step 1 분위기 2분, Step 2 향기 맡기 3분 (nose icon), Step 3 향기 호흡 훈련 7-8분 (breathing icon), Step 4 마무리+잠자리 3-5분 (moon icon). Total 20분. ${STYLE}`,

  "diagram06-breathing-steps.png": `Three-step progression: Step 1 꽃향기 놀이 (flower nose icon), arrow to Step 2 향기+호흡 연결 (diffuser+breath icon), arrow to Step 3 호흡 리듬 (rhythm wave icon). Shows increasing skill level. ${STYLE}`,

  "diagram07-routine.png": `Vertical timeline showing 30min bedtime routine: -30분 스크린 OFF, -25분 디퓨저 ON, -15분 호흡 훈련, -5분 잠자리 마무리, 0분 잠들기. Gradual color from light yellow to deep purple. ${STYLE}`,

  "diagram07-belly-breathing.png": `Side view illustration of belly breathing: child lying down with stuffed animal on belly. Two panels: left shows 들이마시기 with belly/animal going up with upward arrow, right shows 내쉬기 with belly/animal going down with downward arrow. ${STYLE}`,

  "diagram08-progress.png": `Line graph showing 4-week improvement. X-axis: 시작전, 1주차, 2주차, 3주차, 4주차. Blue line 입면 시간 dropping from high to low. Red line 밤중 각성 also dropping. Clear positive trend. ${STYLE}`,

  "diagram09-minjun-progress.png": `Dual chart for Minjun case. Blue bars showing sleep onset: 90, 60, 40, 25, 20 minutes across weeks. Orange dots connected by line showing night wakings: 5.5, 5, 4, 3, 1.5. Weeks labeled 시작전 through 4주차. ${STYLE}`,

  "diagram10-seoyeon-progress.png": `Chart for Seoyeon. Bars showing bedtime getting earlier: 23시, 22시, 21시30분, 21시, 21시. Additional indicator showing sleep refusal decreasing from 매일 to 거의 없음. ${STYLE}`,

  "diagram11-jihoon-progress.png": `Chart showing sleep time range narrowing for Jihoon. Wide bars narrowing: Week 0 range 19시-24시, Week 1 range 20시-23시, Week 2 range 20시30분-22시, Week 3 range 21시-22시, Week 4 range 21시-21시30분. ${STYLE}`,

  "diagram-part2-overview.png": `Flowchart of 4-week program: 5 boxes connected by arrows. 준비 (checklist icon) → 1주차 향기 친해지기 (flower icon) → 2주차 호흡 훈련 (lungs icon) → 3주차 수면 루틴 (moon icon) → 4주차 습관화 (checkmark icon). ${STYLE}`,
};

async function generateDiagram(filename, prompt) {
  const outputDir = path.join(__dirname, "..", "images", "diagrams");
  const outputPath = path.join(outputDir, filename);

  if (!process.argv.includes("--force") && fs.existsSync(outputPath)) {
    console.log("  Skip:", filename);
    return "skipped";
  }

  try {
    console.log("  Generating:", filename);

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    if (response.candidates && response.candidates[0]) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data, "base64");
          if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(outputPath, buffer);
          console.log(
            `  Saved: ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`
          );
          return "success";
        }
      }
    }
    console.log("  No image:", filename);
    return "no_image";
  } catch (e) {
    console.error("  Error:", filename, e.message);
    return "error";
  }
}

async function main() {
  console.log("=== Diagram Generation (Nano Banana Pro) ===\n");
  const entries = Object.entries(diagrams);
  console.log(`Total: ${entries.length} diagrams\n`);

  let success = 0,
    skip = 0,
    fail = 0;
  for (const [filename, prompt] of entries) {
    const result = await generateDiagram(filename, prompt);
    if (result === "success") {
      success++;
      await new Promise((r) => setTimeout(r, 3000));
    } else if (result === "skipped") skip++;
    else fail++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Success: ${success} | Skipped: ${skip} | Failed: ${fail}`);
}

main().catch(console.error);
