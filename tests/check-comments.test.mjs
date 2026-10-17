import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { check } from '../skills/scripts/check-comments.mjs';

const BASE_GO = `package pay

// Charge charges the order exactly once.
// It retries 3 times.
func Charge(n int) int {
	x := n
	return x
}

// Other is untouched.
func Other() int {
	return 1
}
`;

const BASE_JS = `/**
 * Charges the order exactly once.
 */
export function charge(n) {
  const x = n;
  return x;
}
`;

function repo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-comments-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  git('add', '.');
  git('commit', '-qm', 'base');
  return dir;
}

const write = (dir, name, body) => fs.writeFileSync(path.join(dir, name), body);
const rules = (result) => result.problems.map((p) => p.rule.split(' — ')[0]);

test('body-only edit lists the function header for re-check, with no problems', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'pay.go', BASE_GO.replace('x := n', 'x := n + 1'));
  const result = check({ cwd: dir, base: 'HEAD' });
  assert.deepEqual(result.problems, []);
  assert.equal(result.recheck.length, 1);
  assert.equal(result.recheck[0].header, true);
  assert.match(result.recheck[0].text, /retries 3 times/);
  assert.ok(!result.recheck.some((r) => /Other/.test(r.text)), 'untouched functions are not listed');
});

test('flags each pattern that makes comments pile up', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'pay.go', BASE_GO.replace('\tx := n\n', [
    '\tx := n // increased from n',
    '\t// Note: pass the key here as you mentioned',
    '\t// TODO: batch this',
    '\t// return n;',
    '\t_ = x // R6 AC-3',
    '',
  ].join('\n')));
  const found = rules(check({ cwd: dir, base: 'HEAD' }));
  for (const rule of ['untagged comment', 'narrates the edit', 'talks to the reviewer', 'TODO without owner', 'looks like commented-out code', 'process tag']) {
    assert.ok(found.includes(rule), `expected "${rule}" in ${JSON.stringify(found)}`);
  }
});

test('narration added to a header is flagged even though headers need no tag', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'pay.go', BASE_GO.replace('// It retries 3 times.\n', '// It retries 3 times.\n// Updated: now uses backoff.\n'));
  const found = rules(check({ cwd: dir, base: 'HEAD' }));
  assert.deepEqual(found, ['narrates the edit']);
});

test('tagged comments, Go doc comments, JSDoc headers, and directives pass', () => {
  const dir = repo({ 'pay.go': BASE_GO, 'pay.js': BASE_JS });
  write(dir, 'pay.go', BASE_GO.replace('\tx := n\n', [
    '\t// WHY: bank rejects >5 req/s; backoff keeps us under.',
    '\t// Two lines of one WHY are one comment.',
    '\tx := n',
    '\t//nolint:errcheck',
    '\t// TODO(tuan): #88 batch this',
    '',
  ].join('\n')) + '\n// Refund returns the charge to the card.\nfunc Refund() {}\n');
  write(dir, 'pay.js', BASE_JS.replace('  const x = n;\n', '  // SAFETY: n is validated by the caller schema.\n  const x = n;\n') +
    '\n/**\n * Refunds the order.\n * @param {Order} order\n */\nexport function refund(order) {}\n');
  const result = check({ cwd: dir, base: 'HEAD' });
  assert.deepEqual(result.problems, []);
});

test('untracked files are checked as fully added', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'new.js', 'export const retries = 5; // five retries\n');
  assert.deepEqual(rules(check({ cwd: dir, base: 'HEAD' })), ['untagged comment']);
});

test('counts comment lines added and removed', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'pay.go', BASE_GO.replace('// It retries 3 times.\n', '').replace('\tx := n\n', '\t// WHY: n is already validated.\n\tx := n\n'));
  const result = check({ cwd: dir, base: 'HEAD' });
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
});

test('a comment at the top of a file is a file header, not an untagged comment', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'cli.mjs', '#!/usr/bin/env node\n// Prints the balance for an account.\nimport fs from "fs";\n');
  assert.deepEqual(check({ cwd: dir, base: 'HEAD' }).problems, []);
});

test('commented-out Go code without a semicolon is still caught', () => {
  const dir = repo({ 'pay.go': BASE_GO });
  write(dir, 'pay.go', BASE_GO.replace('\tx := n\n', '\t// x := n + 1\n\tx := n\n'));
  assert.ok(rules(check({ cwd: dir, base: 'HEAD' })).includes('looks like commented-out code'));
});
