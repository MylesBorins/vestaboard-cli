#!/usr/bin/env node
/**
 * Vestaboard CLI Tool
 * Send text/messages to your Vestaboard using the official VBML parser.
 *
 * Usage:
 *   node vestaboard.js "Hello World"              # Simple text
 *   node vestaboard.js --clear                     # Clear board
 *   node vestaboard.js -r                          # Read current message
 *   node vestaboard.js -l                          # List char codes
 *   node vestaboard.js "HI" --animate wave         # With animation
 *   node vestaboard.js --vbml template.vbml.json   # Parse VBML file
 *   node vestaboard.js --charcode 62               # Show a code
 */

import http from 'node:http';
import { vbml } from '@vestaboard/vbml';

// ─── Config ──────────────────────────────────────────────────
const CONFIG = {
  host: process.env.VESTABOARD_HOST || 'vestaboard',
  port: parseInt(process.env.VESTABOARD_PORT) || 7000,
  apiKey: process.env.VB_API_KEY,
  rows: 3,    // Vestaboard Note
  cols: 15,
};

// ─── VBML helpers ────────────────────────────────────────────
function parseVBML(vbmlPayload) {
  const result = vbml.parse(vbmlPayload);
  return typeof result === 'number' ? result : result;
}

function textToVBML(text, rows, cols) {
  return {
    style: { height: rows, width: cols },
    components: [{
      template: text,
      style: { justify: 'center', align: 'center' },
    }],
  };
}

// ─── HTTP helpers ────────────────────────────────────────────
function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path,
      method: 'POST',
      headers: {
        'X-Vestaboard-Local-Api-Key': CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: CONFIG.host,
      port: CONFIG.port,
      path,
      method: 'GET',
      headers: { 'X-Vestaboard-Local-Api-Key': CONFIG.apiKey },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Animation presets ───────────────────────────────────────
const ANIMATIONS = {
  off:      {},
  wave:     { strategy: 'column', step_interval_ms: 800, step_size: 1 },
  drift:    { strategy: 'reverse-column', step_interval_ms: 800, step_size: 1 },
  curtain:  { strategy: 'edges-to-center', step_interval_ms: 800, step_size: 1 },
  row:      { strategy: 'row', step_interval_ms: 800, step_size: 1 },
  diagonal: { strategy: 'diagonal', step_interval_ms: 800, step_size: 1 },
  random:   { strategy: 'random', step_interval_ms: 800, step_size: 1 },
};

// Late-night mode: slower, gentler
const QUIET_ANIMATIONS = {
  off:      {},
  wave:     { strategy: 'column', step_interval_ms: 1500, step_size: 1 },
  drift:    { strategy: 'reverse-column', step_interval_ms: 1500, step_size: 1 },
  curtain:  { strategy: 'edges-to-center', step_interval_ms: 1500, step_size: 1 },
  row:      { strategy: 'row', step_interval_ms: 1500, step_size: 1 },
  diagonal: { strategy: 'diagonal', step_interval_ms: 1500, step_size: 1 },
  random:   { strategy: 'random', step_interval_ms: 1500, step_size: 1 },
};

// ─── Sleep ───────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Board helpers ───────────────────────────────────────────
const CHAR_CODES = {
  ' ': 0, 'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8,
  'i': 9, 'j': 10, 'k': 11, 'l': 12, 'm': 13, 'n': 14, 'o': 15, 'p': 16,
  'q': 17, 'r': 18, 's': 19, 't': 20, 'u': 21, 'v': 22, 'w': 23, 'x': 24,
  'y': 25, 'z': 26, '1': 27, '2': 28, '3': 29, '4': 30, '5': 31, '6': 32,
  '7': 33, '8': 34, '9': 35, '0': 36, '!': 37, '@': 38, '#': 39, '$': 40,
  '(': 41, ')': 42, '-': 44, '+': 46, '&': 47, '=': 48, ';': 49, ':': 50,
  "'": 52, '"': 53, '%': 54, ',': 55, '.': 56, '/': 59, '?': 60,
  '♥': 62, '❤': 62, '🔴': 63, 'red': 63, '🟠': 64, 'orange': 64,
  '🟡': 65, 'yellow': 65, '🟢': 66, 'green': 66, '🔵': 67, 'blue': 67,
  '🟣': 68, 'violet': 68, '⬜': 69, 'white': 69, '⬛': 70, 'black': 70,
};
const CODE_TO_CHAR = {};
for (const [ch, code] of Object.entries(CHAR_CODES)) CODE_TO_CHAR[code] = ch;

async function send(grid, animation) {
  const body = animation ? { characters: grid, ...animation } : grid;
  const result = await httpPost('/local-api/message', body);
  console.log(result.trim() || '✓ Sent!');
}

async function clear() {
  const grid = Array.from({ length: CONFIG.rows }, () => Array(CONFIG.cols).fill(0));
  await send(grid);
  console.log('✓ Board cleared');
}

async function read() {
  const result = await httpGet('/local-api/message');
  const grid = result.message;
  printGrid(grid);
}

function printGrid(grid) {
  const charMap = (code) => {
    if (code === 0) return '·';
    return CODE_TO_CHAR[code] || '?';
  };
  for (const row of grid) console.log(row.map(charMap).join(' '));
}

function listCodes() {
  console.log('\nVestaboard Character Codes:');
  console.log('───┬────────────────┬──────────────────');
  console.log('Code│ Character       │ Name');
  console.log('───┼────────────────┼──────────────────');
  const sorted = Object.entries(CHAR_CODES).sort((a, b) => a[1] - b[1]);
  const names = {
    '0': 'Blank', '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F', '7': 'G',
    '8': 'H', '9': 'I', '10': 'J', '11': 'K', '12': 'L', '13': 'M', '14': 'N', '15': 'O',
    '16': 'P', '17': 'Q', '18': 'R', '19': 'S', '20': 'T', '21': 'U', '22': 'V', '23': 'W',
    '24': 'X', '25': 'Y', '26': 'Z', '27': '1', '28': '2', '29': '3', '30': '4', '31': '5',
    '32': '6', '33': '7', '34': '8', '35': '9', '36': '0', '37': '!', '38': '@', '39': '#',
    '40': '$', '41': '(', '42': ')', '44': '-', '46': '+', '47': '&', '48': '=', '49': ';',
    '50': ':', '52': "'", '53': '"', '54': '%', '55': ',', '56': '.', '59': '/', '60': '?',
    '62': '♥', '63': '🔴', '64': '🟠', '65': '🟡', '66': '🟢', '67': '🔵', '68': '🟣',
    '69': '⬜', '70': '⬛',
  };
  for (const [ch, code] of sorted) {
    const display = ch === ' ' ? '(space)' : ch;
    console.log(` ${String(code).padStart(3)}│ ${display.padEnd(16)}│ ${names[code] || ''}`);
  }
  console.log('───┴────────────────┴──────────────────\n');
}

// ─── CLI ─────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('-l') || args.includes('--list')) { listCodes(); process.exit(0); }
if (args.includes('-c') || args.includes('--clear')) { await clear(); process.exit(0); }
if (args.includes('-r') || args.includes('--read')) { await read(); process.exit(0); }

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
Vestaboard CLI Tool

  node vestaboard.js "Hello"              Send text (local parsing)
  node vestaboard.js --vbml file.json     Parse a VBML file
  node vestaboard.js -r                   Read current message
  node vestaboard.js -c                   Clear board
  node vestaboard.js -l                   List all char codes
  node vestaboard.js --charcode 62        Show character by code

  --rows 3    Grid rows (Note: 3, Flagship: 6)
  --cols 15   Grid cols (Note: 15, Flagship: 22)
  --animate wave|drift|curtain|row|diagonal|random
  --delay 2000 Delay in ms before reading board (default: 2000)
  --quiet     Slow animations (1.5s steps) for late night
  --no-read   Skip the auto-read after sending

  https://docs.vestaboard.com/docs/vbml   VBML docs
  `);
  process.exit(0);
}

let rows = CONFIG.rows, cols = CONFIG.cols, animation = null, delay = 2000, doRead = true, quiet = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--rows' && args[i + 1]) rows = parseInt(args[++i]);
  else if (args[i] === '--cols' && args[i + 1]) cols = parseInt(args[++i]);
  else if (args[i] === '--delay' && args[i + 1]) delay = parseInt(args[++i]);
  else if (args[i] === '--quiet') quiet = true;
  else if (args[i] === '--animate' && args[i + 1]) {
    const animName = args[++i].toLowerCase();
    animation = quiet ? QUIET_ANIMATIONS[animName] : ANIMATIONS[animName];
    if (!animation) {
      console.error(`Unknown animation: ${animName}`);
      console.log(`Available: ${Object.keys(ANIMATIONS).filter(a => a !== 'off').join(', ')}`);
      process.exit(1);
    }
  }
  else if (args[i] === '--charcode' && args[i + 1]) {
    const code = parseInt(args[++i]);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    grid[0][0] = code;
    await send(grid);
    console.log(`✓ Code ${code} displayed`);
    await sleep(delay);
    if (doRead) await read();
    process.exit(0);
  }
  else if (args[i] === '--vbml' && args[i + 1]) {
    const { readFileSync } = await import('node:fs');
    const vbmlPayload = JSON.parse(readFileSync(args[++i], 'utf8'));
    console.log(`\n  Composing VBML → ${rows}×${cols} grid`);
    const grid = parseVBML({ ...vbmlPayload, style: { height: rows, width: cols, ...(vbmlPayload.style || {}) } });
    printGrid(grid);
    await send(grid, animation);
    console.log(`  ✓ VBML done${animation ? ` (${animation.strategy})` : ''}\n`);
    await sleep(delay);
    if (doRead) await read();
    process.exit(0);
  }
}

// Plain text — use VBML parser for formatting
const text = args[0];
if (!text) {
  console.error('Usage: node vestaboard.js "text" [--animate wave]');
  process.exit(1);
}

console.log(`\n  Sending "${text}" → ${rows}×${cols} grid`);
const grid = parseVBML(textToVBML(text, rows, cols));
printGrid(grid);
await send(grid, animation);
console.log(`  ✓ Done${animation ? ` (${animation.strategy})` : ''}\n`);
await sleep(delay);
if (doRead) await read();
