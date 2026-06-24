import fs from "fs";
import path from "path";

const dir = "PROJECT_DOCUMENTATION";

async function extractAll() {
  // Try pdf-parse first
  try {
    const pdf = await import("pdf-parse");
    const files = [
      "RESTAURANT DIGITAL PLATFORM.pdf",
      "Restaurant_POS_Market_Analysis_and_Build_Plan.pdf",
    ];
    for (const f of files) {
      const buf = fs.readFileSync(path.join(dir, f));
      const data = await pdf.default(buf);
      console.log(`\n===== ${f} =====`);
      console.log(data.text.substring(0, 25000));
    }
  } catch (e: any) {
    console.error("pdf-parse failed:", e.message);
  }
}

extractAll();
