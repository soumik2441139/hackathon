import EventEmitter from "events";

class SystemEventBus extends EventEmitter {}

// Singleton export to ensure entire backend shares the same event stream
export const eventBus = new SystemEventBus();

// Defined Event Signatures Documented Here:
// "resume_uploaded" : (resumeId: string) => void
