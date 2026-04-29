import { spawn } from "node:child_process";
import net from "node:net";

const rootDir = new URL("..", import.meta.url);
const hardhatPort = Number(process.env.HARDHAT_PORT ?? "8545");
const hardhatRpcUrl = process.env.HARDHAT_RPC_URL ?? `http://127.0.0.1:${hardhatPort}`;
const children = new Set();
let shuttingDown = false;

function pnpmCommand(args) {
  const pnpmExecPath = process.env.npm_execpath;
  return pnpmExecPath
    ? { command: process.execPath, args: [pnpmExecPath, ...args] }
    : { command: "pnpm", args };
}

function start(name, args) {
  const command = pnpmCommand(args);
  const child = spawn(command.command, command.args, {
    cwd: rootDir,
    env: { ...process.env, HARDHAT_RPC_URL: hardhatRpcUrl },
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.add(child);
  child.stdout?.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk.toString()}`));
  child.stderr?.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk.toString()}`));
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `exit code ${code ?? "unknown"}`;
    process.stderr.write(`[${name}] stopped with ${reason}\n`);
    shutdown(code ?? 1);
  });
  child.on("error", (error) => {
    children.delete(child);
    if (shuttingDown) return;
    process.stderr.write(`[${name}] failed to start: ${error.message}\n`);
    shutdown(1);
  });
}

function waitForPort(port, host = "127.0.0.1", timeoutMs = 30_000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ port, host });
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

function canListen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

function runOnce(name, args) {
  const command = pnpmCommand(args);
  return new Promise((resolve, reject) => {
    const child = spawn(command.command, command.args, {
      cwd: rootDir,
      env: { ...process.env, HARDHAT_RPC_URL: hardhatRpcUrl },
      stdio: ["inherit", "pipe", "pipe"],
    });

    child.stdout?.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk.toString()}`));
    child.stderr?.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk.toString()}`));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} exited with code ${code ?? "unknown"}`));
    });
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
  }, 5000).unref();
  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  if (!(await canListen(hardhatPort))) {
    throw new Error(
      `Port ${hardhatPort} is already in use. Stop the existing process or set HARDHAT_PORT/HARDHAT_RPC_URL to another local port.`,
    );
  }

  process.stdout.write("Compiling contracts before starting the local chain...\n");
  await runOnce("compile", ["--filter", "./contracts", "run", "compile"]);

  process.stdout.write(`Starting local Hardhat chain at ${hardhatRpcUrl}\n`);
  start("chain", ["--filter", "./contracts", "exec", "hardhat", "node", "--hostname", "127.0.0.1", "--port", String(hardhatPort)]);
  await waitForPort(hardhatPort);
  process.stdout.write("Local chain is ready. Deploying DecentraliTrack contracts...\n");
  await runOnce("deploy", ["--filter", "./contracts", "run", "deploy:local"]);
  process.stdout.write(
    "\nLocal contracts are deployed and .env.localchain has been written.\n" +
      "Keep this process running while you use the app. Press Ctrl+C to stop the chain.\n",
  );
} catch (error) {
  process.stderr.write(`Failed to start local chain: ${error.message ?? String(error)}\n`);
  shutdown(1);
}
