import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";

if (!process.env.__BUILD_RELAUNCHED && !process.env.NODE_OPTIONS?.includes('max-old-space-size')) {
  const { execSync } = await import("child_process");
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

// Bundle these deps into the server to reduce cold start syscalls
const allowlist = [
  "compression",
  "express",
  "express-session",
  "memorystore",
  "openai",
];

async function buildAll() {
  console.log("\n========================================");
  console.log("  Through The Veil — Build");
  console.log("========================================\n");

  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  await viteBuild({
    mode: "production",
    build: {
      chunkSizeWarningLimit: 3000,
      minify: "esbuild",
      sourcemap: false,
    },
  });

  console.log("Building server...");
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

  console.log("Copying ebook files...");
  await mkdir("dist/server-data", { recursive: true });
  const dataFiles = [
    { src: "server/data/Through-The-Veil.pdf", dest: "dist/server-data/Through-The-Veil.pdf" },
    { src: "server/data/Through-The-Veil.epub", dest: "dist/server-data/Through-The-Veil.epub" },
  ];
  for (const { src, dest } of dataFiles) {
    if (existsSync(src)) {
      await copyFile(src, dest);
      console.log(`  ✓ ${src}`);
    }
  }

  console.log("\n✅ Build complete!\n");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
