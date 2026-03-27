import fs from "fs";
const pdf = require("pdf-parse");
import { assertSafePath } from "./pathSafety";
import os from "os";

export async function extractResumeText(filePath: string): Promise<string> {
  const safePath = assertSafePath(filePath, os.tmpdir());
  const buffer = fs.readFileSync(safePath);
  const data = await pdf(buffer);
  return data.text;
}
