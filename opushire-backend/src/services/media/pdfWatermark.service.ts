import fs from "fs";
import { PDFDocument, rgb, degrees } from "pdf-lib";

/**
 * Iterates through every page of a Resume PDF and natively burns a translucent
 * confidential attribution watermark diagonally to discourage leaks via screenshots.
 */
export async function watermarkPdf(inputPath: string, text: string): Promise<string> {
  const bytes = fs.readFileSync(inputPath);
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
  fs.writeFileSync(outPath, outBytes);
  return outPath;
}
