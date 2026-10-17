#!/usr/bin/env node
// Lints skill descriptions — the only routing signal Claude reads — against the
// rules in skills/SKILL-TEMPLATE.md, and checks that skills/TRIGGERS.md mirrors them.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = path.join(root, 'skills');
const triggersPath = path.join(skillsDir, 'TRIGGERS.md');
const casesPath = path.join(root, 'tests', 'routing-cases.md');

const MAX_DESCRIPTION = 1024;
const PHRASES_MIN = 2;
const PHRASES_MAX = 6;
// Claude Code built-ins that routing cases may expect instead of a repo skill.
const BUILTIN_SKILLS = ['code-review', 'update-config'];
// Cross-skill substring overlaps that are intended: the Not-for clause settles them.
const ALLOWED_OVERLAPS = [['tdd', 'tdd-rounds']];

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const quoted = (text) => [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const norm = (phrase) => phrase.toLowerCase();

function readSkills() {
  const skills = new Map();
  for (const dir of fs.readdirSync(skillsDir).sort()) {
    const file = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const where = `skills/${dir}/SKILL.md`;
    const frontmatter = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      fail(where, 'missing frontmatter');
      continue;
    }
    const field = (key) => frontmatter[1].match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1];
    const name = field('name');
    const description = field('description');
    if (name !== dir) fail(where, `name "${name}" does not match directory "${dir}"`);
    if (!description) {
      fail(where, 'missing description');
      continue;
    }
    const triggerList = description.match(/Triggered by ((?:"[^"]+"(?:, )?)+)/);
    skills.set(dir, { where, description, phrases: triggerList ? quoted(triggerList[1]) : [] });
  }
  return skills;
}

function checkShape(skills) {
  for (const { where, description, phrases } of skills.values()) {
    if (description.length > MAX_DESCRIPTION) {
      fail(where, `description is ${description.length} chars (max ${MAX_DESCRIPTION})`);
    }
    // WHY: both break a YAML plain scalar.
    if (description.includes(': ')) fail(where, 'description contains ": " (breaks YAML)');
    if (description.includes(' #')) fail(where, 'description contains " #" (starts a YAML comment)');
    if (!/\bUse (only )?(when|after)\b/.test(description)) fail(where, 'description has no "Use when" clause');
    if (!/\bNot (for|when)\b/.test(description)) fail(where, 'description has no "Not for" clause');
    if (phrases.length < PHRASES_MIN || phrases.length > PHRASES_MAX) {
      fail(where, `"Triggered by" lists ${phrases.length} phrases (want ${PHRASES_MIN}–${PHRASES_MAX})`);
    }
  }
}

function checkUniqueness(skills) {
  const allowed = (a, b) => ALLOWED_OVERLAPS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
  const entries = [...skills].flatMap(([skill, { phrases }]) => phrases.map((p) => ({ skill, p: norm(p) })));
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.skill === b.skill || allowed(a.skill, b.skill)) continue;
      if (a.p === b.p) fail(`${a.skill} / ${b.skill}`, `both claim "${a.p}"`);
      else if (a.p.includes(b.p) || b.p.includes(a.p)) {
        fail(`${a.skill} / ${b.skill}`, `"${a.p}" and "${b.p}" overlap`);
      }
    }
  }
}

function checkTriggersFile(skills) {
  const text = fs.readFileSync(triggersPath, 'utf8');
  const retiredSection = text.match(/## Retired phrases\n([\s\S]*?)\n## /);
  const retired = new Set(retiredSection ? quoted(retiredSection[1].split('\n\n').pop()).map(norm) : []);
  if (!retired.size) fail('skills/TRIGGERS.md', 'no "## Retired phrases" list found');

  for (const [skill, { where, phrases }] of skills) {
    for (const p of phrases) {
      if (retired.has(norm(p))) fail(where, `"${p}" is a retired phrase (see TRIGGERS.md)`);
    }
  }

  const rows = new Map();
  for (const line of text.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    const link = cells[2]?.match(/^\[`([^`]+)`\]\(([^)]+)\/SKILL\.md\)$/);
    if (!link) continue;
    const skill = link[2];
    if (!skills.has(skill)) {
      fail('skills/TRIGGERS.md', `row routes to "${skill}", which is not a skill`);
      continue;
    }
    if (rows.has(skill)) fail('skills/TRIGGERS.md', `more than one row for "${skill}"`);
    rows.set(skill, quoted(cells[1]));
  }

  for (const [skill, { phrases }] of skills) {
    const row = rows.get(skill);
    if (!row) {
      fail('skills/TRIGGERS.md', `no row for "${skill}"`);
      continue;
    }
    const inRow = new Set(row.map(norm));
    const inDescription = new Set(phrases.map(norm));
    for (const p of inDescription) {
      if (!inRow.has(p)) fail('skills/TRIGGERS.md', `"${skill}" row is missing "${p}" from its description`);
    }
    for (const p of inRow) {
      if (!inDescription.has(p)) fail('skills/TRIGGERS.md', `"${skill}" row lists "${p}", which its description does not`);
    }
  }
}

function checkRoutingCases(skills) {
  if (!fs.existsSync(casesPath)) {
    fail('tests/routing-cases.md', 'missing');
    return;
  }
  const known = new Set([...skills.keys(), ...BUILTIN_SKILLS]);
  for (const line of fs.readFileSync(casesPath, 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (!/^\d+$/.test(cells[1] ?? '')) continue;
    for (const [, name] of cells[3].matchAll(/`([^`]+)`/g)) {
      if (!known.has(name)) fail('tests/routing-cases.md', `case ${cells[1]} expects unknown skill "${name}"`);
    }
  }
}

const skills = readSkills();
checkShape(skills);
checkUniqueness(skills);
checkTriggersFile(skills);
checkRoutingCases(skills);

if (errors.length) {
  console.error(`lint-triggers: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`lint-triggers: ${skills.size} skills OK`);
