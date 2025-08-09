import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// For ES modules, we need to recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to spawn a process with colored output
function spawnWithColor(command, args, cwd, color) {
  const process = spawn(command, args, {
    cwd: cwd,
    stdio: "pipe",
    shell: true,
  });

  const colorCodes = {
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    reset: "\x1b[0m",
  };

  const prefix = colorCodes[color] || "";
  const reset = colorCodes.reset;

  process.stdout.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => {});
  });

  process.stderr.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => {});
  });

  process.on("close", (code) => {});

  return process;
}

// Check if Python is available
function checkPython() {
  return new Promise((resolve) => {
    const pythonTest = spawn("python", ["--version"], { stdio: "pipe" });
    pythonTest.on("close", (code) => {
      if (code === 0) {
        resolve("python");
      } else {
        const python3Test = spawn("python3", ["--version"], { stdio: "pipe" });
        python3Test.on("close", (code) => {
          resolve(code === 0 ? "python3" : null);
        });
      }
    });
  });
}

async function startDevelopment() {
  // Check Python availability
  const pythonCmd = await checkPython();

  if (!pythonCmd) {
    process.exit(1);
  }

  // Start Python API
  const pythonProcess = spawnWithColor(
    pythonCmd,
    [
      "-m",
      "uvicorn",
      "main:app",
      "--reload",
      "--host",
      "127.0.0.1",
      "--port",
      "8000",
    ],
    path.join(__dirname, "python-api"),
    "green"
  );

  // Wait a bit for Python API to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Start Next.js
  const nextProcess = spawnWithColor("npm", ["run", "dev"], __dirname, "blue");

  // Handle process cleanup
  function cleanup() {
    pythonProcess.kill();
    nextProcess.kill();
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

startDevelopment().catch((error) => {
  process.exit(1);
});
