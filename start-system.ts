import { spawn } from "child_process";
import path from "path";
import "dotenv/config";

const logPrefix = (name: string, data: any) => {
    process.stdout.write(`\n[${name}] ${data}`);
};

const runProcess = (name: string, command: string, args: string[], cwd: string) => {
    console.log(`🚀 Starting ${name}...`);
    const proc = spawn(command, args, { cwd, shell: true });

    proc.stdout.on("data", (data) => logPrefix(name, data));
    proc.stderr.on("data", (data) => logPrefix(`ERR-${name}`, data));
    proc.on("close", (code) => console.log(`🛑 ${name} exited with code ${code}`));

    return proc;
};

const rootDir = process.cwd();

// Spin up complete ecosystem concurrently
runProcess("Frontend", "npm", ["run", "dev"], path.join(rootDir, "opushire"));
runProcess("Backend API", "npm", ["run", "start"], path.join(rootDir, "opushire-backend"));
runProcess("CrewAI Core", "python", ["-m", "agents.crew.run"], rootDir);
runProcess("CrewAI MongoTriggers", "python", ["-m", "agents.run_triggers"], rootDir);
