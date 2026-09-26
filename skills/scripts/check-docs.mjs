#!/usr/bin/env node
// Checks docs/ against skills/formats/DOCS-LAYOUT.md and regenerates docs/index.md.
//
// Usage: node check-docs.mjs [--changed] [--write]
//        node check-docs.mjs --hook session|edit|stop   (Claude Code hooks; JSON on stdin)
//   --changed  report problems only in docs that differ from the merge-base with main/master.
//   --write    rewrite the generated block in docs/index.md.
// Exit code: 1 when a problem is found (--hook stop: 2, which blocks the agent from stopping).

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const STATUSES = {
  feature: ['draft', 'approved', 'building', 'done', 'shipped', 'dropped'],
  release: ['planned', 'building', 'shipped'],
  research: ['open', 'decided', 'superseded'],
  adr: ['proposed', 'accepted', 'deprecated', 'superseded'],
};

// Every path a skill may write under docs/. `<domain>/` is optional: a repo starts flat.
export const LAYOUT = [
  { type: 'index', path: 'docs/index.md' },
  { type: 'roadmap', path: 'docs/roadmap.md' },
  { type: 'context-map', path: 'docs/CONTEXT-MAP.md' },
  { type: 'architecture', path: 'docs/architecture.md' },
  { type: 'convention', path: 'docs/CONVENTIONS.md' },
  { type: 'known-issues', path: 'docs/known-issues.md' },
  { type: 'state', path: 'docs/STATE.md' },
  { type: 'release', path: 'docs/releases/<version>.md' },
  { type: 'context', path: 'docs/<domain>/CONTEXT.md' },
  { type: 'adr', path: 'docs/<domain>/adr/NNNN-<slug>.md' },
  { type: 'research', path: 'docs/<domain>/research/<topic>.md' },
  { type: 'feature', path: 'docs/<domain>/features/<name>/feature.md' },
  { type: 'design', path: 'docs/<domain>/features/<name>/design.md' },
  { type: 'migration', path: 'docs/<domain>/features/<name>/migration.md' },
  { type: 'security', path: 'docs/<domain>/features/<name>/security.md' },
  { type: 'benchmark', path: 'docs/<domain>/features/<name>/bench.md' },
  { type: 'state', path: 'docs/<domain>/features/<name>/state/<file>.md' },
];

const SEGMENT = '[A-Za-z0-9<>._-]+';
// Matches a concrete path (docs/billing/adr/0007-x.md) or a placeholder one (docs/<domain>/adr/NNNN-<slug>.md).
export const LAYOUT_PATTERNS = LAYOUT.map(({ path: p }) => new RegExp(
  `^${p
    .replace(/[.]/g, '\\.')
    .replace('docs/<domain>/', `docs/(?:${SEGMENT}/)?`)
    .replace(/<[a-z]+>|NNNN/g, SEGMENT)}$`,
));

const INDEX_START = '<!-- check-docs:index:start -->';
const INDEX_END = '<!-- check-docs:index:end -->';
const KIND_ORDER = ['context', 'context-map', 'architecture', 'convention', 'roadmap', 'release', 'feature', 'adr', 'research', 'known-issues'];
const KIND_TITLE = { context: 'Context', 'context-map': 'Context', architecture: 'Context', convention: 'Context', roadmap: 'Releases', release: 'Releases', feature: 'Features', adr: 'Decisions', research: 'Research', 'known-issues': 'Tracking' };
const ACTIVE_FIRST = ['building', 'approved', 'draft', 'planned', 'open', 'proposed', 'done'];

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

function defaultBase(cwd) {
  for (const branch of ['main', 'master']) {
    try {
      return git(['merge-base', 'HEAD', branch], cwd).trim();
    } catch {}
  }
  return 'HEAD';
}

// Repo-relative files that differ from base: committed, in the working tree, or untracked.
export function changedFiles(cwd, base = defaultBase(cwd)) {
  try {
    const tracked = git(['diff', '--name-only', base], cwd).split('\n');
    const untracked = git(['ls-files', '--others', '--exclude-standard'], cwd).split('\n');
    return [...new Set([...tracked, ...untracked].filter(Boolean))];
  } catch {
    return [];
  }
}

// Minimal YAML for frontmatter: `key: value` and `key: [a, b]` or a `- item` list.
export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const data = {};
  let listKey = null;
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.replace(/\s+#.*$/, '').trim();
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (value.startsWith('[')) {
      data[key] = value.replace(/^\[|\]$/g, '').split(',').map((v) => unquote(v.trim())).filter(Boolean);
      listKey = null;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }
  return data;
}

const unquote = (v) => v.replace(/^(['"])(.*)\1$/, '$2');

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('.') ? [] : markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

// Links outside code fences: [text](target). Returns { line, target, checked }.
function links(text) {
  const out = [];
  let inCode = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) inCode = !inCode;
    if (inCode) return;
    const bare = line.replace(/`[^`]*`/g, '');
    for (const m of bare.matchAll(/(?:^\s*[-*]\s+\[([ xX])\]\s+)?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      out.push({ line: i + 1, target: m[2], checked: m[1] ? m[1].toLowerCase() === 'x' : null });
    }
  });
  return out;
}

const isLocal = (target) => !/^([a-z]+:|#|\/\/)/i.test(target);

// Loads every doc under docs/ as { rel, data, text }.
export function loadDocs(cwd) {
  return markdownFiles(path.join(cwd, 'docs')).map((full) => {
    const text = fs.readFileSync(full, 'utf8');
    return { rel: path.relative(cwd, full).split(path.sep).join('/'), data: parseFrontmatter(text), text };
  });
}

// Feature docs whose `code:` paths cover this repo-relative file.
export function docsCovering(docs, file) {
  return docs.filter((d) => d.data?.type === 'feature' && covers(d.data.code, file));
}

function covers(codePaths, file) {
  const list = Array.isArray(codePaths) ? codePaths : codePaths ? [codePaths] : [];
  return list.some((p) => {
    const prefix = p.replace(/\*.*$/, '').replace(/^\.\//, '');
    return prefix && (file === prefix || file.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || (p.includes('*') && file.startsWith(prefix)));
  });
}

const statusWord = (s) => String(s ?? '').trim().split(/\s+/)[0];
const featureFolder = (rel) => path.posix.dirname(rel);

export function check({ cwd = process.cwd(), changedOnly = false, base } = {}) {
  const docs = loadDocs(cwd);
  const byRel = new Map(docs.map((d) => [d.rel, d]));
  const changed = changedFiles(cwd, base);
  const problems = [];
  const recheck = [];
  const add = (rel, line, rule, about) => problems.push({ where: line ? `${rel}:${line}` : rel, rel, rule, about });

  for (const doc of docs) {
    const { rel, data, text } = doc;
    const name = path.posix.basename(rel);
    if (name === 'index.md' || name === 'log.md') continue;
    if (!data || !data.type) {
      add(rel, 1, 'no frontmatter `type:` — every doc under docs/ opens with OKF frontmatter');
      continue;
    }
    const allowed = STATUSES[data.type];
    const status = statusWord(data.status);
    if (allowed && !allowed.includes(status)) {
      add(rel, 1, `status "${data.status ?? ''}" — ${data.type} status is one of: ${allowed.join(', ')}`);
    }
    const bold = text.match(/^\*\*Status:\*\*\s*(\S+)/m);
    if (bold && data.status && bold[1].toLowerCase().replace(/[^a-z]/g, '') !== status.toLowerCase()) {
      add(rel, null, `**Status:** line says "${bold[1]}" but frontmatter says "${data.status}" — keep status in frontmatter only`);
    }
    if (!LAYOUT_PATTERNS.some((re) => re.test(rel))) {
      recheck.push({ where: rel, rule: 'path is not in the DOCS-LAYOUT table — move it, or add the kind to the table' });
    }
    for (const p of [data.code ?? []].flat()) {
      const prefix = p.replace(/\*.*$/, '');
      if (!fs.existsSync(path.join(cwd, prefix))) add(rel, 1, `code: path "${p}" does not exist — update it to where the code lives now`);
    }
    for (const link of links(text)) {
      if (!isLocal(link.target)) continue;
      const target = decodeURI(link.target.split('#')[0]);
      if (!target) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), target));
      if (!fs.existsSync(path.join(cwd, resolved))) {
        add(rel, link.line, `broken link → ${link.target}`);
        continue;
      }
      if (link.checked === null) continue;
      const linked = byRel.get(resolved)?.data;
      if (data.type === 'release' && linked?.type === 'feature') {
        const shipped = statusWord(linked.status) === 'shipped';
        if (link.checked && !shipped) add(rel, link.line, `ticked, but ${resolved} is "${linked.status}" — tick only when the feature is shipped`, resolved);
        if (!link.checked && shipped) add(rel, link.line, `${resolved} is shipped — tick its box`, resolved);
        if (!link.checked && status === 'shipped') add(rel, link.line, 'release is shipped with an unticked feature — tick it, or move the line to a later release');
      }
      if (data.type === 'roadmap' && linked?.type === 'release') {
        const shipped = statusWord(linked.status) === 'shipped';
        if (link.checked !== shipped) add(rel, link.line, `box is ${link.checked ? 'ticked' : 'unticked'} but ${resolved} is "${linked.status}"`, resolved);
      }
    }
  }

  const index = byRel.get('docs/index.md');
  if (index && index.text.includes(INDEX_START)) {
    if (renderIndex(cwd, docs, index.text) !== index.text) {
      add('docs/index.md', null, 'generated list is stale — run: node <skills-dir>/scripts/check-docs.mjs --write');
    }
    for (const link of links(index.text)) {
      if (!isLocal(link.target)) continue;
      if (!fs.existsSync(path.join(cwd, 'docs', decodeURI(link.target.split('#')[0])))) add('docs/index.md', link.line, `broken link → ${link.target}`);
    }
  }

  const changedSet = new Set(changed);
  for (const doc of docs) {
    if (doc.data?.type !== 'feature' || statusWord(doc.data.status) === 'dropped') continue;
    const touched = changed.filter((f) => !f.startsWith('docs/') && covers(doc.data.code, f));
    if (!touched.length) continue;
    const folder = featureFolder(doc.rel);
    const docTouched = changed.some((f) => f === doc.rel || (path.posix.basename(doc.rel) === 'feature.md' && f.startsWith(`${folder}/`)));
    const status = statusWord(doc.data.status);
    if (['draft', 'approved'].includes(status)) {
      recheck.push({ where: doc.rel, rule: `code under it changed (${touched[0]}${touched.length > 1 ? ` +${touched.length - 1}` : ''}) but status is "${status}" — set building?` });
    } else if (!docTouched) {
      recheck.push({ where: doc.rel, rule: `code under it changed (${touched[0]}${touched.length > 1 ? ` +${touched.length - 1}` : ''}) but the doc did not — still true?` });
    }
  }

  const docChanged = docs.some((d) => changedSet.has(d.rel));
  const scoped = changedOnly
    ? problems.filter((p) => changedSet.has(p.rel) || changedSet.has(p.about) || (p.rel === 'docs/index.md' && docChanged))
    : problems;
  return { docs, problems: scoped, recheck, changed };
}

// Rewrites the block between the index markers from frontmatter. Text outside the markers is kept.
export function renderIndex(cwd, docs, current) {
  const listed = docs.filter((d) => d.data?.type && !['index', 'state', 'design', 'migration', 'security', 'benchmark'].includes(d.data.type) && !d.rel.endsWith('/index.md'));
  const scopeOf = (rel) => {
    const parts = rel.split('/');
    const kindDirs = ['adr', 'research', 'features', 'releases'];
    return parts.length > 2 && !kindDirs.includes(parts[1]) ? parts[1] : '';
  };
  const scopes = [...new Set(listed.map((d) => scopeOf(d.rel)))].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
  const out = [];
  for (const scope of scopes) {
    const inScope = listed.filter((d) => scopeOf(d.rel) === scope);
    if (scope) out.push(`## ${scope}`, '');
    const sections = [...new Set(KIND_ORDER.map((k) => KIND_TITLE[k]).concat('Other'))];
    for (const section of sections) {
      const entries = inScope
        .filter((d) => (KIND_TITLE[d.data.type] ?? 'Other') === section)
        .sort((a, b) => rank(a) - rank(b) || a.rel.localeCompare(b.rel));
      if (!entries.length) continue;
      out.push(`${scope ? '###' : '##'} ${section}`, '');
      for (const d of entries) {
        const href = `./${path.posix.relative('docs', d.rel)}`;
        const status = d.data.status && d.data.type !== 'adr' ? ` · ${statusWord(d.data.status)}` : '';
        out.push(`* [${d.data.title ?? path.posix.basename(d.rel, '.md')}](${href}) — ${d.data.description ?? ''}${status}`.replace(/ — $/, ''));
        if (d.data.type === 'feature' && path.posix.basename(d.rel) === 'feature.md') {
          const folder = featureFolder(d.rel);
          for (const sib of docs.filter((s) => s !== d && featureFolder(s.rel) === folder && s.data?.type).sort((a, b) => a.rel.localeCompare(b.rel))) {
            out.push(`  * [${path.posix.basename(sib.rel, '.md')}](./${path.posix.relative('docs', sib.rel)})`);
          }
        }
      }
      out.push('');
    }
  }
  const block = `${INDEX_START}\n<!-- Generated from frontmatter by check-docs.mjs --write. Edit the docs, not this list. -->\n\n${out.join('\n').trimEnd()}\n\n${INDEX_END}`;
  const start = current.indexOf(INDEX_START);
  const end = current.indexOf(INDEX_END);
  if (start === -1 || end < start) return `${current.trimEnd()}\n\n${block}\n`;
  return current.slice(0, start) + block + current.slice(end + INDEX_END.length);
}

function rank(doc) {
  const i = ACTIVE_FIRST.indexOf(statusWord(doc.data.status));
  const kind = KIND_ORDER.indexOf(doc.data.type);
  return kind * 100 + (i === -1 ? 50 : i);
}

export function writeIndex(cwd) {
  const file = path.join(cwd, 'docs', 'index.md');
  const docs = loadDocs(cwd);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# docs\n';
  const next = renderIndex(cwd, docs, current);
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

// Short context for the start of a session: where to begin, and what is in flight.
export function sessionContext(cwd) {
  const docs = loadDocs(cwd);
  if (!docs.length) return '';
  const active = (type, statuses) => docs.filter((d) => d.data?.type === type && statuses.includes(statusWord(d.data.status)));
  const line = (d) => `- ${d.rel} — ${statusWord(d.data.status)}`;
  const releases = active('release', ['planned', 'building']);
  const features = active('feature', ['approved', 'building', 'done']);
  const out = ['Docs: start at docs/index.md. Status changes and upkeep follow formats/DOCS-LAYOUT.md in the installed skills.'];
  if (releases.length) out.push('Releases in progress:', ...releases.map(line));
  if (features.length) out.push('Features in flight:', ...features.map(line));
  return out.join('\n');
}

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function repoRoot(dir) {
  try {
    return git(['rev-parse', '--show-toplevel'], dir).trim();
  } catch {
    return dir;
  }
}

const hookOutput = (event, context) => JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } });

// WHY: hooks run in every project, including ones with no docs/ — they must stay silent there.
function runHook(mode) {
  const input = readStdin();
  const cwd = repoRoot(input.cwd || process.cwd());
  if (!fs.existsSync(path.join(cwd, 'docs'))) return 0;
  if (mode === 'session') {
    const context = sessionContext(cwd);
    if (context) console.log(hookOutput('SessionStart', context));
    return 0;
  }
  if (mode === 'edit') {
    const file = input.tool_input?.file_path;
    if (!file) return 0;
    const rel = path.relative(cwd, path.resolve(cwd, file)).split(path.sep).join('/');
    if (rel.startsWith('..') || rel.startsWith('docs/')) return 0;
    const covering = docsCovering(loadDocs(cwd), rel);
    if (covering.length) {
      const list = covering.map((d) => `${d.rel} (${statusWord(d.data.status)})`).join(', ');
      console.log(hookOutput('PostToolUse', `${rel} is covered by ${list}. Keep that doc true, and its status current, before you finish.`));
    }
    return 0;
  }
  if (mode === 'stop') {
    // WHY: Claude Code sets stop_hook_active after one block; blocking again would loop forever.
    if (input.stop_hook_active) return 0;
    const { problems } = check({ cwd, changedOnly: true });
    if (!problems.length) return 0;
    console.error(`Docs checks failed (formats/DOCS-LAYOUT.md). Fix before finishing:\n${problems.map((p) => `- ${p.where}  ${p.rule}`).join('\n')}`);
    return 2;
  }
  return 0;
}

function main() {
  const args = process.argv.slice(2);
  const hook = args.indexOf('--hook');
  if (hook !== -1) process.exit(runHook(args[hook + 1]));
  const cwd = repoRoot(process.cwd());
  if (args.includes('--write') && writeIndex(cwd)) console.log('check-docs: docs/index.md regenerated');
  const result = check({ cwd, changedOnly: args.includes('--changed') });
  console.log(`check-docs: ${result.docs.length} docs`);
  if (result.problems.length) {
    console.log(`\nProblems (${result.problems.length}):`);
    for (const p of result.problems) console.log(`  ${p.where}  ${p.rule}`);
  }
  if (result.recheck.length) {
    console.log(`\nRe-check (${result.recheck.length}):`);
    for (const r of result.recheck) console.log(`  ${r.where}  ${r.rule}`);
  }
  if (!result.problems.length && !result.recheck.length) console.log('No problems.');
  process.exit(result.problems.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
