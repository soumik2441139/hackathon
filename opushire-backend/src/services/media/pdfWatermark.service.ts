import fs from "fs";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { assertSafePath } from "../../utils/pathSafety";
import os from "os";

/**
 * Iterates through every page of a Resume PDF and natively burns a translucent
 * confidential attribution watermark diagonally to discourage leaks via screenshots.
 */
export async function watermarkPdf(inputPath: string, text: string): Promise<string> {
  const safeInput = assertSafePath(inputPath, os.tmpdir());
  const bytes = fs.readFileSync(safeInput);
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    page.drawText(text, {
      x: width / 6,
      y: height / 2,
      size: 40,
      color: rgb(0.75, 0.75, 0.75), // Light Gray
      rotate: degrees(-30),         // Diagonal
      opacity: 0.4                  // Transparent enough to read text behind it
    });
  }

  const outBytes = await pdf.save();
  const outPath = inputPath.replace(".pdf", "-wm.pdf");
  const safeOutput = assertSafePath(outPath, os.tmpdir());
  fs.writeFileSync(safeOutput, outBytes);
  return safeOutput;
}
