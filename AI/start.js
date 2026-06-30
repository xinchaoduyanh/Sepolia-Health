const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set the environment variable for Ollama
process.env.AI_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

// Detect python executable path
let pythonExe = path.join('.venv', 'Scripts', 'python.exe');
if (!fs.existsSync(pythonExe)) {
  pythonExe = path.join('.venv', 'bin', 'python');
}

console.log(`[AI] Starting server with AI_OLLAMA_BASE_URL="http://127.0.0.1:11434"`);
console.log(`[AI] Running: ${pythonExe} -m uvicorn app.main:app --reload --port 8088`);

const child = spawn(
  pythonExe,
  ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8088'],
  {
    stdio: 'inherit',
    env: process.env,
    shell: true
  }
);

child.on('close', (code) => {
  process.exit(code);
});
