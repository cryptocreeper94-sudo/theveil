import { execSync } from "child_process";

if (!process.env.__BUILD_RELAUNCHED && !process.env.NODE_OPTIONS?.includes('max-old-space-size')) {
  process.env.__BUILD_RELAUNCHED = '1';
  try {
    execSync('npx tsx script/build.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, __BUILD_RELAUNCHED: '1', NODE_OPTIONS: '--max-old-space-size=4096' },
    });
    process.exit(0);
  } catch (e: any) {
    process.exit(e.status || 1);
  }
}

import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import * as crypto from "crypto";
import * as path from "path";

// Release automation - runs before build on publish
async function runRelease() {
  console.log('\n========================================');
  console.log('  DarkWave Chain Portal - Release');
  console.log('========================================\n');

  const schemaPath = path.join(process.cwd(), 'shared/schema.ts');
  const content = await readFile(schemaPath, 'utf-8');

  const match = content.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  const currentVersion = match ? match[1] : '1.0.0';
  console.log(`[Release] Current version: ${currentVersion}`);

  const parts = currentVersion.replace(/-.*$/, '').split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  const newVersion = parts.join('.');

  const updatedContent = content.replace(
    /APP_VERSION\s*=\s*"[^"]+"/,
    `APP_VERSION = "${newVersion}"`
  );
  await writeFile(schemaPath, updatedContent);
  console.log(`[Release] Version bumped to ${newVersion}`);

  const dataHash = crypto
    .createHash('sha256')
    .update(`darkwave-chain-portal-v${newVersion}-${Date.now()}`)
    .digest('hex');
  console.log(`[Release] Release hash: ${dataHash.slice(0, 16)}...`);
  console.log(`[Release] Ready for chain stamping on first request\n`);
}

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await runRelease();

  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild({
    mode: 'production',
    build: {
      chunkSizeWarningLimit: 5000,
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("copying server data files...");
  await mkdir("dist/server-data", { recursive: true });
  const dataFiles = [
    { src: "server/data/Through-The-Veil.pdf", dest: "dist/server-data/Through-The-Veil.pdf" },
    { src: "server/data/Through-The-Veil.epub", dest: "dist/server-data/Through-The-Veil.epub" },
  ];
  for (const { src, dest } of dataFiles) {
    if (existsSync(src)) {
      await copyFile(src, dest);
      console.log(`  copied ${src} -> ${dest}`);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
