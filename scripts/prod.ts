#!/usr/bin/env bun
import { $ } from "bun";
import { join } from "path";

// Generate Prisma models if they don't exist
if (!(await Bun.file(join(process.cwd(), "shared", "models", "index.js")).exists())) {
  console.log("Generating prisma typings...");
  await $`bun prisma generate`.cwd(join(process.cwd(), "shared")).quiet();
}

// Run the production server
await $`bun run --silent --no-clear-screen ./backend/src/index.tsx`;