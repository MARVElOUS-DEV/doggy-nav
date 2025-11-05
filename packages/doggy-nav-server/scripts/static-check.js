#!/usr/bin/env node
/*
  Minimal P4 static check: prevent feature toggle usage in controllers.
  Fails if any controller still references USE_CORE_*.
*/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const controllerDir = path.join(root, 'app', 'controller');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const files = walk(controllerDir);
let failed = false;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (/USE_CORE_[A-Z_]+/.test(src)) {
    console.error(
      `[P4 static-check] Feature toggle reference found in controller: ${path.relative(root, file)}`
    );
    failed = true;
  }
}

if (failed) {
  console.error('\nP4 static-check failed: remove feature toggles from controllers.');
  process.exit(1);
}
console.log('P4 static-check passed: no feature toggles in controllers.');
