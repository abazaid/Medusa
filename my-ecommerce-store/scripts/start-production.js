const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = process.cwd()
const BUILT_SERVER_DIR = path.join(ROOT, ".medusa", "server")
const ADMIN_INDEX = path.join(BUILT_SERVER_DIR, "public", "admin", "index.html")
const CLI = path.join(ROOT, "node_modules", "@medusajs", "cli", "cli.js")

function runCli(args, cwd) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    stdio: "inherit",
    env: process.env,
  })

  if (result.error) {
    console.error(`[start-production] Failed to run Medusa CLI: ${result.error.message}`)
    process.exit(1)
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status)
  }
}

if (!fs.existsSync(CLI)) {
  console.error("[start-production] Medusa CLI is missing. Run npm install first.")
  process.exit(1)
}

if (!fs.existsSync(ADMIN_INDEX)) {
  console.log("[start-production] Missing admin build. Running `medusa build`...")
  runCli(["build"], ROOT)
}

console.log("[start-production] Running database migrations...")
runCli(["db:migrate"], ROOT)

if (!fs.existsSync(BUILT_SERVER_DIR)) {
  console.error("[start-production] Built server directory not found after build.")
  process.exit(1)
}

console.log("[start-production] Starting Medusa from .medusa/server...")
runCli(["start"], BUILT_SERVER_DIR)
