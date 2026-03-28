import fs from "fs";
import path from "path";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { assertSafePath } from "../../utils/pathSafety";
import { uploadDir } from "../../middleware/uploadResume";

/**
 * Iterates through every page of a Resume PDF and natively burns a translucent
 * confidential attribution watermark.
 * If the file is not a PDF (word, md), this service gracefully returns the input path.
 */
export async function watermarkPdf(inputPath: string, text: string): Promise<string> {
  // Fix: Validate against the actual upload directory
  const safeInput = assertSafePath(inputPath, uploadDir);
  const ext = path.extname(safeInput).toLowerCase();

  // If not a PDF, we don't have a reliable native watermarker for Word/MD yet.
  // We return the original path to fulfill the contract without crashing.
  if (ext !== '.pdf') {
    return safeInput;
  }

  try {
    const bytes = fs.readFileSync(safeInput);
    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 6,
        y: height / 2,
        size: 40,
        color: rgb(0.75, 0.75, 0.75),
        rotate: degrees(-30),
        opacity: 0.4
      });
    }

    const outBytes = await pdf.save();
    const outPath = inputPath.replace(".pdf", "-wm.pdf");
    const safeOutput = assertSafePath(outPath, uploadDir);
    fs.writeFileSync(safeOutput, outBytes);
    return safeOutput;
  } catch (err: any) {
    console.warn(`[Watermark] PDF is possibly encrypted or malformed: ${err.message}`);
    return safeInput;
  }
}
