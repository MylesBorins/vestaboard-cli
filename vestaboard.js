#!/usr/bin/env node
/**
 * Vestaboard CLI
 *
 * Usage:
 *   vb "Hello World"              # Simple text
 *   vb -r                         # Read current message
 *   vb -c                         # Clear board
 *   vb -l                         # List char codes
 *   vb "HI" --anim wave           # With animation
 *   vb --vbml file.json           # Parse a VBML file
 *   vb --charcode 62              # Show character by code
 *   vb --quiet                    # Late-night mode (slow anims)
 */

import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'node:fs';
import { Vestaboard, ANIMS, QUIET_ANIMS, printGrid, listCodes, sleep } from './lib/vestaboard.js';

dotenv.config();

if (!process.env.VB_API_KEY) {
  console.error('❌ Missing VB_API_KEY in .env');
  process.exit(1);
}

const rawArgs = hideBin(process.argv);

// Split flags from text args — handle flag-value pairs together
const FLAG_VALUE_ARGS = new Set(['--rows','--cols','--anim','--delay','--charcode','--vbml']);
const FLAG_BOOL_ARGS = new Set(['--quiet','--noRead','-r','-c','-l','-h','--help','--read','--clear','--list']);
const textArgs = [];
const flagArgs = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (FLAG_VALUE_ARGS.has(rawArgs[i])) {
    flagArgs.push(rawArgs[i], rawArgs[i + 1]);
    i++;
  } else if (FLAG_BOOL_ARGS.has(rawArgs[i])) {
    flagArgs.push(rawArgs[i]);
  } else {
    textArgs.push(rawArgs[i]);
  }
}

const argv = yargs(flagArgs)
  .scriptName('vb')
  .option('rows',  { type: 'number',  default: 3 })
  .option('cols',  { type: 'number',  default: 15 })
  .option('anim',  { type: 'string',  choices: Object.keys(ANIMS).filter(a => a !== 'off') })
  .option('delay', { type: 'number',  default: 2000 })
  .option('quiet', { type: 'boolean', default: false })
  .option('noRead',{ type: 'boolean', default: false })
  .option('charcode',{ type: 'number' })
  .option('vbml',  { type: 'string' })
  .parse();

argv.text = textArgs;

const vb = new Vestaboard();
const flags = argv;

// ─── Special flags ───────────────────────────────────────────
if (rawArgs.includes('-r') || rawArgs.includes('--read')) {
  const grid = await vb.read();
  printGrid(grid);
  process.exit(0);
}

if (rawArgs.includes('-c') || rawArgs.includes('--clear')) {
  await vb.clear();
  console.log('✓ Board cleared');
  process.exit(0);
}

if (rawArgs.includes('-l') || rawArgs.includes('--list')) {
  listCodes();
  process.exit(0);
}

if (rawArgs.includes('-h') || rawArgs.includes('--help')) {
  console.log(`
vb <text>              Send text to Vestaboard

Options:
  --rows 3    Grid rows (Note: 3, Flagship: 6)
  --cols 15   Grid cols (Note: 15, Flagship: 22)
  --anim wave Animation: wave|drift|curtain|row|diagonal|random
  --delay 2000 Delay before reading board (ms)
  --quiet     Slow animations (1.5s steps)
  --noRead    Skip auto-read after sending
  --charcode 62  Show character by code
  --vbml file.json  Parse a VBML file

  vb -r     Read current message
  vb -c     Clear board
  vb -l     List character codes
  `);
  process.exit(0);
}
if (typeof flags.charcode === 'number') {
  const grid = vb.parseCharCode(flags.charcode);
  await vb.send(grid);
  console.log(`✓ Code ${flags.charcode} displayed`);
  await sleep(flags.delay);
  if (!flags.noRead) { await vb.read().then(printGrid); }
  process.exit(0);
}

if (typeof flags.vbml === 'string') {
  const vbmlPayload = JSON.parse(fs.readFileSync(flags.vbml, 'utf8'));
  const anim = flags.anim ? (flags.quiet ? QUIET_ANIMS[flags.anim] : ANIMS[flags.anim]) : undefined;
  const grid = await vb.sendVBML(vbmlPayload, anim);
  printGrid(grid);
  console.log(`  ✓ VBML done${anim ? ` (${anim.strategy})` : ''}\n`);
  await sleep(flags.delay);
  if (!flags.noRead) { await vb.read().then(printGrid); }
  process.exit(0);
}

// ─── Text mode ───────────────────────────────────────────────
const text = flags.text[0];
const anim = flags.anim ? (flags.quiet ? QUIET_ANIMS[flags.anim] : ANIMS[flags.anim]) : undefined;

const grid = vb.parseText(text);
console.log(`\n  Sending "${text}" → ${flags.rows}×${flags.cols}`);
printGrid(grid);
await vb.send(grid, anim);
console.log(`  ✓ Done${anim ? ` (${anim.strategy})` : ''}\n`);
await sleep(flags.delay);
if (!flags.noRead) { await vb.read().then(printGrid); }
