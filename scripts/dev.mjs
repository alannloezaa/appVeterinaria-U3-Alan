import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const backend = fileURLToPath(new URL('../backend/', import.meta.url));
const children = [
  spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], { cwd: backend, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { cwd: root, stdio: 'inherit' }),
];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  process.exitCode = code;
  children.forEach(child => child.kill());
}
children.forEach(child => {
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 0));
});
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
