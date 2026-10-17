#!/usr/bin/env node
// Checks the comments in a diff against skills/formats/STYLE-comments.md.
//
// Usage: node check-comments.mjs [base]
//   base defaults to the merge-base with main/master, else HEAD.
//   Compares base to the working tree, plus untracked files.
// Exit code: 1 when an added comment breaks a rule, else 0.

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const TAGS = ['WHY:', 'WORKAROUND:', 'SAFETY:', 'TODO('];

// WHY: third-party code keeps its own comments; they are not ours to review.
const VENDORED = /(^|\/)(vendor|node_modules|third_party)\/|\.min\.[cm]?js$/;

const SLASH_EXT = new Set(['.go', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.java', '.kt', '.swift', '.rs', '.c', '.h', '.cc', '.cpp', '.cs', '.scala', '.dart', '.php']);
const HASH_EXT = new Set(['.py', '.rb', '.sh', '.bash', '.zsh', '.yaml', '.yml', '.toml', '.pl', '.r', '.ex', '.exs']);

const DIRECTIVE = /^(go:|nolint|lint:|eslint|prettier-ignore|biome-ignore|@ts-|istanbul|c8 |jshint|global |Code generated|SPDX-|\+build|#?region|#?endregion|noqa|type:|pylint:|pragma|!)/;
const STARTS_NEW = new RegExp(`^(${['WHY:', 'WORKAROUND:', 'SAFETY:', 'TODO', 'FIXME', 'XXX', 'HACK', 'NOTE'].join('|').replace(/[()]/g, '\\$&')})`, 'i');
export const DECLARATION = /^\s*(export\s+)?(default\s+)?(async\s+)?(package|func|function|class|interface|type|const|let|var|enum|struct|def|public|private|protected|static)\b|^\s*[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/;

export const CHECKS = [
  { rule: 'narrates the edit — state the current fact (WHY:) or move it to the commit message', re: /(?<!-)\b(now|no longer|was|were|changed|updated?|fixed|previously|used to|replaced|renamed|moved|increased|decreased|refactored)\b/i },
  { rule: 'talks to the reviewer — put it in the PR or chat', re: /\b(as (you )?(mentioned|asked|requested|discussed)|per (your|the) (request|review|discussion)|see discussion)\b/i },
  { rule: 'process tag — round/AC ids belong in commit messages', re: /\bR\d+\b|\bAC-[A-Z0-9]+\b/ },
  { rule: 'TODO without owner — use TODO(owner): or TODO(#123):', re: /\b(TODO(?!\()|FIXME|XXX|HACK)\b/ },
  { rule: 'looks like commented-out code — delete it; git has it', re: /^\s*(if|for|while|return|const|let|var|func|function|await|import|export|defer)\b.*[;{)]\s*$|^\s*[\w.$]+\s*(\(.*\)|[:+-]?=\s*\S.*);?\s*$/ },
];

const stripStrings = (code) => code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, '""');

// Returns { text, full } for the comment on this line, or null. `state.inBlock` tracks /* ... */.
function commentOf(line, style, state) {
  const t = line.trim();
  if (style === 'slash') {
    if (state.inBlock) {
      if (t.includes('*/')) state.inBlock = false;
      return { text: t.replace(/\*\/.*$/, '').replace(/^\*+\s?/, ''), full: true, block: true };
    }
    if (t.startsWith('/*')) {
      if (!t.includes('*/')) state.inBlock = true;
      return { text: t.replace(/^\/\*+\s?/, '').replace(/\*\/.*$/, ''), full: true, block: true };
    }
    if (t.startsWith('//')) return { text: t.replace(/^\/\/+\s?/, ''), full: true };
    const m = stripStrings(line).match(/\s\/\/\s?(.*)$/);
    return m ? { text: m[1], full: false } : null;
  }
  if (t.startsWith('#!')) return null;
  if (t.startsWith('#')) return { text: t.replace(/^#+\s?/, ''), full: true };
  const m = stripStrings(line).match(/\s#\s(.*)$/);
  return m ? { text: m[1], full: false } : null;
}

function styleOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (SLASH_EXT.has(ext)) return 'slash';
  if (HASH_EXT.has(ext)) return 'hash';
  return null;
}

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

// Parses `git diff -W` into hunks of { file, lines: [{ kind: '+'|'-'|' ', no, code }] }.
function parseDiff(diff) {
  const hunks = [];
  let file = null;
  let hunk = null;
  let oldNo = 0;
  let newNo = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw === '+++ /dev/null' ? null : raw.replace(/^\+\+\+ b\//, '');
      continue;
    }
    const header = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (header) {
      oldNo = Number(header[1]);
      newNo = Number(header[2]);
      hunk = { file, lines: [] };
      if (file) hunks.push(hunk);
      continue;
    }
    if (!hunk || !file || raw.startsWith('\\')) continue;
    const kind = raw[0];
    if (kind === '+') hunk.lines.push({ kind, no: newNo++, code: raw.slice(1) });
    else if (kind === '-') hunk.lines.push({ kind, no: oldNo++, code: raw.slice(1) });
    else if (kind === ' ') {
      hunk.lines.push({ kind, no: newNo++, code: raw.slice(1) });
      oldNo++;
    }
  }
  return hunks;
}

// Groups the comments of one hunk into units: a run of full-line comments is one unit;
// a trailing comment is its own unit. A unit directly above a declaration is a header.
function commentUnits(hunk, style) {
  const units = [];
  const state = { inBlock: false };
  const newSide = hunk.lines.filter((l) => l.kind !== '-');
  let run = null;
  const close = (next) => {
    if (!run) return;
    run.header = Boolean(next && DECLARATION.test(next.code)) || run.lines[0].no <= 2;
    run.atHunkEnd = !next;
    units.push(run);
    run = null;
  };
  for (const line of newSide) {
    const c = commentOf(line.code, style, state);
    if (c && c.full) {
      const text = c.text.trim();
      if (DIRECTIVE.test(text)) {
        close(line);
        continue;
      }
      if (run && STARTS_NEW.test(text)) close(line);
      if (!run) run = { lines: [], header: false };
      run.lines.push({ ...line, text: c.text });
      continue;
    }
    if (line.code.trim() === '' && run) continue;
    close(line);
    if (c) units.push({ lines: [{ ...line, text: c.text }], header: false, trailing: true });
  }
  close(null);
  return units;
}

function countRemoved(hunk, style) {
  const state = { inBlock: false };
  return hunk.lines.filter((l) => l.kind === '-' && commentOf(l.code, style, state)).length;
}

export function check({ cwd = process.cwd(), base } = {}) {
  base = base || defaultBase(cwd);
  const diff = git(['diff', '-W', '--no-color', '--no-ext-diff', base], cwd);
  const hunks = parseDiff(diff);
  const untracked = git(['ls-files', '--others', '--exclude-standard'], cwd).split('\n').filter(Boolean);
  for (const file of untracked) {
    const code = fs.readFileSync(path.join(cwd, file), 'utf8').split('\n');
    hunks.push({ file, lines: code.map((c, i) => ({ kind: '+', no: i + 1, code: c })) });
  }

  const problems = [];
  const recheck = [];
  let added = 0;
  let removed = 0;

  for (const hunk of hunks) {
    const style = styleOf(hunk.file);
    if (!style || VENDORED.test(hunk.file)) continue;
    removed += countRemoved(hunk, style);
    for (const unit of commentUnits(hunk, style)) {
      const first = unit.lines[0];
      const text = unit.lines.map((l) => l.text).join(' ').trim();
      const where = `${hunk.file}:${first.no}`;
      const addedLines = unit.lines.filter((l) => l.kind === '+');
      added += addedLines.length;
      if (!text || DIRECTIVE.test(first.text.trim())) continue;
      if (!addedLines.length) {
        // WHY: git -W ends a hunk with the next function's header; that function is untouched.
        if (unit.atHunkEnd) continue;
        recheck.push({ where, text, header: unit.header });
        continue;
      }
      const tagged = TAGS.some((tag) => first.text.trim().startsWith(tag));
      if (!unit.header && !tagged) {
        problems.push({ where, text, rule: 'untagged comment — tag it (WHY: / WORKAROUND: / SAFETY: / TODO(owner):) or delete it' });
      }
      for (const { rule, re } of CHECKS) {
        if (addedLines.some((l) => re.test(l.text))) problems.push({ where, text, rule });
      }
    }
  }
  return { base, added, removed, problems, recheck };
}

function main() {
  const result = check({ base: process.argv[2] });
  const short = (s) => (s.length > 70 ? `${s.slice(0, 67)}...` : s);
  console.log(`check-comments: against ${result.base.slice(0, 12)}`);
  console.log(`comment lines: +${result.added} -${result.removed}\n`);
  if (result.problems.length) {
    console.log(`Problems in added comments (${result.problems.length}):`);
    for (const p of result.problems) console.log(`  ${p.where}  ${p.rule}\n      "${short(p.text)}"`);
    console.log('');
  }
  if (result.recheck.length) {
    console.log(`Re-check — existing comments in code you changed. Still true now? (${result.recheck.length}):`);
    for (const r of result.recheck) console.log(`  ${r.where}${r.header ? ' [header]' : ''}  "${short(r.text)}"`);
    console.log('');
  }
  if (!result.problems.length && !result.recheck.length) console.log('No comments to review.');
  process.exit(result.problems.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
