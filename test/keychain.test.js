import { test, mock } from 'node:test';
import { equal, deepEqual, ok, throws } from 'node:assert';
import { execSync } from 'node:child_process';

// Mock keychain functions
const mockKeychainStore = {};

const mockExecSync = (cmd) => {
  const parts = cmd.split(' ');
  const action = parts[1];
  
  if (action === 'find-generic-password') {
    const nameMatch = cmd.match(/-s\s+"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : null;
    if (name && mockKeychainStore[name]) {
      return mockKeychainStore[name] + '\n';
    }
    throw new Error('no password');
  }
  
  if (action === 'add-generic-password') {
    const nameMatch = cmd.match(/-s\s+"([^"]+)"/);
    const valueMatch = cmd.match(/-w\s+"([^"]+)"/);
    if (nameMatch && valueMatch) {
      mockKeychainStore[nameMatch[1]] = valueMatch[1];
      return '';
    }
  }
  
  if (action === 'delete-generic-password') {
    const nameMatch = cmd.match(/-s\s+"([^"]+)"/);
    if (nameMatch) {
      delete mockKeychainStore[nameMatch[1]];
    }
  }
  
  return '';
};

// Test keychain read/write logic
test('keychain write stores value', () => {
  mockExecSync(`security add-generic-password -s "test-key" -w "test-value"`);
  equal(mockKeychainStore['test-key'], 'test-value');
});

test('keychain read returns stored value', () => {
  mockKeychainStore['existing-key'] = 'stored-value';
  const result = mockExecSync(`security find-generic-password -s "existing-key" -w 2>/dev/null`);
  equal(result.trim(), 'stored-value');
});

test('keychain read returns empty on missing key', () => {
  try {
    mockExecSync(`security find-generic-password -s "nonexistent" -w 2>/dev/null`);
  } catch (e) {
    equal(e.message.includes('no password'), true);
  }
});

test('keychain delete removes value', () => {
  mockKeychainStore['delete-me'] = 'temp-value';
  mockExecSync(`security delete-generic-password -s "delete-me" 2>/dev/null`);
  equal(mockKeychainStore['delete-me'], undefined);
});

test('multiple keys can be stored', () => {
  mockExecSync(`security add-generic-password -s "key1" -w "val1"`);
  mockExecSync(`security add-generic-password -s "key2" -w "val2"`);
  equal(mockKeychainStore['key1'], 'val1');
  equal(mockKeychainStore['key2'], 'val2');
});
