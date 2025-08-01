#!/usr/bin/env bun
import { existsSync, chmodSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const gitHooksDir = join(process.cwd(), ".git", "hooks");
const prePushPath = join(gitHooksDir, "pre-push");

const prePushContent = `#!/bin/sh
#
# Pre-push hook that runs typecheck before allowing push
# This hook prevents pushing when TypeScript errors exist
#

echo "Running typecheck before push..."

# Run bun typecheck
if ! bun typecheck; then
    echo ""
    echo "❌ TypeScript errors found!"
    echo "Please fix all TypeScript errors before pushing."
    echo "Run 'bun typecheck' to see the errors."
    exit 1
fi

echo "✅ TypeScript check passed!"
exit 0
`;

try {
  // Check if hook already exists with the same content
  if (existsSync(prePushPath)) {
    const existingContent = readFileSync(prePushPath, "utf-8");
    if (existingContent.trim() === prePushContent.trim()) {
      // Hook already set up correctly, exit silently
      process.exit(0);
    }
  }

  // Only print when actually setting up
  console.log("Setting up git hooks...");
  
  // Create the pre-push hook
  writeFileSync(prePushPath, prePushContent);
  
  // Make it executable
  chmodSync(prePushPath, 0o755);
  
  console.log("✅ Git pre-push hook installed successfully");
} catch (error) {
  console.error("❌ Failed to set up git hooks:", error);
  process.exit(1);
}