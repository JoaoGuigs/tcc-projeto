const { spawn } = require("node:child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const spawnOptions = { stdio: "inherit", shell: process.platform === "win32" };
const children = ["dev:server", "dev:client"].map((script) => (
  process.platform === "win32"
    ? spawn(`${npmCommand} run ${script}`, spawnOptions)
    : spawn(npmCommand, ["run", script], spawnOptions)
));

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
