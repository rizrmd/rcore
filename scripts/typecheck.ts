#!/usr/bin/env bun
import { spawn } from "bun";
import { readFile, writeFile, rename, mkdir, cp, rm } from "fs/promises";
import { parse as parseJsonc } from "jsonc-parser";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const FRONTEND_TSCONFIG = "frontend/tsconfig.json";
const BACKEND_TSCONFIG = "backend/tsconfig.json";
const GEN_FOLDER = "frontend/src/lib/gen";
const GEN_BACKUP = join(tmpdir(), `esensi-gen-backup-${Date.now()}`);

// Helper function to handle cross-device moves and permission errors
async function safeMove(source: string, destination: string) {
  try {
    await rename(source, destination);
  } catch (error: any) {
    if (error.code === 'EXDEV' || error.code === 'EPERM') {
      // Cross-device link or permission error, use copy + remove
      await cp(source, destination, { recursive: true });
      await rm(source, { recursive: true });
    } else {
      throw error;
    }
  }
}

async function runTypecheck(
  projectPath: string,
  name: string
): Promise<number> {
  console.log(`Running typecheck for ${name}...`);
  const proc = spawn({
    cmd: ["bun", "tsc", "-p", projectPath, "--noEmit"],
    stdio: ["inherit", "inherit", "inherit"],
  });
  return await proc.exited;
}

async function main() {
  let frontendExitCode = 0;
  let backendExitCode = 0;

  try {
    // Temporarily remove gen folder if it exists, but preserve specific files
    if (existsSync(GEN_FOLDER)) {
      await mkdir(GEN_BACKUP, { recursive: true });
      
      // Copy the entire gen folder to backup
      await safeMove(GEN_FOLDER, GEN_BACKUP);
      
      // Recreate gen folder and restore specific files
      await mkdir(GEN_FOLDER, { recursive: true });
      
      // Restore routes.ts and base-url.ts if they exist
      const routesPath = join(GEN_BACKUP, "routes.ts");
      const baseUrlPath = join(GEN_BACKUP, "base-url.ts");
      
      if (existsSync(routesPath)) {
        await safeMove(routesPath, join(GEN_FOLDER, "routes.ts"));
      }
      
      if (existsSync(baseUrlPath)) {
        await safeMove(baseUrlPath, join(GEN_FOLDER, "base-url.ts"));
      }
      
      // Create empty API files with any exports
      const apiFiles = [
        "auth.esensi.ts",
        "chapter.esensi.ts", 
        "main.esensi.ts",
        "internal.esensi.ts",
        "publish.esensi.ts"
      ];
      
      for (const file of apiFiles) {
        await writeFile(join(GEN_FOLDER, file), "export const api = {} as any;\n");
      }
    }
    
    // Frontend typecheck with backend references disabled
    const originalConfig = await readFile(FRONTEND_TSCONFIG, "utf-8");
    const config = parseJsonc(originalConfig);

    // Create modified config without backend references and excluding gen folder
    const modifiedConfig = {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        paths: {
          ...config.compilerOptions.paths,
          "backend/*": undefined,
        },
      },
      include:
        config.include?.filter((path: string) => !path.includes("backend")) ||
        [],
      exclude: [...(config.exclude || []), "src/lib/gen/**/*"],
    };

    // Remove undefined values from paths
    if (modifiedConfig.compilerOptions.paths) {
      Object.keys(modifiedConfig.compilerOptions.paths).forEach((key) => {
        if (modifiedConfig.compilerOptions.paths[key] === undefined) {
          delete modifiedConfig.compilerOptions.paths[key];
        }
      });
    }

    // Write modified config
    await writeFile(FRONTEND_TSCONFIG, JSON.stringify(modifiedConfig, null, 2));

    // Run frontend typecheck
    frontendExitCode = await runTypecheck(FRONTEND_TSCONFIG, "frontend");

    // Restore original config
    await writeFile(FRONTEND_TSCONFIG, originalConfig);

    // Run backend typecheck
    backendExitCode = await runTypecheck(BACKEND_TSCONFIG, "backend");

    // Exit with non-zero if either failed
    const finalExitCode = frontendExitCode || backendExitCode;
    if (finalExitCode === 0) {
      console.log("All typechecks passed!");
    }
    process.exit(finalExitCode);
  } catch (error) {
    console.error("Typecheck failed:", error);

    // Restore gen folder if it was backed up
    try {
      if (existsSync(GEN_BACKUP)) {
        // Move all backup files back to gen folder
        const { readdir } = await import("fs/promises");
        const backupFiles = await readdir(GEN_BACKUP);
        
        for (const file of backupFiles) {
          const sourcePath = join(GEN_BACKUP, file);
          const targetPath = join(GEN_FOLDER, file);
          await safeMove(sourcePath, targetPath);
        }
        
        // Remove empty backup directory
        await import("fs/promises").then(fs => fs.rmdir(GEN_BACKUP));
      }
    } catch (restoreGenError) {
      console.error("Failed to restore gen folder:", restoreGenError);
    }

    process.exit(1);
  }
}

main();
