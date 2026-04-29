import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

// Load root .env into process.env (shell env takes priority — never overrides)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] ??= val;
  }
  process.stderr.write("Loaded .env from project root\n");
}

const children = new Set();
let shuttingDown = false;

function canListen(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < 65536 && !(await canListen(port))) {
    port += 1;
  }
  if (port >= 65536) {
    throw new Error(`No available port found starting at ${startPort}`);
  }
  return port;
}

function startService(service) {
  const pnpmExecPath = process.env.npm_execpath;
  const command = pnpmExecPath ? process.execPath : "pnpm";
  const args = pnpmExecPath ? [pnpmExecPath, ...service.args] : service.args;

  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: service.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.add(child);

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(`[${service.name}] ${chunk.toString()}`);
  });

  child.stderr?.on("data", (chunk) => {
    process.stderr.write(`[${service.name}] ${chunk.toString()}`);
  });

  child.on("error", (error) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    process.stderr.write(
      `[${service.name}] failed to start: ${error.message}\n`,
    );
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    const reason =
      signal !== null ? `signal ${signal}` : `exit code ${code ?? "unknown"}`;

    process.stderr.write(`[${service.name}] stopped with ${reason}\n`);
    shutdown(code ?? 1);
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 5000).unref();

  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

(async () => {
  const frontendPort = await findAvailablePort(
    Number(process.env.FRONTEND_PORT ?? "5173"),
  );
  const apiPort = await findAvailablePort(Number(process.env.API_PORT ?? "3001"));
  const apiProxyTarget =
    process.env.API_PROXY_TARGET ?? `http://127.0.0.1:${apiPort}`;

  const services = [
    {
      name: "api",
      args: ["--filter", "./Backend", "run", "dev"],
      env: {
        ...process.env,
        NODE_ENV: "development",
        PORT: String(apiPort),
      },
    },
    {
      name: "web",
      args: ["--filter", "./frontend", "run", "dev"],
      env: {
        ...process.env,
        PORT: String(frontendPort),
        BASE_PATH: process.env.BASE_PATH ?? "/",
        API_PROXY_TARGET: apiProxyTarget,
      },
    },
  ];

  for (const service of services) {
    startService(service);
  }

  process.stdout.write(
    "DecentraliTrack dev stack starting:\n" +
      `  web: http://127.0.0.1:${frontendPort}\n` +
      `  api: http://127.0.0.1:${apiPort}\n`,
  );
})().catch((error) => {
  process.stderr.write(`Failed to start dev stack: ${String(error)}\n`);
  process.exitCode = 1;
});
