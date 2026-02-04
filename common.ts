import "dotenv/config";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";

/** Read required env var or throw. */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/** Optional env var. */
export function envOpt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

/** Get JSON-RPC provider. */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(env("RPC_URL"));
}

/** Create a wallet from env var name. */
export function getWallet(keyEnv: string, provider: ethers.Provider): ethers.Wallet {
  const pk = envOpt(keyEnv);
  if (!pk) throw new Error(`Missing private key env var: ${keyEnv}`);
  return new ethers.Wallet(pk, provider);
}

/** Load JSON file if exists, otherwise return fallback. */
export function loadJson<T>(p: string, fallback: T): T {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

/** Save JSON to disk (creates directory). */
export function saveJson(p: string, data: unknown): void {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
}
