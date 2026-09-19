// Fails the build if the vwr-header-mfe bundle is missing from the demo app's
// output. Without this the deploy still "succeeds": Vercel serves index.html
// with HTTP 200 for the missing /vwr-header-mfe/main.js, so consumers get HTML
// where they expect JavaScript and only discover it at runtime.
import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'dist/aem-embed-demo/browser/vwr-header-mfe');

const required = ['main.js', 'vwr-shell/vwr-shell.js'];
const MIN_BYTES = 1024;

const failures = [];
for (const file of required) {
  const path = join(outDir, file);
  try {
    const { size } = await stat(path);
    if (size < MIN_BYTES) {
      failures.push(`${file} is only ${size} bytes`);
    }
  } catch {
    failures.push(`${file} is missing`);
  }
}

if (failures.length) {
  console.error('[verify-mfe] vwr-header-mfe assets are not in the build output:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error(`[verify-mfe] expected under ${outDir}`);
  console.error('[verify-mfe] the "build:mfe" step did not run before "ng build".');
  process.exit(1);
}

console.log('[verify-mfe] vwr-header-mfe assets present in build output.');
