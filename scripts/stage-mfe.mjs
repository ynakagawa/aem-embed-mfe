// Stages the separately-built vwr-header-mfe bundle into the demo app's asset
// folder so the demo can `await import('/vwr-header-mfe/main.js')` at runtime,
// the same way an AEM DA `mfe` block would. `public/vwr-header-mfe/` is build
// output, not source, and is gitignored.
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'dist/vwr-header-mfe/browser');
const target = join(repoRoot, 'public/vwr-header-mfe');

// The standalone preview shell is not wanted inside the demo app's asset tree.
const skip = new Set(['index.html', 'favicon.ico']);

if (!existsSync(source)) {
  console.error(`[stage-mfe] missing ${source} - run "ng build vwr-header-mfe" first.`);
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

const entries = await readdir(source, { withFileTypes: true });
let copied = 0;
for (const entry of entries) {
  if (skip.has(entry.name)) continue;
  await cp(join(source, entry.name), join(target, entry.name), { recursive: true });
  copied += 1;
}

console.log(`[stage-mfe] staged ${copied} entr${copied === 1 ? 'y' : 'ies'} into public/vwr-header-mfe/`);
