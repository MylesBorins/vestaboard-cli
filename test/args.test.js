import { test } from 'node:test';
import { deepEqual, equal } from 'node:assert';

// CLI arg splitting logic (extracted for testing)
const FLAG_VALUE_ARGS = new Set(['--rows','--cols','--anim','--delay','--charcode','--vbml']);
const FLAG_BOOL_ARGS = new Set(['--quiet','--noRead','-r','-c','-l','-h','--help','--read','--clear','--list','--setup','--force','--force-setup']);

function splitArgs(rawArgs) {
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
  return { textArgs, flagArgs };
}

// ─── Basic text args ─────────────────────────────────────────
test('splits simple text', () => {
  const { textArgs, flagArgs } = splitArgs(['Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, []);
});

test('splits multiple text args', () => {
  const { textArgs, flagArgs } = splitArgs(['Hello', 'World']);
  deepEqual(textArgs, ['Hello', 'World']);
  deepEqual(flagArgs, []);
});

// ─── Bool flags ──────────────────────────────────────────────
test('splits bool flags', () => {
  const { textArgs, flagArgs } = splitArgs(['--quiet', 'Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--quiet']);
});

test('splits multiple bool flags', () => {
  const { textArgs, flagArgs } = splitArgs(['--quiet', '--noRead', 'Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--quiet', '--noRead']);
});

// ─── Value flags ─────────────────────────────────────────────
test('splits value flags', () => {
  const { textArgs, flagArgs } = splitArgs(['--anim', 'wave', 'Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--anim', 'wave']);
});

test('splits multiple value flags', () => {
  const { textArgs, flagArgs } = splitArgs(['--anim', 'wave', '--delay', '1000', 'Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--anim', 'wave', '--delay', '1000']);
});

// ─── Mixed flags ─────────────────────────────────────────────
test('splits mixed flags with text first', () => {
  const { textArgs, flagArgs } = splitArgs(['Hello', '--quiet', '--anim', 'drift']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--quiet', '--anim', 'drift']);
});

test('splits mixed flags with text last', () => {
  const { textArgs, flagArgs } = splitArgs(['--quiet', 'Hello', '--anim', 'wave']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--quiet', '--anim', 'wave']);
});

test('splits complex args like the failing test case', () => {
  // This was the case: node vestaboard.js "HI" --anim diagonal --quiet --noRead
  const { textArgs, flagArgs } = splitArgs(['HI', '--anim', 'diagonal', '--quiet', '--noRead']);
  deepEqual(textArgs, ['HI']);
  deepEqual(flagArgs, ['--anim', 'diagonal', '--quiet', '--noRead']);
});

test('splits short flags', () => {
  const { textArgs, flagArgs } = splitArgs(['-r', '-c', '-l', 'Hello']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['-r', '-c', '-l']);
});

test('splits flags with text args in between', () => {
  const { textArgs, flagArgs } = splitArgs(['--anim', 'wave', 'Hello', '--quiet']);
  deepEqual(textArgs, ['Hello']);
  deepEqual(flagArgs, ['--anim', 'wave', '--quiet']);
});

// ─── Edge cases ──────────────────────────────────────────────
test('handles empty args', () => {
  const { textArgs, flagArgs } = splitArgs([]);
  deepEqual(textArgs, []);
  deepEqual(flagArgs, []);
});

test('handles args without text', () => {
  const { textArgs, flagArgs } = splitArgs(['--quiet', '--noRead', '--anim', 'wave']);
  deepEqual(textArgs, []);
  deepEqual(flagArgs, ['--quiet', '--noRead', '--anim', 'wave']);
});

test('text can contain hyphens', () => {
  const { textArgs, flagArgs } = splitArgs(['Hello-World']);
  deepEqual(textArgs, ['Hello-World']);
  deepEqual(flagArgs, []);
});

test('text can contain special characters', () => {
  const { textArgs, flagArgs } = splitArgs(['Hello!@#World']);
  deepEqual(textArgs, ['Hello!@#World']);
  deepEqual(flagArgs, []);
});
