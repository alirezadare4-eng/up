import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_D1_DATABASE_ID', 'CLOUDFLARE_R2_BUCKET'];
for (const key of required) {
  if (!process.env[key]?.trim()) throw new Error(`Missing ${key}`);
}
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
await access('dist/server/index.js');
config.name = process.env.CLOUDFLARE_WORKER_NAME || 'sepehryar-updates';
config.topLevelName = config.name;
config.account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
config.workers_dev = true;
config.preview_urls = false;
config.d1_databases = [{
  binding: 'DB', database_name: process.env.CLOUDFLARE_D1_DATABASE_NAME || 'sepehryar-updates-db',
  database_id: process.env.CLOUDFLARE_D1_DATABASE_ID,
  migrations_dir: resolve('drizzle'),
}];
config.r2_buckets = [{ binding: 'BUCKET', bucket_name: process.env.CLOUDFLARE_R2_BUCKET }];
await writeFile('dist/server/wrangler.cloudflare.json', JSON.stringify(config, null, 2) + '\n');
console.log('Prepared Cloudflare configuration (no credentials written).');
