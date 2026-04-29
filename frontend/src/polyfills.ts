import { Buffer } from "buffer";
import process from "process";

// Patch globals for Web3Auth / Torus / MetaMask provider packages that call
// process.nextTick at module-evaluation time inside their bundled chunks.
const g = globalThis as Record<string, unknown>;

g["global"] = globalThis;

// Always overwrite — the index.html IIFE must NOT set a fake Buffer stub,
// because any non-Uint8Array stub here will cause "Uint8Array expected" errors
// deep inside Web3Auth / ethers crypto code.
g["Buffer"] = Buffer;

const proc = (g["process"] as typeof process) ?? process;
g["process"] = proc;

if (typeof proc.nextTick !== "function") {
  proc.nextTick = function nextTick(
    fn: (...a: unknown[]) => void,
    ...args: unknown[]
  ) {
    Promise.resolve().then(() => fn(...args));
  };
}
