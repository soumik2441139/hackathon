import fs from "fs";
const pdf = require("pdf-parse");

export async function extractResumeText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text;
}
