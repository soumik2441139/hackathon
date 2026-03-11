export function log(scope: string, msg: string, data: any = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] [${scope}] ${msg}`, data);
  } else {
    console.log(`[${timestamp}] [${scope}] ${msg}`);
  }
}

export function logError(scope: string, msg: string, error: any = null) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] [${scope}] ${msg}`, error || "");
}
