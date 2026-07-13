/**
 * Increments the patch segment of package.json and syncs src/app/core/app-version.ts
 * Usage: node scripts/bump-version.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = join(root, 'package.json');
const versionPath = join(root, 'src', 'app', 'core', 'app-version.ts');

const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
const current = String(pkg.version || '0.0.0');
const parts = current.split('.').map(n => Number.parseInt(n, 10) || 0);

while (parts.length < 3) parts.push(0);
parts[2] += 1;

const next = `${parts[0]}.${parts[1]}.${parts[2]}`;
pkg.version = next;

writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
writeFileSync(
  versionPath,
  `/** Application version — bumped automatically by githooks/pre-push. */\nexport const APP_VERSION = '${next}';\n`,
  'utf8'
);

process.stdout.write(`${next}\n`);
