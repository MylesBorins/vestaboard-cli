import http from 'node:http';
import { vbml } from '@vestaboard/vbml';
import { Entry } from '@napi-rs/keyring';
import readline from 'node:readline';

const KEY = 'vestaboard';

// ─── Keychain helpers (native via @napi-rs/keyring) ──────────
function kcKey(name) {
  return `${KEY}-${name}`;
}

function keychainRead(name) {
  try {
    return new Entry(KEY, kcKey(name)).getPassword() || null;
  } catch {
    return null;
  }
}

function keychainWrite(name, value) {
  try {
    new Entry(KEY, kcKey(name)).setPassword(value);
    return true;
  } catch {
    return false;
  }
}

function keychainDelete(name) {
  try {
    new Entry(KEY, kcKey(name)).deletePassword();
    return true;
  } catch {
    return false;
  }
}

// Simple line buffer for piped stdin
const _pipeLines = [];
let _pipeIndex = 0;
let _pipeReady = false;

if (process.stdin.isTTY === false) {
  const raw = fs.readFileSync('/dev/stdin', 'utf8');
  _pipeLines.push(...raw.split('\n').map(l => l.trim()));
  _pipeReady = true;
}

function prompt(message) {
  // Piped input: grab next line from buffer
  if (_pipeReady && _pipeIndex < _pipeLines.length) {
    const line = _pipeLines[_pipeIndex++];
    process.stdout.write(message);
    return Promise.resolve(line);
  }
  
  // Interactive: use readline
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    rl.on('error', reject);
  });
}



async function setup({ force = false } = {}) {
  const hasKey = keychainRead('api-key') || process.env.VB_API_KEY;
  const hasHost = keychainRead('host') || process.env.VESTABOARD_HOST;
  const hasPort = keychainRead('port') || process.env.VESTABOARD_PORT;

  if (hasKey && hasHost && hasPort && !force) {
    console.log('\n✅ Already configured:');
    console.log(`  Host: ${hasHost}`);
    console.log(`  Port: ${hasPort}`);
    console.log('  API key: [in keychain]');
    console.log('  Token:   [in keychain]');
    console.log('\nTo reconfigure or rotate your key: vb setup --force\n');
    return;
  }

  // Try to discover board
  const hosts = ['vestaboard', 'vestaboard.local'];
  let host = hasHost || hosts[0];
  let port = hasPort ? parseInt(hasPort, 10) : 7000;
  
  if (!hasHost || force) {
    console.log('\nSearching for Vestaboard on network...');
    for (const h of hosts) {
      try {
        const vb = new Vestaboard({ host: h, port: 7000, apiKey: 'test' });
        if (await vb.ping()) {
          host = h;
          port = 7000;
          break;
        }
      } catch {}
    }
  }

  // Get enablement key
  if (hasKey) {
    console.log('\n✅ API key found in environment.');
  } else {
    console.log('\nGet your enablement token from the Vestaboard app or email.');
  }
  
  const input = await prompt(`Enablement token or API key (${host}:${port}): `);
  let apiKey;

  if (hasKey) {
    apiKey = hasKey;
  } else {
    console.log('\nEnabling Local API...');
    try {
      const result = await Vestaboard.enablement(input, host, port);
      apiKey = result.apiKey;
      console.log('✅ API enabled!');
      keychainWrite('token', input);
    } catch (e) {
      console.error(`\n❌ Failed: ${e.message}`);
      process.exit(1);
    }
  }

  // Store everything in keychain
  keychainWrite('api-key', apiKey);
  keychainWrite('host', host);
  keychainWrite('port', String(port));
  
  console.log('\n✅ Done!\n');
  console.log(`  Host: ${host}:${port}`);
  console.log(`  API key: stored in keychain`);
  if (!hasKey) console.log(`  Token: stored in keychain (for future rotation)\n`);
}

// ─── Animation presets ───────────────────────────────────────
export const ANIMS = {
  off:      {},
  wave:     { strategy: 'column', step_interval_ms: 800, step_size: 1 },
  drift:    { strategy: 'reverse-column', step_interval_ms: 800, step_size: 1 },
  curtain:  { strategy: 'edges-to-center', step_interval_ms: 800, step_size: 1 },
  row:      { strategy: 'row', step_interval_ms: 800, step_size: 1 },
  diagonal: { strategy: 'diagonal', step_interval_ms: 800, step_size: 1 },
  random:   { strategy: 'random', step_interval_ms: 800, step_size: 1 },
};

export const QUIET_ANIMS = Object.fromEntries(
  Object.entries(ANIMS).map(([k, v]) => [k, { ...v, step_interval_ms: 1500 }])
);

// ─── Board class ─────────────────────────────────────────────
export class Vestaboard {
  #host;
  #port;
  #apiKey;
  #cachedHost;
  #cachedPort;
  #cachedApiKey;

  constructor(opts = {}) {
    this.#host = opts.host;
    this.#port = opts.port;
    this.#apiKey = opts.apiKey;
    this.rows = opts.rows || 3;
    this.cols = opts.cols || 15;
  }

  get host() {
    if (this.#host) return this.#host;
    if (!this.#cachedHost) {
      this.#cachedHost = process.env.VESTABOARD_HOST || keychainRead('host') || 'vestaboard';
    }
    return this.#cachedHost;
  }

  get port() {
    if (this.#port) return this.#port;
    if (!this.#cachedPort) {
      const raw = process.env.VESTABOARD_PORT || keychainRead('port');
      this.#cachedPort = raw ? parseInt(raw, 10) : 7000;
    }
    return this.#cachedPort;
  }

  get apiKey() {
    if (this.#apiKey) return this.#apiKey;
    if (!this.#cachedApiKey) {
      this.#cachedApiKey = process.env.VB_API_KEY || keychainRead('api-key');
    }
    return this.#cachedApiKey;
  }

  /** Enable the Local API (called during setup) */
  static async enablement(token, host, port) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({});
      const req = http.request({
        hostname: host, port, path: '/local-api/enablement', method: 'POST',
        headers: {
          'X-Vestaboard-Local-Api-Enablement-Token': token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error(`Enablement failed: ${d}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async httpPost(path, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: this.host, port: this.port, path, method: 'POST',
        headers: {
          'X-Vestaboard-Local-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(d));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async httpGet(path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.host, port: this.port, path, method: 'GET',
        headers: { 'X-Vestaboard-Local-Api-Key': this.apiKey },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
      req.end();
    });
  }

  /** Check if board responds (no JSON parse) */
  async ping() {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.host, port: this.port, path: '/local-api/enablement', method: 'GET',
        headers: { 'X-Vestaboard-Local-Api-Key': this.apiKey },
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(d.length > 0));
      });
      req.on('error', reject);
      req.end();
    });
  }

  /** Send a grid to the board */
  async send(grid, anim) {
    const body = anim ? { characters: grid, ...anim } : grid;
    const result = await this.httpPost('/local-api/message', body);
    return result.trim();
  }

  /** Send a VBML payload and return the grid */
  async sendVBML(vbmlPayload, anim) {
    const payload = {
      ...vbmlPayload,
      style: {
        height: vbmlPayload.style?.height || this.rows,
        width: vbmlPayload.style?.width || this.cols,
      },
    };
    const grid = vbml.parse(payload);
    await this.send(grid, anim);
    return grid;
  }

  /** Clear the board */
  async clear() {
    const grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    await this.send(grid);
  }

  /** Read current message */
  async read() {
    const result = await this.httpGet('/local-api/message');
    return result.message;
  }

  /** Parse a VBML payload into a grid (without sending) */
  parseVBML(vbmlPayload, overrides = {}) {
    const payload = {
      ...vbmlPayload,
      style: {
        height: overrides.rows || this.rows,
        width: overrides.cols || this.cols,
        ...(vbmlPayload.style || {}),
      },
    };
    return vbml.parse(payload);
  }

  /** Parse plain text into a grid (without sending) */
  parseText(text, overrides = {}) {
    return vbml.parse({
      style: {
        height: overrides.rows || this.rows,
        width: overrides.cols || this.cols,
      },
      components: [{
        template: text,
        style: { justify: 'center', align: 'center' },
      }],
    });
  }

  /** Parse character code into a grid */
  parseCharCode(code) {
    const grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    grid[0][0] = code;
    return grid;
  }
}

// ─── Grid display helpers ────────────────────────────────────
export const CODE_TO_CHAR = {
  0: '·', 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G',
  8: 'H', 9: 'I', 10: 'J', 11: 'K', 12: 'L', 13: 'M', 14: 'N', 15: 'O',
  16: 'P', 17: 'Q', 18: 'R', 19: 'S', 20: 'T', 21: 'U', 22: 'V', 23: 'W',
  24: 'X', 25: 'Y', 26: 'Z', 27: '1', 28: '2', 29: '3', 30: '4', 31: '5',
  32: '6', 33: '7', 34: '8', 35: '9', 36: '0', 37: '!', 38: '@', 39: '#',
  40: '$', 41: '(', 42: ')', 44: '-', 46: '+', 47: '&', 48: '=',
  49: ';', 50: ':', 52: "'", 53: '"', 54: '%', 55: ',', 56: '.',
  59: '/', 60: '?', 62: '♥', 63: '🔴', 64: '🟠', 65: '🟡',
  66: '🟢', 67: '🔵', 68: '🟣', 69: '⬜', 70: '⬛',
};

export function printGrid(grid) {
  for (const row of grid) console.log(row.map(c => CODE_TO_CHAR[c] || '?').join(' '));
}

export function listCodes() {
  console.log(`
Vestaboard Character Codes
${'─'.repeat(40)}
 A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P  Q  R  S  T  U  V  W  X  Y  Z
 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26

 1  2  3  4  5  6  7  8  9  0  !  @  #  $  (  )  -  +  &  =  ;  :  '  "  %  ,  .  /  ?  ♥
27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 44 46 47 48 49 50 52 53 54 55 56 59 60 62

🔴 63  🟠 64  🟡 65  🟢 66  🔵 67  🟣 68  ⬜ 69  ⬛ 70

${'─'.repeat(40)}
`);
}

// ─── Convenience functions ───────────────────────────────────
export async function sendToBoard(grid, anim, opts = {}) {
  const vb = new Vestaboard(opts);
  return await vb.send(grid, anim);
}

export async function sendVBML(vbmlPayload, anim, opts = {}) {
  const vb = new Vestaboard(opts);
  return await vb.sendVBML(vbmlPayload, anim);
}

export async function clearBoard(opts = {}) {
  const vb = new Vestaboard(opts);
  await vb.clear();
}

export async function readBoard(opts = {}) {
  const vb = new Vestaboard(opts);
  return await vb.read();
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export { setup };
