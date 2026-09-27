const { spawn } = require("node:child_process");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const spawnOptions = { stdio: "inherit", shell: process.platform === "win32" };
const rootDir = path.resolve(__dirname, "..");
const children = ["dev:server", "dev:client"].map((script) => {
  const child = process.platform === "win32"
    ? spawn(`${npmCommand} run ${script}`, { ...spawnOptions, cwd: rootDir })
    : spawn(npmCommand, ["run", script], { ...spawnOptions, cwd: rootDir });
  child.__label = script;
  return child;
});

// AI-service via uvicorn --reload (mesmo prefixo de logs, mesmo shutdown).
try {
  const aiCwd = path.join(rootDir, "ai-service");
  const aiArgs = ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"];
  const aiCmd = process.platform === "win32" ? `python ${aiArgs.join(" ")}` : "python";
  const ai = process.platform === "win32"
    ? spawn(aiCmd, { stdio: "inherit", shell: true, cwd: aiCwd })
    : spawn("python", aiArgs, { stdio: "inherit", shell: false, cwd: aiCwd });
  ai.__label = "dev:ai (uvicorn --reload)";
  ai.on("error", (error) => {
    console.error("[dev:ai] uvicorn não iniciado (ative o venv do ai-service):", error.message);
  });
  children.push(ai);
} catch (error) {
  console.error("[dev:ai] falha ao iniciar:", error.message);
}

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 1_000).unref();
}

for (const child of children) {
  child.on("error", (error) => {
    console.error("Não foi possível iniciar o ambiente:", error.message);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`Um dos serviços encerrou (${signal || code}).`);
      shutdown(code || 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
