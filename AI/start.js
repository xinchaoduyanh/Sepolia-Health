const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const port = process.env.AI_PORT || process.env.PORT || '8088';
const isProd = (process.env.AI_ENV || process.env.NODE_ENV || '').toLowerCase() === 'production';

// Prefer explicit Ollama URL from env; only default for local dev convenience.
if (!process.env.AI_OLLAMA_BASE_URL) {
  process.env.AI_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
}

let pythonExe = path.join('.venv', 'Scripts', 'python.exe');
if (!fs.existsSync(pythonExe)) {
  pythonExe = path.join('.venv', 'bin', 'python');
}
if (!fs.existsSync(pythonExe)) {
  console.error('[AI] Python venv not found. Create with: python -m venv .venv && .venv/Scripts/pip install -r requirements.txt');
  process.exit(1);
}

const args = ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', String(port)];
if (!isProd) {
  args.push('--reload');
}

console.log(`[AI] Starting (env=${process.env.AI_ENV || process.env.NODE_ENV || 'development'}, port=${port})`);
console.log(`[AI] Running: ${pythonExe} ${args.join(' ')}`);

const child = spawn(pythonExe, args, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
