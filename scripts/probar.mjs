import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
const descriptor = resolve(root, '.mysql-local.json');
// Solo existe en el equipo donde se preparó MySQL portable; no se publica.
if (!env.TEST_DB_USER && existsSync(descriptor)) {
  const local = JSON.parse(readFileSync(descriptor, 'utf8'));
  if (local.adminFile && existsSync(local.adminFile)) {
    const admin = JSON.parse(readFileSync(local.adminFile, 'utf8'));
    env.TEST_DB_USER = admin.user;
    env.TEST_DB_PASSWORD = admin.password;
  }
}
const child = spawn(process.execPath, ['--import', 'tsx', '--test', 'tests/api.test.ts'], {
  cwd: resolve(root, 'backend'), env, stdio: 'inherit', windowsHide: true,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
process.once('SIGINT', () => child.kill());
process.once('SIGTERM', () => child.kill());
