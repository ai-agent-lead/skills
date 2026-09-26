#!/usr/bin/env node
// Code graph for Go, JavaScript, TypeScript, and Python, built on demand with
// tree-sitter (WASM) — no language toolchain needed. See skills/impact/SKILL.md.
//
// Usage: node code-graph.mjs impact <target> [--depth N] [--json]
//        node code-graph.mjs callers <target> [--json]
//        node code-graph.mjs deps [dir] [--mermaid]
//        node code-graph.mjs index
//   target: Name | Type.Method | pkg.Name | path/to/file.go:42 | path/to/file.ts
// Exit code: 1 when the target matches nothing, else 0.

import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { extract, EXTENSIONS } from './extract.mjs';
import { loadDocs, docsCovering } from '../check-docs.mjs';

const CACHE_VERSION = 1;
const MAX_FILE_BYTES = 1024 * 1024;
const SKIP = /(^|\/)(node_modules|vendor|third_party|dist|build|out|\.next|coverage)\/|\.min\.[cm]?js$|\.d\.ts$/;
const JS_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'];
const POSSIBLE_EXPAND_LIMIT = 10;

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

function repoFiles(cwd) {
  try {
    return git(['ls-files', '--cached', '--others', '--exclude-standard'], cwd).split('\n').filter(Boolean);
  } catch {
    const walk = (dir) => fs.readdirSync(path.join(cwd, dir), { withFileTypes: true }).flatMap((e) => {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.name.startsWith('.') || e.name === 'node_modules') return [];
      return e.isDirectory() ? walk(rel) : [rel];
    });
    return walk('');
  }
}

function cachePath(cwd) {
  try {
    return path.resolve(cwd, git(['rev-parse', '--git-dir'], cwd).trim(), 'code-graph-cache.json');
  } catch {
    return null;
  }
}

/**
 * Parses every supported source file under cwd, reusing cached results for files
 * whose content hash is unchanged. Writes the cache into .git/ (never committed).
 * Cost: one read per file; a parse only for new or edited files.
 * @returns {Promise<{ cwd: string, files: Map<string, object>, all: string[], parsed: number }>}
 */
export async function buildGraph(cwd = process.cwd()) {
  const all = repoFiles(cwd).filter((f) => fs.existsSync(path.join(cwd, f)));
  const sources = all.filter((f) => EXTENSIONS.has(path.extname(f)) && !SKIP.test(f));
  const cacheFile = cachePath(cwd);
  let cache = { version: CACHE_VERSION, files: {} };
  try {
    const loadedCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (loadedCache.version === CACHE_VERSION) cache = loadedCache;
  } catch {}

  const files = new Map();
  const next = {};
  let parsed = 0;
  for (const file of sources) {
    const full = path.join(cwd, file);
    if (fs.statSync(full).size > MAX_FILE_BYTES) continue;
    const source = fs.readFileSync(full, 'utf8');
    const hash = crypto.createHash('sha1').update(source).digest('hex');
    let data = cache.files[file]?.hash === hash ? cache.files[file].data : null;
    if (!data) {
      data = await extract(file, source);
      parsed++;
    }
    if (!data) continue;
    next[file] = { hash, data };
    files.set(file, data);
  }
  if (cacheFile && parsed) {
    try {
      fs.writeFileSync(cacheFile, JSON.stringify({ version: CACHE_VERSION, files: next }));
    } catch {}
  }
  return { cwd, files, all, parsed };
}

function goModules(cwd, all) {
  return all.filter((f) => path.basename(f) === 'go.mod').map((f) => {
    const mod = fs.readFileSync(path.join(cwd, f), 'utf8').match(/^module\s+(\S+)/m)?.[1];
    return mod ? { mod, dir: path.posix.dirname(f) === '.' ? '' : path.posix.dirname(f) } : null;
  }).filter(Boolean).sort((a, b) => b.mod.length - a.mod.length);
}

function jsAliases(cwd) {
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    try {
      const text = fs.readFileSync(path.join(cwd, name), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
      const opts = JSON.parse(text).compilerOptions ?? {};
      const base = opts.baseUrl ?? '.';
      return Object.entries(opts.paths ?? {}).map(([from, to]) => ({
        prefix: from.replace(/\*$/, ''),
        targets: to.map((t) => path.posix.normalize(path.posix.join(base, t.replace(/\*$/, '')))),
      }));
    } catch {}
  }
  return [];
}

function makeResolver(graph) {
  const { cwd, files, all } = graph;
  const fileSet = new Set(files.keys());
  const modules = goModules(cwd, all);
  const aliases = jsAliases(cwd);
  const pyRoots = [...fileSet].filter((f) => f.endsWith('/__init__.py')).map((f) => dirOf(dirOf(f)))
    .filter((root) => !fileSet.has(`${root}/__init__.py`));

  const jsCandidates = (base) => {
    const stripped = base.replace(/\.[cm]?jsx?$/, '');
    return [base, ...JS_EXTS.map((e) => base + e), ...JS_EXTS.map((e) => stripped + e), ...JS_EXTS.map((e) => `${base}/index${e}`)];
  };
  const firstFile = (list) => list.map((p) => path.posix.normalize(p)).find((p) => fileSet.has(p)) ?? null;

  const resolveJs = (from, spec) => {
    if (spec.startsWith('.')) return firstFile(jsCandidates(path.posix.join(path.posix.dirname(from), spec)));
    for (const a of aliases) {
      if (spec.startsWith(a.prefix)) {
        const hit = firstFile(a.targets.flatMap((t) => jsCandidates(t + spec.slice(a.prefix.length))));
        if (hit) return hit;
      }
    }
    return null;
  };

  const resolvePy = (from, spec) => {
    const dots = spec.match(/^\.*/)[0].length;
    const rest = spec.slice(dots).replace(/\./g, '/');
    const roots = dots
      ? [path.posix.join(path.posix.dirname(from), ...Array(Math.max(dots - 1, 0)).fill('..'))]
      : [...new Set(['', 'src', 'lib', ...pyRoots])];
    for (const root of roots) {
      const base = path.posix.join(root, rest);
      const hit = firstFile([`${base}.py`, `${base}/__init__.py`].map((p) => p.replace(/^\/+/, '')));
      if (hit) return hit;
    }
    return null;
  };

  const goDir = (spec) => {
    const m = modules.find((x) => spec === x.mod || spec.startsWith(`${x.mod}/`));
    return m ? path.posix.join(m.dir, spec.slice(m.mod.length + 1)) : null;
  };

  const cache = new Map();
  // Map of local name → { file | dir, imported } for one file.
  function bindingsOf(file) {
    if (cache.has(file)) return cache.get(file);
    const data = files.get(file);
    const out = new Map();
    for (const imp of data.imports) {
      if (data.family === 'go') {
        const dir = goDir(imp.spec);
        for (const b of imp.bindings) out.set(b.local, { dir, imported: '*', external: !dir });
        continue;
      }
      if (data.family === 'py') {
        const target = resolvePy(file, imp.spec);
        for (const b of imp.bindings) {
          const asModule = b.imported !== '*' && b.imported !== '*all' ? resolvePy(file, `${imp.spec}${imp.spec.endsWith('.') ? '' : '.'}${b.imported}`) : null;
          if (asModule) out.set(b.local, { file: asModule, imported: '*' });
          else out.set(b.local, { file: target, imported: b.imported, external: !target });
        }
        continue;
      }
      if (imp.reexport) continue;
      const target = resolveJs(file, imp.spec);
      for (const b of imp.bindings) out.set(b.local, { file: target, imported: b.imported, external: !target });
    }
    cache.set(file, out);
    return out;
  }

  // Files that define `name` when it is imported from `file`, following re-exports (JS) up to 3 hops.
  function definingFiles(file, name, hops = 0) {
    const data = files.get(file);
    if (!data || hops > 3) return [];
    const out = data.defs.some((d) => d.name === name && !d.container) || (name === 'default') ? [file] : [];
    for (const imp of data.imports.filter((i) => i.reexport)) {
      const target = resolveJs(file, imp.spec);
      if (!target) continue;
      const b = imp.bindings.find((x) => x.local === name || x.local === '*');
      if (b) out.push(...definingFiles(target, b.imported === '*all' ? name : b.imported, hops + 1));
    }
    return out;
  }

  const pyImports = (file) => files.get(file).imports;
  return { bindingsOf, definingFiles, resolveJs, resolvePy, goDir, pyImports };
}

const nodeKey = (file, index) => `${file}#${index}`;
const dirOf = (file) => path.posix.dirname(file);

/**
 * Finds definitions matching a target string. Several matches are all returned.
 * @param {string} target Name | Type.Method | pkg.Name | file:line | file
 */
export function findTargets(graph, target) {
  const { files } = graph;
  const fileLine = target.match(/^(.+?):(\d+)$/);
  if (fileLine && files.has(fileLine[1])) {
    const defs = files.get(fileLine[1]).defs;
    const n = Number(fileLine[2]);
    let best = -1;
    defs.forEach((d, i) => {
      if (d.line <= n && n <= d.end && (best === -1 || d.end - d.line < defs[best].end - defs[best].line)) best = i;
    });
    return best === -1 ? [] : [{ file: fileLine[1], index: best }];
  }
  if (files.has(target)) {
    return files.get(target).defs.map((d, i) => ({ file: target, index: i })).filter(({ index }) => !files.get(target).defs[index].container);
  }
  const parts = target.split('.');
  const name = parts.pop();
  const scope = parts.join('.');
  const out = [];
  for (const [file, data] of files) {
    data.defs.forEach((d, i) => {
      if (d.name !== name) return;
      if (scope && d.container !== scope && data.package !== scope && path.posix.basename(dirOf(file)) !== scope && path.posix.basename(file).replace(/\.\w+$/, '') !== scope) return;
      out.push({ file, index: i });
    });
  }
  const defOf = (t) => files.get(t.file).defs[t.index];
  if (scope && out.some((t) => defOf(t).container === scope)) return out.filter((t) => defOf(t).container === scope);
  if (scope && out.some((t) => !defOf(t).container)) return out.filter((t) => !defOf(t).container);
  return out;
}

// Call sites that reach the definition at (file, index), each with a confidence.
function callersOf(graph, resolver, file, index) {
  const { files } = graph;
  const target = files.get(file).defs[index];
  const family = files.get(file).family;
  const isMember = target.kind === 'method' && target.container;
  const found = [];
  for (const [from, data] of files) {
    if (data.family !== family) continue;
    const bindings = resolver.bindingsOf(from);
    data.calls.forEach((call) => {
      if (call.name !== target.name) return;
      const caller = call.in === -1 ? null : data.defs[call.in];
      if (from === file && call.in === index && !call.qualifier) return;
      let confidence = null;
      if (isMember) {
        const q = call.qualifier;
        const bound = q ? bindings.get(q) : null;
        if (!q) {
          confidence = null;
        } else if (['this', 'self', 'cls'].includes(q) || (family === 'go' && caller?.container === target.container && dirOf(from) === dirOf(file) && caller?.kind === 'method')) {
          if (from === file || family === 'go') confidence = caller?.container === target.container ? 'likely' : 'possible';
        } else if (q === target.container) {
          confidence = 'likely';
        } else if (bound) {
          confidence = null;
        } else {
          confidence = 'possible';
        }
      } else if (family === 'go') {
        if (!call.qualifier) confidence = dirOf(from) === dirOf(file) ? 'likely' : null;
        else if (bindings.get(call.qualifier)?.dir === dirOf(file)) confidence = 'likely';
      } else if (family === 'js') {
        if (!call.qualifier) {
          if (from === file) confidence = 'likely';
          else {
            const b = bindings.get(call.name);
            if (b?.file && (b.imported === target.name || (b.imported === 'default' && target.exportDefault))) {
              if (resolver.definingFiles(b.file, b.imported).includes(file)) confidence = 'likely';
            }
          }
        } else {
          const b = bindings.get(call.qualifier);
          if (b?.file && b.imported === '*' && resolver.definingFiles(b.file, target.name).includes(file)) confidence = 'likely';
        }
      } else if (family === 'py') {
        if (!call.qualifier) {
          if (from === file && !target.container) confidence = 'likely';
          else {
            const b = bindings.get(call.name);
            if (b?.file === file && (b.imported === target.name)) confidence = 'likely';
            else if ([...bindings.values()].some((x) => x.file === file && x.imported === '*all')) confidence = 'likely';
          }
        } else {
          const b = bindings.get(call.qualifier);
          if (b?.file === file && b.imported === '*') confidence = 'likely';
        }
      }
      if (confidence) found.push({ from, in: call.in, line: call.line, kind: call.kind, route: call.route, confidence });
    });
  }
  return found;
}

// Other definitions of the same method name on other types: implementations of an interface method.
function implementationsOf(graph, file, index) {
  const target = graph.files.get(file).defs[index];
  if (target.kind !== 'method') return [];
  const family = graph.files.get(file).family;
  const out = [];
  for (const [f, data] of graph.files) {
    if (data.family !== family) continue;
    data.defs.forEach((d, i) => {
      if (d.kind === 'method' && d.name === target.name && !(f === file && i === index) && d.container !== target.container) out.push({ file: f, index: i });
    });
  }
  return out;
}

const describe = (graph, file, index) => {
  if (index === -1) return { file, name: '(top level)', line: 1, kind: 'file' };
  const d = graph.files.get(file).defs[index];
  return { file, name: d.container ? `${d.container}.${d.name}` : d.name, line: d.line, kind: d.kind };
};

function stringKeys(source) {
  const keys = [];
  const literals = source.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`/g) ?? [];
  for (const lit of literals) {
    const s = lit.slice(1, -1);
    for (const m of s.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN|TABLE)\s+[`"]?([A-Za-z_][\w.]*)/gi)) keys.push({ kind: 'table', key: m[1] });
    if (/^((GET|POST|PUT|PATCH|DELETE)\s+)?\/[\w/{}:.-]+$/.test(s)) keys.push({ kind: 'route', key: s.replace(/^[A-Z]+\s+/, '') });
  }
  for (const m of source.matchAll(/\b(?:publish|subscribe|emit|produce|consume|enqueue|send_task|Publish|Subscribe|Emit)\w*\(\s*(?:[\w.]+,\s*)?["'`]([\w.:/-]{3,})["'`]/g)) keys.push({ kind: 'topic', key: m[1] });
  for (const m of source.matchAll(/Getenv\("(\w+)"\)|process\.env\.(\w+)|process\.env\[["'](\w+)["']\]|environ(?:\.get)?[[(]["'](\w+)["']/g)) keys.push({ kind: 'env', key: m[1] ?? m[2] ?? m[3] ?? m[4] });
  const seen = new Set();
  return keys.filter((k) => !seen.has(`${k.kind}:${k.key}`) && seen.add(`${k.kind}:${k.key}`));
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Text matches for string keys across every text file: edges the parser cannot see.
function textEdges(graph, target, keys) {
  const out = [];
  const texts = graph.all.filter((f) => !SKIP.test(f) && !/\.(png|jpe?g|gif|ico|wasm|pdf|zip|gz|lock|svg|woff2?)$/i.test(f));
  for (const { kind, key } of keys) {
    const re = kind === 'table'
      ? new RegExp(`\\b(from|into|update|join|table)\\s+[\`"]?${escapeRe(key)}\\b`, 'i')
      : new RegExp(kind === 'env' ? `\\b${escapeRe(key)}\\b` : escapeRe(key));
    const hits = [];
    for (const f of texts) {
      const full = path.join(graph.cwd, f);
      let text;
      try {
        if (fs.statSync(full).size > MAX_FILE_BYTES) continue;
        text = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (!re.test(text)) continue;
      text.split('\n').forEach((l, i) => {
        if (f === target.file && i + 1 >= target.line && i + 1 <= target.end) return;
        if (re.test(l) || (kind === 'table' && f.endsWith('.sql') && new RegExp(`\\b${escapeRe(key)}\\b`).test(l))) hits.push(`${f}:${i + 1}`);
      });
    }
    if (hits.length) out.push({ kind, key, hits: hits.slice(0, 10), more: Math.max(hits.length - 10, 0) });
  }
  return out;
}

/**
 * Walks callers up from each target to entry points and tests, then adds string
 * edges and the feature docs that cover the files reached. Read-only.
 * @param {number} depth how many caller levels to walk (default 3)
 */
export function impact(graph, targets, { depth = 3 } = {}) {
  const resolver = makeResolver(graph);
  const nodes = new Map();
  const edges = [];
  const queue = [];
  for (const t of targets) {
    const key = nodeKey(t.file, t.index);
    nodes.set(key, { ...describe(graph, t.file, t.index), key, depth: 0, confidence: 'target', root: true });
    queue.push({ file: t.file, index: t.index, depth: 0, confidence: 'likely' });
  }
  const implementations = targets.flatMap((t) => implementationsOf(graph, t.file, t.index)).map((i) => describe(graph, i.file, i.index));

  while (queue.length) {
    const cur = queue.shift();
    if (cur.index === -1) continue;
    const curKey = nodeKey(cur.file, cur.index);
    const curNode = nodes.get(curKey);
    const def = graph.files.get(cur.file).defs[cur.index];
    if (def.entry) curNode.entry = def.entry;
    if (def.test) curNode.test = true;
    if (curNode.test) continue;
    const callers = callersOf(graph, resolver, cur.file, cur.index);
    if (cur.depth >= depth) {
      const route = callers.find((c) => c.route)?.route;
      if (route && (!curNode.entry || curNode.entry === 'HTTP handler')) curNode.entry = `route ${route}`;
      if (callers.length) curNode.more = callers.length;
      continue;
    }
    const possible = callers.filter((c) => c.confidence === 'possible').length;
    for (const c of callers) {
      if (c.route && (!curNode.entry || curNode.entry === 'HTTP handler')) curNode.entry = `route ${c.route}`;
      const key = nodeKey(c.from, c.in);
      const confidence = cur.confidence === 'possible' || c.confidence === 'possible' ? 'possible' : 'likely';
      edges.push({ from: key, to: curKey, line: c.line, kind: c.kind, confidence });
      if (nodes.has(key)) continue;
      const fileData = graph.files.get(c.from);
      const node = { ...describe(graph, c.from, c.in), key, depth: cur.depth + 1, confidence, parent: curKey };
      if (c.in === -1) {
        node.line = c.line;
        if (fileData.test) node.test = true;
        if (fileData.topLevelEntry) node.entry = fileData.topLevelEntry;
      }
      nodes.set(key, node);
      if (c.in !== -1 && (confidence === 'likely' || possible <= POSSIBLE_EXPAND_LIMIT)) queue.push({ file: c.from, index: c.in, depth: cur.depth + 1, confidence });
    }
  }

  const list = [...nodes.values()];
  const reached = [...new Set(list.map((n) => n.file))];
  const docs = (() => {
    try {
      const all = loadDocs(graph.cwd);
      const seen = new Map();
      for (const f of reached) for (const d of docsCovering(all, f)) seen.set(d.rel, { doc: d.rel, status: d.data.status, via: f });
      return [...seen.values()];
    } catch {
      return [];
    }
  })();
  const text = targets.flatMap((t) => {
    const d = graph.files.get(t.file).defs[t.index];
    const lines = fs.readFileSync(path.join(graph.cwd, t.file), 'utf8').split('\n').slice(d.line - 1, d.end).join('\n');
    return textEdges(graph, { file: t.file, line: d.line, end: d.end }, stringKeys(lines));
  });

  const tests = list.filter((n) => n.test);
  const entries = list.filter((n) => n.entry);
  return { targets: list.filter((n) => n.root), nodes: list, edges, implementations, entries, tests, text, docs };
}

/**
 * Package / directory dependency map from resolved imports, internal only.
 * @param {string} dir limit to files under this repo-relative directory ('' = all)
 */
export function deps(graph, dir = '') {
  const resolver = makeResolver(graph);
  const prefix = dir && dir !== '.' ? `${dir.replace(/\/$/, '')}/` : '';
  const map = new Map();
  for (const [file, data] of graph.files) {
    if (prefix && !file.startsWith(prefix)) continue;
    if (data.test) continue;
    const from = dirOf(file);
    if (!map.has(from)) map.set(from, new Set());
    for (const b of resolver.bindingsOf(file).values()) {
      const to = b.dir ?? (b.file ? dirOf(b.file) : null);
      if (to && to !== from && (!prefix || `${to}/`.startsWith(prefix))) map.get(from).add(to);
    }
  }
  const cycles = [];
  const state = new Map();
  const stack = [];
  const visit = (n) => {
    state.set(n, 1);
    stack.push(n);
    for (const m of map.get(n) ?? []) {
      if (state.get(m) === 1 && cycles.length < 5) cycles.push([...stack.slice(stack.indexOf(m)), m]);
      else if (!state.has(m)) visit(m);
    }
    stack.pop();
    state.set(n, 2);
  };
  for (const n of [...map.keys()].sort()) if (!state.has(n)) visit(n);
  return { deps: [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([from, to]) => ({ from, to: [...to].sort() })), cycles };
}

const MARK = { likely: '', possible: ' (possible)' };

function printImpact(result, graph) {
  const out = [];
  const byParent = new Map();
  for (const n of result.nodes) if (n.parent) byParent.set(n.parent, [...(byParent.get(n.parent) ?? []), n]);
  const label = (n) => `${n.name}  ${n.file}:${n.line}${MARK[n.confidence] ?? ''}${n.entry ? `  ◄ entry: ${n.entry}` : ''}${n.test ? '  ◄ test' : ''}${n.more ? `  (+${n.more} callers past --depth)` : ''}`;
  const walk = (key, prefix) => {
    const kids = (byParent.get(key) ?? []).sort((a, b) => (a.confidence === b.confidence ? a.file.localeCompare(b.file) : a.confidence === 'likely' ? -1 : 1));
    kids.forEach((k, i) => {
      const last = i === kids.length - 1;
      out.push(`${prefix}${last ? '└─ ' : '├─ '}${label(k)}`);
      walk(k.key, `${prefix}${last ? '   ' : '│  '}`);
    });
  };
  for (const t of result.targets) {
    out.push(`impact: ${t.name} (${t.kind})  ${t.file}:${t.line}${t.entry ? `  ◄ entry: ${t.entry}` : ''}`);
    walk(t.key, '  ');
    if (!byParent.has(t.key)) out.push('  (no callers found)');
  }
  const callers = result.nodes.filter((n) => !n.root);
  const likely = callers.filter((n) => n.confidence === 'likely').length;
  out.push('', `callers: ${callers.length} (${likely} likely, ${callers.length - likely} possible)  ·  entry points: ${result.entries.length}  ·  tests: ${result.tests.length}`);
  if (result.implementations.length) {
    out.push('', 'same method on other types (implementations, or unrelated same name):');
    for (const i of result.implementations.slice(0, 15)) out.push(`  - ${i.name}  ${i.file}:${i.line}`);
  }
  if (result.text.length) {
    out.push('', 'text matches (edges the parser cannot see — confirm by reading):');
    for (const t of result.text) out.push(`  ${t.kind} "${t.key}": ${t.hits.join(', ')}${t.more ? ` +${t.more} more` : ''}`);
  }
  if (result.docs.length) {
    out.push('', 'docs to re-check (feature code: covers these files):');
    for (const d of result.docs) out.push(`  - ${d.doc} (${d.status ?? 'no status'})  via ${d.via}`);
  }
  if (!result.tests.length && callers.length) out.push('', '✗ no test found on any caller path — add one before changing behavior');
  out.push('', 'legend: likely = name + import resolved · possible = same method name, receiver type unknown · text = string match');
  return out.join('\n');
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (name) => rest.includes(name);
  const value = (name, fallback) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : fallback);
  const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1] === '--depth'));
  let cwd = process.cwd();
  try {
    cwd = git(['rev-parse', '--show-toplevel'], cwd).trim();
  } catch {}
  const toRepo = (t) => {
    const m = t.match(/^(.+?)(:\d+)?$/);
    const abs = path.resolve(process.cwd(), m[1]);
    return fs.existsSync(abs) ? path.relative(cwd, abs).split(path.sep).join('/') + (m[2] ?? '') : t;
  };

  if (!['impact', 'callers', 'deps', 'index'].includes(cmd)) {
    console.log('usage: code-graph.mjs impact|callers <target> [--depth N] [--json] · deps [dir] [--mermaid] · index');
    process.exit(cmd ? 1 : 0);
  }
  const started = Date.now();
  const graph = await buildGraph(cwd);
  if (cmd === 'index') {
    const defs = [...graph.files.values()].reduce((n, d) => n + d.defs.length, 0);
    console.log(`code-graph: ${graph.files.size} files, ${defs} definitions, ${graph.parsed} parsed, ${Date.now() - started} ms`);
    return;
  }
  if (cmd === 'deps') {
    const { deps: list, cycles } = deps(graph, positional[0] ? toRepo(positional[0]) : '');
    if (flag('--mermaid')) {
      const id = (d) => d.replace(/[^\w]/g, '_') || 'root';
      console.log('flowchart LR');
      for (const d of list) for (const t of d.to) console.log(`    ${id(d.from)}[${d.from || '.'}] --> ${id(t)}[${t || '.'}]`);
    } else {
      for (const d of list) console.log(`${d.from || '.'} → ${d.to.length ? d.to.join(', ') : '(none)'}`);
    }
    for (const c of cycles) console.log(`✗ cycle: ${c.join(' → ')}`);
    return;
  }
  const target = positional[0];
  if (!target) {
    console.error(`${cmd} needs a target: Name | Type.Method | pkg.Name | file:line | file`);
    process.exit(1);
  }
  const targets = findTargets(graph, toRepo(target));
  if (!targets.length) {
    console.error(`no definition matches "${target}" in ${graph.files.size} Go/JS/TS/Python files`);
    process.exit(1);
  }
  if (targets.length > 5) {
    console.log(`${targets.length} definitions match "${target}" — showing 5; narrow with Type.Method or file:line:`);
    for (const t of targets) {
      const d = describe(graph, t.file, t.index);
      console.log(`  - ${d.name}  ${d.file}:${d.line}`);
    }
    console.log('');
  }
  const depth = cmd === 'callers' ? 1 : Number(value('--depth', 3));
  const result = impact(graph, targets.slice(0, 5), { depth });
  if (flag('--json')) console.log(JSON.stringify(result, null, 2));
  else console.log(printImpact(result, graph));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
