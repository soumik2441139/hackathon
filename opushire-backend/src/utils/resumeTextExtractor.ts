import fs from "fs";
import path from "path";
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
import { assertSafePath } from "./pathSafety";
import { uploadDir } from "../middleware/uploadResume";

/**
 * Enhanced text extractor that supports PDF, Word (.docx), and Markdown/Plain Text.
 */
export async function extractResumeText(filePath: string): Promise<string> {
  // Fix: Validate against the actual upload directory, not just /tmp
  const safePath = assertSafePath(filePath, uploadDir);
  const ext = path.extname(safePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(safePath);
      const data = await pdf(buffer);
      return data.text || '';
    } 
    
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: safePath });
      return result.value || '';
    }

    if (ext === '.md' || ext === '.txt') {
      return fs.readFileSync(safePath, 'utf-8');
    }

    throw new Error(`Unsupported file type for text extraction: ${ext}`);
  } catch (err: any) {
    console.error(`[Extractor] Failed to parse ${ext} file:`, err.message);
    throw new Error(`Failed to read resume content: ${err.message}`);
  }
}
