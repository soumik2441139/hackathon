import Resume from "../../models/Resume";
import { parseResumeWithLLM } from "../ai/resume.parser";
import { scoreResume } from "../scoring/resume.score";
import { log, logError } from "../../utils/logger";

export async function processResume(resumeId: string) {
  try {
    const resume = await Resume.findById(resumeId);
    if (!resume || resume.parsedData?.skills?.length) {
      log("PROCESS_RESUME", `Resume ${resumeId} already processed, or not found.`);
      return;
    }

    log("PROCESS_RESUME", `Starting AI processing for ${resumeId}`);
    
    // Uses Gemini to deeply parse the unstructured PDF text into JSON
    const parsed = await parseResumeWithLLM(resume.rawText);

    // Update the mongoose document with parsed info
    Object.assign(resume, parsed);

    // Evaluate resume quality focusing on student accomplishments
    const scoring = scoreResume(resume);
    resume.score = scoring.score;
    resume.scoreBreakdown = scoring.reasons;
    
    await resume.save();
    log("PROCESS_RESUME", `Successfully processed & scored ${resumeId}`);

  } catch (error) {
    logError("PROCESS_RESUME", `Failed to process resume ${resumeId}:`, error);
  }
}
