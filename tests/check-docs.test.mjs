import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { check, writeIndex, sessionContext, LAYOUT_PATTERNS } from '../skills/scripts/check-docs.mjs';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills/scripts/check-docs.mjs');

const feature = (status, code = 'internal/billing/refund/') => `---
type: feature
title: Refunds
description: Customers refund without support.
status: ${status}
code: [${code}]
---
# Refunds
`;

const release = (status, box) => `---
type: release
title: v1.6
description: Refunds.
status: ${status}
---
# v1.6

## Features
- [${box}] [Refunds](../billing/features/refunds/feature.md)
`;

const BASE = {
  'internal/billing/refund/refund.go': 'package refund\n',
  'docs/index.md': '# docs\n',
  'docs/billing/CONTEXT.md': '---\ntype: context\ntitle: Billing\ndescription: Billing terms.\n---\n# Billing\n',
  'docs/billing/features/refunds/feature.md': feature('building'),
  'docs/releases/v1.6.md': release('building', ' '),
  'docs/roadmap.md': '---\ntype: roadmap\ntitle: Roadmap\n---\n# Roadmap\n\n- [ ] [v1.6](releases/v1.6.md)\n',
};

function repo(files = BASE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-docs-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q');
  git('config', 'user.email', 't@t');
  git('config', 'user.name', 't');
  for (const [name, body] of Object.entries(files)) write(dir, name, body);
  writeIndex(dir);
  git('add', '.');
  git('commit', '-qm', 'base');
  return dir;
}

function write(dir, name, body) {
  fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
  fs.writeFileSync(path.join(dir, name), body);
}

const rules = (result) => result.problems.map((p) => `${p.where} ${p.rule}`).join('\n');

function hook(mode, dir, input) {
  return spawnSync('node', [SCRIPT, '--hook', mode], { cwd: dir, input: JSON.stringify({ cwd: dir, ...input }), encoding: 'utf8' });
}

test('a consistent tree has no problems, and the generated index lists docs by domain', () => {
  const dir = repo();
  assert.equal(rules(check({ cwd: dir, base: 'HEAD' })), '');
  const index = fs.readFileSync(path.join(dir, 'docs/index.md'), 'utf8');
  assert.match(index, /## billing[\s\S]*\[Refunds\]\(\.\/billing\/features\/refunds\/feature\.md\).*· building/);
});

test('flags a status outside the allowed list, and a body Status line that disagrees', () => {
  const dir = repo();
  write(dir, 'docs/billing/features/refunds/feature.md', `${feature('In Progress')}\n**Status:** Shipped\n`);
  const found = rules(check({ cwd: dir, base: 'HEAD' }));
  assert.match(found, /status "In Progress"/);
  assert.match(found, /\*\*Status:\*\* line says "Shipped"/);
});

test('a release box must match the feature status, and a shipped release has no open boxes', () => {
  const dir = repo();
  write(dir, 'docs/releases/v1.6.md', release('building', 'x'));
  assert.match(rules(check({ cwd: dir, base: 'HEAD' })), /ticked, but .* is "building"/);

  write(dir, 'docs/billing/features/refunds/feature.md', feature('shipped'));
  write(dir, 'docs/releases/v1.6.md', release('shipped', ' '));
  const found = rules(check({ cwd: dir, base: 'HEAD' }));
  assert.match(found, /is shipped — tick its box/);
  assert.match(found, /release is shipped with an unticked feature/);
});

test('a roadmap box must match the release status', () => {
  const dir = repo();
  write(dir, 'docs/releases/v1.6.md', release('shipped', ' ').replace('- [ ]', '- [x]'));
  write(dir, 'docs/billing/features/refunds/feature.md', feature('shipped'));
  assert.match(rules(check({ cwd: dir, base: 'HEAD' })), /docs\/roadmap\.md:\d+ box is unticked but .* is "shipped"/);
});

test('flags broken links, missing code paths, and a stale index', () => {
  const dir = repo();
  write(dir, 'docs/billing/CONTEXT.md', `${BASE['docs/billing/CONTEXT.md']}\nSee [ADR](adr/0001-gone.md).\n`);
  write(dir, 'docs/billing/features/refunds/feature.md', feature('building', 'internal/billing/old/'));
  write(dir, 'docs/billing/research/providers.md', '---\ntype: research\ntitle: Providers\nstatus: open\n---\n# Providers\n');
  const found = rules(check({ cwd: dir, base: 'HEAD' }));
  assert.match(found, /broken link → adr\/0001-gone\.md/);
  assert.match(found, /code: path "internal\/billing\/old\/" does not exist/);
  assert.match(found, /generated list is stale/);
});

test('code changed under a feature asks for a re-check, and a draft feature asks to move to building', () => {
  const dir = repo();
  write(dir, 'internal/billing/refund/refund.go', 'package refund\n\nfunc Refund() {}\n');
  const building = check({ cwd: dir, base: 'HEAD' });
  assert.equal(building.problems.length, 0);
  assert.match(building.recheck.map((r) => r.rule).join('\n'), /but the doc did not — still true\?/);

  write(dir, 'docs/billing/features/refunds/feature.md', feature('draft'));
  assert.match(check({ cwd: dir, base: 'HEAD' }).recheck.map((r) => r.rule).join('\n'), /status is "draft" — set building\?/);
});

test('--changed reports only problems in docs changed on the branch', () => {
  const dir = repo();
  write(dir, 'docs/billing/CONTEXT.md', `${BASE['docs/billing/CONTEXT.md']}\nSee [gone](gone.md).\n`);
  execFileSync('git', ['commit', '-qam', 'broken'], { cwd: dir });
  assert.equal(check({ cwd: dir, base: 'HEAD', changedOnly: true }).problems.length, 0);
  assert.equal(check({ cwd: dir, base: 'HEAD~1', changedOnly: true }).problems.length, 1);
});

test('hooks: session lists work in flight, edit names the covering doc, stop blocks once', () => {
  const dir = repo();
  assert.match(sessionContext(dir), /Features in flight:\n- docs\/billing\/features\/refunds\/feature\.md — building/);

  const edit = hook('edit', dir, { tool_input: { file_path: path.join(dir, 'internal/billing/refund/refund.go') } });
  assert.match(JSON.parse(edit.stdout).hookSpecificOutput.additionalContext, /covered by docs\/billing\/features\/refunds\/feature\.md \(building\)/);

  write(dir, 'docs/billing/features/refunds/feature.md', feature('finished'));
  const stop = hook('stop', dir, {});
  assert.equal(stop.status, 2);
  assert.match(stop.stderr, /status "finished"/);
  assert.equal(hook('stop', dir, { stop_hook_active: true }).status, 0);
});

test('hooks stay silent in a project with no docs/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-docs-empty-'));
  for (const mode of ['session', 'edit', 'stop']) {
    const out = hook(mode, dir, { tool_input: { file_path: path.join(dir, 'x.go') } });
    assert.equal(out.status, 0);
    assert.equal(out.stdout, '');
  }
});

test('the layout accepts flat and domain paths, and rejects paths outside it', () => {
  const ok = (p) => LAYOUT_PATTERNS.some((re) => re.test(p));
  for (const p of ['docs/features/refunds/feature.md', 'docs/billing/features/refunds/design.md', 'docs/billing/adr/0007-idempotent-charges.md', 'docs/research/nats.md', 'docs/releases/v1.6.md', 'docs/billing/CONTEXT.md']) {
    assert.ok(ok(p), p);
  }
  for (const p of ['docs/features/refunds.md', 'docs/benchmarks/refunds.md', 'docs/features/refunds.design.md']) {
    assert.ok(!ok(p), p);
  }
});
