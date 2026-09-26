import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALL = path.join(ROOT, 'bin/install.js');
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(ROOT, 'skills', e.name, 'SKILL.md')))
  .map((e) => e.name);
const START = '<!-- ai-agent-lead/skills:style:start -->';

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-'));
  const home = path.join(dir, 'home');
  const project = path.join(dir, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(project);
  const run = (...args) => spawnSync('node', [INSTALL, ...args], {
    cwd: project,
    env: { ...process.env, HOME: home },
    encoding: 'utf8',
  });
  const read = (file) => fs.readFileSync(file, 'utf8');
  return { home, project, run, read };
}

const count = (text, needle) => text.split(needle).length - 1;

test('--help prints usage and writes nothing', () => {
  const { home, run } = sandbox();
  const out = run('--help');
  assert.equal(out.status, 0);
  assert.match(out.stdout, /--hooks/);
  assert.deepEqual(fs.readdirSync(home), []);
});

test('--global --claude installs every skill, the formats, and the scripts', () => {
  const { home, run } = sandbox();
  const out = run('--global', '--claude');
  assert.equal(out.status, 0, out.stderr);
  const dest = path.join(home, '.claude/skills');
  for (const skill of SKILLS) assert.ok(fs.existsSync(path.join(dest, skill, 'SKILL.md')), skill);
  for (const file of ['formats/DOCS-LAYOUT.md', 'scripts/check-docs.mjs', 'scripts/check-comments.mjs', 'scripts/code-graph/vendor/tree-sitter-go.wasm']) {
    assert.ok(fs.existsSync(path.join(dest, file)), file);
  }
  assert.ok(!fs.existsSync(path.join(home, '.codex')), 'only the chosen assistant');
});

test('with no flags and no terminal, it installs globally for every assistant', () => {
  const { home, run } = sandbox();
  assert.equal(run().status, 0);
  for (const dir of ['.claude/skills', '.codex/skills', '.gemini/antigravity/skills', '.config/opencode/skills']) {
    assert.ok(fs.existsSync(path.join(home, dir, 'tdd/SKILL.md')), dir);
  }
});

test('existing files are kept unless --force', () => {
  const { home, run, read } = sandbox();
  run('--global', '--claude');
  const file = path.join(home, '.claude/skills/tdd/SKILL.md');
  fs.writeFileSync(file, 'my local edit');
  assert.match(run('--global', '--claude').stdout, /skipped — use --force/);
  assert.equal(read(file), 'my local edit');
  run('--global', '--claude', '--force');
  assert.equal(read(file), read(path.join(ROOT, 'skills/tdd/SKILL.md')));
});

test('--style writes all four rule blocks once, and keeps the user\'s own text', () => {
  const { home, run, read } = sandbox();
  const file = path.join(home, '.claude/CLAUDE.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '# My rules\n\nAlways use tabs.\n');
  run('--global', '--claude', '--style');
  run('--global', '--claude', '--style');
  const text = read(file);
  assert.match(text, /^# My rules\n\nAlways use tabs\./);
  assert.equal(count(text, START), 1, 're-running replaces the block');
  for (const heading of ['## Writing style', '## Code comments', '## Code hygiene', '## Docs']) assert.ok(text.includes(heading), heading);
});

test('--local --style writes each assistant\'s project file', () => {
  const { project, run } = sandbox();
  run('--local', '--codex', '--antigravity', '--style');
  for (const name of ['AGENTS.md', 'GEMINI.md']) assert.ok(fs.readFileSync(path.join(project, name), 'utf8').includes(START), name);
  assert.ok(!fs.existsSync(path.join(project, 'CLAUDE.md')), 'Claude not selected');
});

test('--hooks adds three hooks once and keeps other settings and hooks', () => {
  const { home, run, read } = sandbox();
  const file = path.join(home, '.claude/settings.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ model: 'opus', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo mine' }] }] } }));
  run('--global', '--claude', '--hooks');
  assert.match(run('--global', '--claude', '--hooks').stdout, /settings\.json.*unchanged/);
  const settings = JSON.parse(read(file));
  assert.equal(settings.model, 'opus');
  const commands = (event) => settings.hooks[event].flatMap((g) => g.hooks.map((h) => h.command));
  assert.deepEqual(commands('Stop').filter((c) => c === 'echo mine'), ['echo mine']);
  for (const [event, mode] of [['SessionStart', 'session'], ['PostToolUse', 'edit'], ['Stop', 'stop']]) {
    assert.equal(commands(event).filter((c) => c.includes('check-docs.mjs')).length, 1, event);
    assert.ok(commands(event).some((c) => c.endsWith(`--hook ${mode}`)), event);
  }
  assert.equal(settings.hooks.PostToolUse.at(-1).matcher, 'Edit|Write|MultiEdit');
});

test('the installed session hook runs and reports docs in flight', () => {
  const { home, project, run, read } = sandbox();
  run('--global', '--claude', '--hooks');
  const command = JSON.parse(read(path.join(home, '.claude/settings.json'))).hooks.SessionStart.at(-1).hooks[0].command;
  fs.mkdirSync(path.join(project, 'docs/features/refunds'), { recursive: true });
  fs.writeFileSync(path.join(project, 'docs/features/refunds/feature.md'), '---\ntype: feature\ntitle: Refunds\nstatus: building\n---\n# Refunds\n');
  const out = spawnSync('sh', ['-c', command], { cwd: project, input: JSON.stringify({ cwd: project }), encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.match(JSON.parse(out.stdout).hookSpecificOutput.additionalContext, /docs\/features\/refunds\/feature\.md — building/);
});

test('--local --hooks points at the project copy through $CLAUDE_PROJECT_DIR', () => {
  const { project, run, read } = sandbox();
  run('--local', '--claude', '--hooks');
  const command = JSON.parse(read(path.join(project, '.claude/settings.json'))).hooks.Stop.at(-1).hooks[0].command;
  assert.match(command, /\$CLAUDE_PROJECT_DIR\/\.claude\/skills\/scripts\/check-docs\.mjs" --hook stop$/);
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/scripts/check-docs.mjs')));
});

test('an unreadable settings.json is left untouched', () => {
  const { home, run, read } = sandbox();
  const file = path.join(home, '.claude/settings.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{ not json');
  const out = run('--global', '--claude', '--hooks');
  assert.match(out.stderr, /settings\.json left unchanged/);
  assert.equal(read(file), '{ not json');
});

test('--hooks without Claude warns and writes no settings', () => {
  const { home, run } = sandbox();
  const out = run('--global', '--codex', '--hooks');
  assert.match(out.stdout, /Hooks are Claude Code only/);
  assert.ok(!fs.existsSync(path.join(home, '.claude/settings.json')));
});
