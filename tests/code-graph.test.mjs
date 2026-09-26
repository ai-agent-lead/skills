import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildGraph, findTargets, impact, deps } from '../skills/scripts/code-graph/code-graph.mjs';

const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/code-graph');

function repo(extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-graph-'));
  fs.cpSync(FIXTURE, dir, { recursive: true });
  for (const [name, body] of Object.entries(extra)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), body);
  }
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

let shared;
async function graph() {
  shared ??= await buildGraph(repo());
  return shared;
}

async function run(target, depth = 3) {
  const g = await graph();
  const targets = findTargets(g, target);
  assert.ok(targets.length, `no match for ${target}`);
  const result = impact(g, targets, { depth });
  const by = (name) => result.nodes.find((n) => n.name === name);
  return { result, by };
}

test('Go: package-qualified calls walk up to the HTTP route and the test', async () => {
  const { result, by } = await run('pay.Charge');
  assert.equal(result.targets.length, 1, 'pay.Charge picks the function, not the methods');
  assert.equal(by('Checkout').confidence, 'likely');
  assert.equal(by('handleCheckout').entry, 'route POST /checkout');
  assert.ok(by('TestCheckout').test);
});

test('Go: an interface method lists implementations, and its callers are only possible', async () => {
  const { result, by } = await run('Provider.Charge');
  assert.deepEqual(result.implementations.map((i) => i.name), ['Bank.Charge']);
  assert.equal(by('Charge').confidence, 'possible');
});

test('text matches find a SQL table the parser cannot link', async () => {
  const { result } = await run('Bank.Charge');
  const table = result.text.find((t) => t.kind === 'table');
  assert.equal(table.key, 'payments');
  assert.deepEqual(table.hits, ['go/internal/report/report.go:3']);
});

test('TypeScript: follows a re-export, a require, a route registration, and a test file', async () => {
  const { by } = await run('web/src/pay.ts:1');
  const checkout = by('checkout');
  assert.equal(checkout.confidence, 'likely');
  assert.equal(checkout.entry, 'route POST /checkout');
  const top = (await run('web/src/pay.ts:1')).result.nodes.filter((n) => n.name === '(top level)');
  assert.ok(top.some((n) => n.file === 'web/src/checkout.test.ts' && n.test));
  assert.ok(top.some((n) => n.file === 'web/src/server.js' && n.line === 3));
});

test('TypeScript: this.method() and JSX components are callers', async () => {
  assert.equal((await run('Cart.sum')).by('Cart.total').confidence, 'likely');
  assert.ok((await run('Button')).by('App'));
});

test('Python: from-imports, decorator routes, and pytest functions', async () => {
  const { by } = await run('py/shop/pay.py:1');
  assert.equal(by('refund_view').entry, 'route POST /refund');
  assert.ok(by('test_refund').test);
  assert.equal((await run('Refund.check')).by('Refund.run').confidence, 'likely');
});

test('deps lists internal package edges and reports a cycle', async () => {
  const dir = repo({ 'loop/a/a.ts': "import { b } from '../b/b';\nexport const a = () => b();\n", 'loop/b/b.ts': "import { a } from '../a/a';\nexport const b = () => a();\n" });
  const g = await buildGraph(dir);
  const { deps: list, cycles } = deps(g);
  assert.deepEqual(list.find((d) => d.from === 'go/cmd/api').to, ['go/internal/order']);
  assert.deepEqual(cycles[0], ['loop/a', 'loop/b', 'loop/a']);
});

test('the cache re-parses only files whose content changed', async () => {
  const dir = repo();
  assert.equal((await buildGraph(dir)).parsed, 16);
  assert.equal((await buildGraph(dir)).parsed, 0);
  fs.appendFileSync(path.join(dir, 'web/src/pay.ts'), '\nexport const extra = () => charge(3);\n');
  const again = await buildGraph(dir);
  assert.equal(again.parsed, 1);
  assert.ok(findTargets(again, 'extra').length);
});

test('feature docs whose code: covers a reached file are listed', async () => {
  const dir = repo({ 'docs/features/checkout/feature.md': '---\ntype: feature\ntitle: Checkout\nstatus: building\ncode: [go/internal/order/]\n---\n# Checkout\n' });
  const g = await buildGraph(dir);
  const result = impact(g, findTargets(g, 'pay.Charge'));
  assert.deepEqual(result.docs.map((d) => d.doc), ['docs/features/checkout/feature.md']);
});
