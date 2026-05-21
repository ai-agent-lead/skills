#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import readline from 'readline';

// --- ANSI Colors ---
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const GRAY = `${ESC}90m`;
const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const BLUE = `${ESC}34m`;
const MAGENTA = `${ESC}35m`;
const CYAN = `${ESC}36m`;
const WHITE = `${ESC}37m`;

const BRAND_COLOR = `${BOLD}${CYAN}`;
const SUCCESS_COLOR = `${BOLD}${GREEN}`;
const INFO_COLOR = `${CYAN}`;

// Get current filename and directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCE_SKILLS_DIR = path.resolve(__dirname, '../skills');

// --- Helper Functions ---
function printBanner() {
  console.log(`
${BRAND_COLOR}   _    ___     _     ___  ___  _  _  _____   _     ___   _    ___
  /_\\  |_ _|   /_\\   / __|| __|| \\| ||_   _| | |   | __| /_\\  |   \\
 / _ \\  | |   / _ \\ | (_ || _| | .\` |  | |   | |__ | _| / _ \\ | |) |
/_/ \\_\\|___| /_/ \\_\\ \\___||___||_|\\_|  |_|   |____||___/_/ \\_\\|___/
${RESET}
${BOLD}${WHITE}              S K I L L S   I N S T A L L E R${RESET}
${GRAY}-------------------------------------------------------------${RESET}
`);
}

function printHelp() {
  printBanner();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  npx github:ai-agent-lead/skills [options]`);
  console.log(``);
  console.log(`${BOLD}Options:${RESET}`);
  console.log(`  ${CYAN}--global, -g${RESET}       Install to global directories (e.g. ~/.claude/skills)`);
  console.log(`  ${CYAN}--local, -l${RESET}        Install to local project directories (e.g. ./.claude/skills)`);
  console.log(`  ${CYAN}--claude${RESET}            Install skills only for Claude Code`);
  console.log(`  ${CYAN}--codex${RESET}             Install skills only for Codex`);
  console.log(`  ${CYAN}--antigravity, -agy${RESET} Install skills only for Antigravity`);
  console.log(`  ${CYAN}--all${RESET}               Install skills for all supported assistants (default)`);
  console.log(`  ${CYAN}--force, -f${RESET}         Overwrite files without confirmation`);
  console.log(`  ${CYAN}--help, -h${RESET}          Show this help menu`);
  console.log(``);
  console.log(`${BOLD}Examples:${RESET}`);
  console.log(`  npx github:ai-agent-lead/skills --global`);
  console.log(`  npx github:ai-agent-lead/skills --local --claude`);
  console.log(``);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

function copyFolderSync(from, to, { force = false } = {}, stats = { copied: 0, skipped: 0 }) {
  if (!fs.existsSync(from)) return stats;
  fs.mkdirSync(to, { recursive: true });
  const elements = fs.readdirSync(from);
  for (const element of elements) {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    const stat = fs.lstatSync(fromPath);
    if (stat.isDirectory()) {
      copyFolderSync(fromPath, toPath, { force }, stats);
    } else if (stat.isFile()) {
      if (!force && fs.existsSync(toPath)) {
        stats.skipped++;
        continue;
      }
      fs.copyFileSync(fromPath, toPath);
      stats.copied++;
    }
  }
  return stats;
}

// --- Main Execution ---
async function run() {
  const args = process.argv.slice(2);
  
  const flags = {
    global: false,
    local: false,
    claude: false,
    codex: false,
    antigravity: false,
    all: false,
    force: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--global' || arg === '-g') flags.global = true;
    else if (arg === '--local' || arg === '-l') flags.local = true;
    else if (arg === '--claude') flags.claude = true;
    else if (arg === '--codex') flags.codex = true;
    else if (arg === '--antigravity' || arg === '--agy' || arg === '-agy') flags.antigravity = true;
    else if (arg === '--all') flags.all = true;
    else if (arg === '--force' || arg === '-f') flags.force = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
  }

  if (flags.help) {
    printHelp();
    return;
  }

  // Check if source skills folder exists in the package
  if (!fs.existsSync(SOURCE_SKILLS_DIR)) {
    console.error(`${RED}✗ Error: Source skills folder not found at: ${SOURCE_SKILLS_DIR}${RESET}`);
    process.exit(1);
  }

  // Interactive Mode
  if (args.length === 0 && process.stdout.isTTY) {
    printBanner();
    console.log(`${INFO_COLOR}No options provided. Running interactive setup...${RESET}\n`);
    
    console.log(`${BOLD}1. Select Scope:${RESET}`);
    console.log(`   [1] Global (Personal / User-level) - ${GRAY}Available in all projects${RESET}`);
    console.log(`   [2] Local (Project / Workspace-specific) - ${GRAY}Available in current folder${RESET}`);
    console.log(`   [3] Both Scope Options`);
    const scopeAns = await askQuestion(`${BOLD}${CYAN}? Choose scope [1-3] (Default: 1): ${RESET}`);
    
    if (scopeAns === '2') {
      flags.local = true;
    } else if (scopeAns === '3') {
      flags.global = true;
      flags.local = true;
    } else {
      flags.global = true;
    }
    console.log(``);

    console.log(`${BOLD}2. Select Targets:${RESET}`);
    console.log(`   [1] All Assistants (Claude, Codex, Antigravity)`);
    console.log(`   [2] Claude Code only`);
    console.log(`   [3] Codex only`);
    console.log(`   [4] Antigravity only`);
    const targetAns = await askQuestion(`${BOLD}${CYAN}? Choose target [1-4] (Default: 1): ${RESET}`);
    
    if (targetAns === '2') {
      flags.claude = true;
    } else if (targetAns === '3') {
      flags.codex = true;
    } else if (targetAns === '4') {
      flags.antigravity = true;
    } else {
      flags.claude = true;
      flags.codex = true;
      flags.antigravity = true;
    }
    console.log(``);
  } else {
    // If not interactive and no flags specified, apply defaults
    const hasScopeFlag = flags.global || flags.local;
    if (!hasScopeFlag) {
      flags.global = true; // Default to global
    }

    const hasAssistantFlag = flags.claude || flags.codex || flags.antigravity;
    if (!hasAssistantFlag) {
      flags.claude = true;
      flags.codex = true;
      flags.antigravity = true;
    }
  }

  // Setup Paths
  const home = os.homedir();
  const cwd = process.cwd();

  const destinations = [];

  if (flags.global) {
    if (flags.claude) {
      destinations.push({ name: 'Claude Code (Global)', path: path.join(home, '.claude', 'skills') });
    }
    if (flags.codex) {
      destinations.push({ name: 'Codex (Global)', path: path.join(home, '.codex', 'skills') });
    }
    if (flags.antigravity) {
      destinations.push({ name: 'Antigravity (Global)', path: path.join(home, '.gemini', 'antigravity', 'skills') });
      destinations.push({ name: 'Antigravity CLI (Global)', path: path.join(home, '.gemini', 'antigravity-cli', 'skills') });
      destinations.push({ name: 'Antigravity Config (Global)', path: path.join(home, '.gemini', 'config', 'skills') });
    }
  }

  if (flags.local) {
    if (flags.claude) {
      destinations.push({ name: 'Claude Code (Local)', path: path.join(cwd, '.claude', 'skills') });
    }
    if (flags.codex) {
      destinations.push({ name: 'Codex (Local)', path: path.join(cwd, '.codex', 'skills') });
    }
    if (flags.antigravity) {
      destinations.push({ name: 'Antigravity Agents (Local)', path: path.join(cwd, '.agents', 'skills') });
      destinations.push({ name: 'Antigravity Agent (Local)', path: path.join(cwd, '.agent', 'skills') });
      destinations.push({ name: 'Antigravity CLI (Local)', path: path.join(cwd, '.antigravitycli', 'skills') });
    }
  }

  if (destinations.length === 0) {
    console.log(`${YELLOW}⚠ No destinations matching current selection.${RESET}`);
    return;
  }

  if (args.length !== 0 || !process.stdout.isTTY) {
    printBanner();
  }

  console.log(`${BOLD}Starting installation to destinations...${RESET}`);
  console.log(`${GRAY}---------------------------------------------${RESET}`);

  let successCount = 0;
  for (const dest of destinations) {
    console.log(`${INFO_COLOR}➜ Installing to ${BOLD}${dest.name}${RESET}${GRAY}...${RESET}`);
    try {
      // Resolve absolute paths nicely for output display
      const displayPath = dest.path.replace(home, '~');
      console.log(`  ${GRAY}Path: ${displayPath}${RESET}`);
      
      // Perform directory copy
      const result = copyFolderSync(SOURCE_SKILLS_DIR, dest.path, { force: flags.force });

      const summary = result.skipped > 0
        ? ` (${result.copied} copied, ${result.skipped} skipped — use --force to overwrite)`
        : ` (${result.copied} files)`;
      console.log(`  ${SUCCESS_COLOR}✔ Successfully installed to ${dest.name}!${RESET}${GRAY}${summary}${RESET}`);
      successCount++;
    } catch (err) {
      console.error(`  ${RED}✗ Failed to install to ${dest.name}: ${err.message}${RESET}`);
    }
    console.log(``);
  }

  console.log(`${GRAY}---------------------------------------------${RESET}`);
  if (successCount === destinations.length) {
    console.log(`${SUCCESS_COLOR}🎉 Installation complete! All (${successCount}/${destinations.length}) targets successfully updated.${RESET}`);
  } else if (successCount > 0) {
    console.log(`${YELLOW}⚠ Installation completed with warnings. Installed ${successCount} of ${destinations.length} targets.${RESET}`);
  } else {
    console.error(`${RED}✗ Installation failed. No targets were updated.${RESET}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(`${RED}✗ Unexpected Error: ${err.message}${RESET}`);
  process.exit(1);
});
