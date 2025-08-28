import { readFileSync } from 'node:fs';
const msg = readFileSync(process.env.HUSKY_GIT_PARAMS || process.argv[2] || '.git/COMMIT_EDITMSG','utf8').trim();
if (msg.split('\n').length > 1 || msg.length > 72) {
  console.error('✖ Commit must be a single line ≤72 chars.');
  process.exit(1);
}