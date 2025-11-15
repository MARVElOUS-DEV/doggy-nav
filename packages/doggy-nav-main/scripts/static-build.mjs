import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgDir = path.resolve(__dirname, '..');
const configPath = path.join(pkgDir, 'next.config.ts');
const backupPath = path.join(pkgDir, 'next.config.ts.bak');

function patchNextConfig(src) {
  let out = src;
  // Remove Next i18n block (not supported by export)
  out = out.replace(/\n\s*i18n:\s*{[\s\S]*?},\n/, '\n  // i18n disabled for static export\n');
  // Force output: 'export'
  if (/output:\s*'export'/.test(out) === false) {
    out = out.replace(/output:\s*'[^']*'/, "output: 'export'");
    if (/output:\s*'export'/.test(out) === false) {
      // If no output field existed, insert one after opening config brace
      out = out.replace(/const\s+nextConfig:[\s\S]*?=\s*{/, (m) => `${m}\n  output: 'export',`);
    }
  }
  return out;
}

function run(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...options });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function main() {
  const original = await fs.readFile(configPath, 'utf8');
  await fs.writeFile(backupPath, original, 'utf8');
  try {
    const patched = patchNextConfig(original);
    await fs.writeFile(configPath, patched, 'utf8');

    const nextBin = path.join(pkgDir, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
    await run(nextBin, ['build'], { cwd: pkgDir });
  } finally {
    // Always restore original config
    await fs.writeFile(configPath, original, 'utf8');
    try { await fs.unlink(backupPath); } catch {}
  }
}

main().catch((err) => {
  console.error('[static-build] Failed:', err.message);
  process.exit(1);
});
