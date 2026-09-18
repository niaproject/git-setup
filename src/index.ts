#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface EnvConfig {
  userName: string;
  userEmail: string;
}

// dist/index.js から見たパッケージルート（.env.json の置き場所）
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(PACKAGE_ROOT, ".env.json");
const TEMPLATE_DIR = join(PACKAGE_ROOT, "template");
// template/.gitignore だとツール自身のリポジトリで効いてしまうため、ドット無しで置いている
const GITIGNORE_TEMPLATE = join(TEMPLATE_DIR, "gitignore");
const CLAUDE_TEMPLATE = join(TEMPLATE_DIR, ".claude");

function fail(message: string): never {
  console.error(`gsetup: ${message}`);
  process.exit(1);
}

function loadEnv(): EnvConfig {
  if (!existsSync(ENV_PATH)) {
    fail(`${ENV_PATH} が見つかりません。.env.example.json をコピーして作成してください。`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(ENV_PATH, "utf8"));
  } catch (e) {
    fail(`${ENV_PATH} の JSON が不正です: ${(e as Error).message}`);
  }

  const { userName, userEmail } = (parsed ?? {}) as Partial<EnvConfig>;
  if (typeof userName !== "string" || userName.trim() === "") {
    fail(`${ENV_PATH} の userName が未設定です。`);
  }
  if (typeof userEmail !== "string" || userEmail.trim() === "") {
    fail(`${ENV_PATH} の userEmail が未設定です。`);
  }
  return { userName: userName.trim(), userEmail: userEmail.trim() };
}

function git(args: string[]): void {
  try {
    execFileSync("git", args, { stdio: "inherit" });
  } catch {
    fail(`git ${args.join(" ")} に失敗しました。`);
  }
}

// 既存の .gitignore は上書きしない
function createGitignore(target: string): void {
  const dest = join(target, ".gitignore");
  if (existsSync(dest)) {
    console.log(".gitignore は既に存在するためスキップしました。");
    return;
  }
  if (!existsSync(GITIGNORE_TEMPLATE)) {
    fail(`${GITIGNORE_TEMPLATE} が見つかりません。`);
  }
  copyFileSync(GITIGNORE_TEMPLATE, dest);
  console.log(".gitignore を作成しました。");
}

// 既存ファイルは上書きせず、足りないファイルだけ追加する
function copyClaudeTemplate(target: string): void {
  if (!existsSync(CLAUDE_TEMPLATE)) {
    fail(`${CLAUDE_TEMPLATE} が見つかりません。`);
  }
  try {
    cpSync(CLAUDE_TEMPLATE, join(target, ".claude"), { recursive: true, force: false, errorOnExist: false });
  } catch (e) {
    fail(`.claude のコピーに失敗しました: ${(e as Error).message}`);
  }
  console.log(".claude をコピーしました（既存ファイルは保持）。");
}

function main(): void {
  const arg = process.argv[2];
  if (arg === "-h" || arg === "--help") {
    console.log("Usage: gsetup [directory]\n  git init、git config --local user.name / user.email、.gitignore 作成、template/.claude のコピーを実行します。");
    return;
  }

  const target = resolve(arg ?? ".");
  const { userName, userEmail } = loadEnv();

  git(["init", target]);
  git(["-C", target, "config", "--local", "user.name", userName]);
  git(["-C", target, "config", "--local", "user.email", userEmail]);

  console.log(`user.name  = ${userName}`);
  console.log(`user.email = ${userEmail}`);

  createGitignore(target);
  copyClaudeTemplate(target);
}

main();
