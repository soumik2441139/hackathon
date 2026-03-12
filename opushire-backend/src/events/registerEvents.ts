import { eventBus } from "./eventBus";
import { processResume } from "../services/resume/processResume";
import { log } from "../utils/logger";
import { registerChangeStreams } from "./changeStreams";

export function registerGlobalEvents() {
    eventBus.on("resume_uploaded", async (resumeId: string) => {
        log("EVENT_BUS", `Triggered 'resume_uploaded' processing for ID: ${resumeId}`);
        await processResume(resumeId);
    });

    // Start MongoDB Change Stream → BullMQ triggers
    registerChangeStreams();
}
