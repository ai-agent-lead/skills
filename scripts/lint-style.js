#!/usr/bin/env node
// Keeps the comment style single-sourced (ADR-0004): skill examples obey
// skills/formats/STYLE-comments.md, and its tag list matches the snippet and the checker.
// Keeps docs paths single-sourced (ADR-0005): every docs/ path a skill names is in DOCS-LAYOUT.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TAGS, CHECKS, DECLARATION } from '../skills/scripts/check-comments.mjs';
import { LAYOUT_PATTERNS } from '../skills/scripts/check-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (file) => path.relative(root, file);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const SOURCE = 'skills/formats/STYLE-comments.md';
const SNIPPET = 'snippets/comment-style.md';
// WHY: these files quote bad comments on purpose, as examples of what to delete.
const SHOWS_BAD_EXAMPLES = new Set([SOURCE, SNIPPET, 'skills/formats/WRITING-STYLE.md']);
// Phrases that mark a restatement of the rules; they may appear only where the rules live.
const RESTATEMENT = [/delete on sight/i, /you touch it, you own it/i];
const RESTATEMENT_ALLOWED = new Set([SOURCE, SNIPPET, 'CHANGELOG.md', 'docs/adr/0004-comment-style-single-source.md']);

// Test cases count as declarations here: a label above `test(` is copied just like one above a function.
const EXAMPLE_DECLARATION = new RegExp(`${DECLARATION.source}|^\\s*(test|it|describe)\\(`);

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name.startsWith('.') ? [] : markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

// A comment above a declaration may stay only as a real header: Go style (starts with the
// declared name) or a JSDoc block. Anything else is a label an agent will copy.
function isHeader(commentLines, declaration) {
  if (commentLines[0].trim().startsWith('/**')) return true;
  const name = declaration.match(/(?:func\s+(?:\([^)]*\)\s*)?|function\s+|class\s+|type\s+|interface\s+|const\s+|let\s+|var\s+)([A-Za-z_$][\w$]*)/)?.[1];
  const firstWord = commentLines[0].trim().replace(/^\/\/\s*/, '').split(/\s/)[0];
  return Boolean(name) && firstWord === name;
}

function checkExamples(file) {
  const where = rel(file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let inCode = false;
  let run = [];
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      run = [];
      return;
    }
    if (!inCode) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('/*') || (run.length && t.startsWith('*'))) {
      run.push(line);
      const text = t.replace(/^(\/\/+|\/\*+|\*+)\s?/, '');
      for (const { rule, re } of CHECKS) {
        if (!rule.startsWith('looks like commented-out') && re.test(text)) fail(`${where}:${i + 1}`, `example comment ${rule.split(' — ')[0]}: "${t}"`);
      }
      return;
    }
    if (run.length && EXAMPLE_DECLARATION.test(line) && !isHeader(run, line)) {
      const tagged = TAGS.some((tag) => run[0].trim().replace(/^\/\/\s*/, '').startsWith(tag));
      if (!tagged) fail(`${where}:${i + 1 - run.length}`, `comment above a declaration inside an example — agents copy it; move the label into the text above the code block: "${run[0].trim()}"`);
    }
    run = [];
  });
}

function checkTagsInSync() {
  const shown = (tag) => (tag === 'TODO(' ? 'TODO(owner):' : tag);
  for (const file of [SOURCE, SNIPPET]) {
    const text = read(file);
    for (const tag of TAGS) {
      if (!text.includes(`\`${shown(tag)}\``)) fail(file, `does not list the tag \`${shown(tag)}\` used by scripts/check-comments.mjs`);
    }
  }
}

// The always-on hygiene snippet must name every principle of formats/CODE-HYGIENE.md except
// comments, which have their own snippet.
function checkHygieneInSync() {
  const snippet = read('snippets/code-hygiene.md');
  const principles = [...read('skills/formats/CODE-HYGIENE.md').matchAll(/^\d+\. \*\*([^*]+)\*\*/gm)].map((m) => m[1]);
  const key = { 'Boring code beats clever code': 'Boring', 'Naming is the primary refactor': 'Naming', 'Comments earn their keep': null, 'Locality of behavior': 'Locality', 'Constants live where they\'re used': 'Constants', 'Rule of 3 before extracting': 'Rule of 3', YAGNI: 'YAGNI' };
  for (const p of principles) {
    if (!(p in key)) fail('snippets/code-hygiene.md', `CODE-HYGIENE.md has a new principle "${p}" — add it to the snippet and to checkHygieneInSync`);
    else if (key[p] && !snippet.includes(`**${key[p]}`)) fail('snippets/code-hygiene.md', `does not name the principle "${p}"`);
  }
}

function checkSingleSource(files) {
  for (const file of files) {
    const where = rel(file);
    if (RESTATEMENT_ALLOWED.has(where)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const re of RESTATEMENT) {
      if (re.test(text)) fail(where, `restates the comment rules (${re.source}) — link ${SOURCE} instead`);
    }
  }
}

// A directory is valid when some file the layout allows could live in it.
const DIR_PROBES = ['x.md', '0001-x.md', 'x/feature.md', 'CONTEXT.md', 'x/state/x.md'];
const inLayout = (p) => LAYOUT_PATTERNS.some((re) => re.test(p));

function checkDocPaths(file) {
  const where = rel(file);
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\w./-])docs\/[A-Za-z0-9_<>./*-]*/g)) {
      const p = m[0].replace(/\.+$/, '');
      if (p.includes('*') || p === 'docs/') continue;
      const ok = p.endsWith('.md') ? inLayout(p) : DIR_PROBES.some((probe) => inLayout(`${p.replace(/\/?$/, '/')}${probe}`));
      if (!ok) fail(`${where}:${i + 1}`, `docs path "${p}" is not in the DOCS-LAYOUT table (skills/formats/DOCS-LAYOUT.md §1)`);
    }
  });
}

const files = [...markdownFiles(path.join(root, 'skills')), ...markdownFiles(path.join(root, 'docs')), path.join(root, 'README.md')];
for (const file of files) {
  if (!SHOWS_BAD_EXAMPLES.has(rel(file))) checkExamples(file);
}
for (const file of [...markdownFiles(path.join(root, 'skills')), path.join(root, 'README.md')]) checkDocPaths(file);
checkTagsInSync();
checkHygieneInSync();
checkSingleSource([...files, path.join(root, SNIPPET)]);

if (errors.length) {
  console.error(`lint-style: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`lint-style: ${files.length} files OK`);
