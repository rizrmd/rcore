#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

const configPath = join(process.cwd(), "config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));

const domains: string[] = [];

// Extract production domains from config.json
for (const [siteName, siteConfig] of Object.entries(config.sites)) {
  if (siteConfig && typeof siteConfig === "object" && "domains" in siteConfig) {
    const site = siteConfig as { domains: string[]; isDefault?: boolean };
    // Only add production domains (not .local domains)
    const prodDomains = site.domains.filter((d: string) => !d.endsWith(".local"));
    domains.push(...prodDomains);
  }
}

console.log("🚀 Fly.io Multi-Domain Deployment Script");
console.log("========================================");
console.log("");

async function runCommand(cmd: string, description: string, ignoreError = false) {
  console.log(`📋 ${description}...`);
  try {
    await $`sh -c "${cmd}"`;
    console.log(`✅ ${description} berhasil`);
    return true;
  } catch (error) {
    if (ignoreError) {
      return false;
    }
    console.error(`❌ ${description} gagal:`, error);
    throw error;
  }
}

async function checkResourceExists(resource: string, checkCmd: string): Promise<boolean> {
  try {
    await $`sh -c "${checkCmd}"`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    console.log("Penggunaan:");
    console.log("  bun run scripts/fly-deploy.ts setup     - Setup awal (buat app, volume, tambah domain)");
    console.log("  bun run scripts/fly-deploy.ts secrets   - Set environment variables yang diperlukan");
    console.log("  bun run scripts/fly-deploy.ts deploy    - Deploy aplikasi");
    console.log("  bun run scripts/fly-deploy.ts domains   - Tambah semua domain");
    console.log("  bun run scripts/fly-deploy.ts status    - Cek status deployment");
    console.log("");
    console.log("Domain yang akan dideploy:");
    domains.forEach(d => console.log(`  - ${d}`));
    return;
  }

  switch (command) {
    case "setup":
      console.log("🔧 Setup Fly.io untuk Esensi...\n");
      
      // Check if app exists
      console.log("🔍 Memeriksa apakah app sudah ada...");
      const appExists = await checkResourceExists("app", "fly apps list | grep -w esensi");
      
      if (appExists) {
        console.log("ℹ️  App 'esensi' sudah ada, skip pembuatan app");
      } else {
        await runCommand("fly apps create esensi", "Membuat app esensi");
        // Set region after creating app
        await runCommand("fly regions set sin --app esensi", "Set region ke Singapore", true);
      }

      // Check if volume exists
      console.log("\n🔍 Memeriksa apakah volume sudah ada...");
      const volumeExists = await checkResourceExists("volume", "fly volumes list --app esensi | grep esensi_uploads");
      
      if (volumeExists) {
        console.log("ℹ️  Volume 'esensi_uploads' sudah ada, skip pembuatan volume");
      } else {
        await runCommand("fly volumes create esensi_uploads --size 10 --app esensi --region sin --yes", "Membuat volume untuk file uploads di Singapore");
      }

      // Add domains
      await addDomains();
      
      console.log("\n✅ Setup selesai! Langkah selanjutnya:");
      console.log("1. Konfigurasi DNS untuk setiap domain");
      console.log("2. Jalankan: bun run scripts/fly-deploy.ts deploy");
      break;

    case "secrets":
      console.log("🔐 Setting secrets untuk Esensi...");
      console.log("\n⚠️  PENTING: Anda perlu menyediakan nilai untuk secret berikut:");
      console.log("1. DATABASE_URL - Connection string untuk database");
      console.log("2. BETTER_AUTH_SECRET - Secret key untuk autentikasi");
      console.log("");
      console.log("Contoh command:");
      console.log('  fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/dbname" --app esensi');
      console.log('  fly secrets set BETTER_AUTH_SECRET="your-secret-key-here" --app esensi');
      console.log("");
      console.log("Optional secrets:");
      console.log('  fly secrets set GOOGLE_CLIENT_ID="your-google-client-id" --app esensi');
      console.log('  fly secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret" --app esensi');
      console.log("");
      console.log("Untuk melihat secrets yang sudah diset:");
      console.log("  fly secrets list --app esensi");
      break;

    case "domains":
      await addDomains();
      break;

    case "deploy":
      console.log("🚀 Deploying aplikasi ke Fly.io...");
      
      // Check if secrets are set
      console.log("\n🔍 Memeriksa secrets...");
      try {
        const secretsResult = await $`fly secrets list --app esensi`.quiet();
        const secrets = secretsResult.stdout.toString();
        
        if (!secrets.includes("DATABASE_URL")) {
          console.error("❌ DATABASE_URL belum diset! Jalankan 'bun fly secrets' untuk info lebih lanjut.");
          process.exit(1);
        }
        
        if (!secrets.includes("BETTER_AUTH_SECRET")) {
          console.error("❌ BETTER_AUTH_SECRET belum diset! Jalankan 'bun fly secrets' untuk info lebih lanjut.");
          process.exit(1);
        }
        
        console.log("✅ Secrets sudah diset");
      } catch (error) {
        console.error("⚠️  Tidak bisa mengecek secrets, lanjut deploy...");
      }
      
      await runCommand("fly deploy --app esensi", "Deploy aplikasi");
      console.log("\n✅ Deploy selesai!");
      console.log("Cek status dengan: bun run scripts/fly-deploy.ts status");
      break;

    case "status":
      console.log("📊 Status deployment:");
      await runCommand("fly status --app esensi", "Cek status app");
      console.log("\n📍 IP addresses:");
      await runCommand("fly ips list --app esensi", "List IP addresses");
      console.log("\n🔒 SSL Certificates:");
      await runCommand("fly certs list --app esensi", "List certificates");
      break;

    default:
      console.error(`❌ Command tidak dikenal: ${command}`);
      console.log("Gunakan 'help' untuk melihat daftar command");
      process.exit(1);
  }
}

async function addDomains() {
  console.log("\n🌐 Menambahkan domain...");
  
  // Check existing certificates (domains are managed via certificates in new Fly)
  let existingDomains: string[] = [];
  try {
    const result = await $`fly certs list --app esensi`.quiet();
    existingDomains = result.stdout.toString()
      .split('\n')
      .slice(1) // Skip header
      .map(line => line.trim().split(/\s+/)[0])
      .filter(Boolean);
  } catch {
    console.log("⚠️  Tidak bisa mengecek domain yang sudah ada");
  }

  for (const domain of domains) {
    if (existingDomains.includes(domain)) {
      console.log(`ℹ️  Domain ${domain} sudah terdaftar`);
    } else {
      const success = await runCommand(`fly certs add ${domain} --app esensi`, `Menambahkan certificate untuk ${domain}`, true);
      if (!success) {
        console.log(`⚠️  Gagal menambahkan ${domain}, mungkin sudah ada atau ada error lain`);
      }
    }
  }
  
  console.log("\n📌 Konfigurasi DNS:");
  console.log("Tambahkan DNS record berikut di domain registrar Anda:");
  console.log("\nUntuk mendapatkan IP addresses, jalankan:");
  console.log("  fly ips list");
  console.log("\nSetiap domain perlu:");
  console.log("  - A record → IPv4 address dari Fly");
  console.log("  - AAAA record → IPv6 address dari Fly");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});