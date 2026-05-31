import { copyFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const target = process.argv[2];

if (!['development', 'production'].includes(target)) {
  console.error('Usage: node scripts/use-env.mjs <development|production>');
  process.exit(1);
}

const source = resolve(root, `.env.${target}`);

if (!existsSync(source)) {
  console.error(`File not found: ${source}`);
  process.exit(1);
}

copyFileSync(source, resolve(root, '.env'));
console.log(`Switched to ${target}: .env <- .env.${target}`);
