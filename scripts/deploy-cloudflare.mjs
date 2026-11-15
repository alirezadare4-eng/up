import { spawnSync } from 'node:child_process';

if (!process.env.UP_ADMIN_TOKEN || process.env.UP_ADMIN_TOKEN.length < 32) {
  throw new Error('Set UP_ADMIN_TOKEN to a random secret of at least 32 characters.');
}
const config = 'dist/server/wrangler.cloudflare.json';
function run(args, input) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {
    stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit', input,
    env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run(['d1', 'migrations', 'apply', 'DB', '--remote', '--config', config]);
// Until the secret is installed, production POST requests return 503.
run(['deploy', '--config', config]);
run(['secret', 'put', 'UP_ADMIN_TOKEN', '--config', config], process.env.UP_ADMIN_TOKEN + '\n');
