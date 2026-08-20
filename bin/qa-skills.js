#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const DEFAULT_REPO =
  process.env.QA_SKILLS_REPO_URL ||
  "https://github.com/qacoto/qa-agent-skills.git";

const VERSION = require("../package.json").version;

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function git(args, cwd = process.cwd()) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : "";
    fail(stderr || `Git command failed: git ${args.join(" ")}`);
  }
}

function repoFromArgs(args) {
  const index = args.indexOf("--repo");
  return index >= 0 && args[index + 1] ? args[index + 1] : DEFAULT_REPO;
}

function positionalArgs(args) {
  const result = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--repo") {
      i++;
      continue;
    }

    if (arg.startsWith("--")) {
      continue;
    }

    result.push(arg);
  }

  return result;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function cloneRepository(repo) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "qa-agent-skills-"));
  try {
    git(["clone", "--depth", "1", repo, temp]);
    return temp;
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
}

function getSkills(repoRoot) {
  const skillsRoot = path.join(repoRoot, ".agents", "skills");

  if (!fs.existsSync(skillsRoot)) {
    fail("The repository does not contain .agents/skills.");
  }

  const skills = [];

  for (const category of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;

    const categoryPath = path.join(skillsRoot, category.name);

    for (const skill of fs.readdirSync(categoryPath, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue;

      const skillPath = path.join(categoryPath, skill.name);
      const skillFile = path.join(skillPath, "SKILL.md");

      if (fs.existsSync(skillFile)) {
        skills.push({
          id: skill.name,
          category: category.name,
          relativePath: path.join(category.name, skill.name)
        });
      }
    }
  }

  return skills.sort((a, b) =>
    `${a.category}/${a.id}`.localeCompare(`${b.category}/${b.id}`)
  );
}

function copySkill(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

function installSkill(repoRoot, skill, projectRoot) {
  const source = path.join(
    repoRoot,
    ".agents",
    "skills",
    skill.relativePath
  );

  const destination = path.join(
    projectRoot,
    ".agents",
    "skills",
    skill.relativePath
  );

  copySkill(source, destination);
}

const BASE_DIRS = ["agents", "instructions"];

function installBase(repoRoot, projectRoot) {
  for (const dir of BASE_DIRS) {
    const source = path.join(repoRoot, ".agents", dir);
    const destination = path.join(projectRoot, ".agents", dir);

    if (!fs.existsSync(source)) continue;

    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
    console.log(`Installed: ${dir}/`);
  }
}

function list(args) {
  const repo = repoFromArgs(args);
  const repoRoot = cloneRepository(repo);

  try {
    const skills = getSkills(repoRoot);

    console.log("\nAvailable skills:\n");

    let category = null;

    for (const skill of skills) {
      if (skill.category !== category) {
        category = skill.category;
        console.log(`\n${category}`);
      }

      console.log(`  ${skill.id}`);
    }

    console.log("");
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function install(args) {
  const repo = repoFromArgs(args);
  const skillNames = positionalArgs(args);

  if (!skillNames.length) {
    fail("Usage: qa-skills install <skill> [skill...]");
  }

  const projectRoot = process.cwd();
  const repoRoot = cloneRepository(repo);

  try {
    const available = getSkills(repoRoot);

    if (!hasFlag(args, "--no-base")) {
      installBase(repoRoot, projectRoot);
    }

    for (const name of skillNames) {
      const skill = available.find((item) => item.id === name);

      if (!skill) {
        console.error(`Skill not found: ${name}`);
        continue;
      }

      installSkill(repoRoot, skill, projectRoot);
      console.log(`Installed: ${skill.category}/${skill.id}`);
    }
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function update(args) {
  const repo = repoFromArgs(args);
  const projectRoot = process.cwd();
  const installedRoot = path.join(projectRoot, ".agents", "skills");

  if (!fs.existsSync(installedRoot)) {
    console.log("No skills installed.");
    return;
  }

  const repoRoot = cloneRepository(repo);

  try {
    const available = getSkills(repoRoot);
    const availableByPath = new Map(
      available.map((skill) => [skill.relativePath, skill])
    );

    if (!hasFlag(args, "--no-base")) {
      installBase(repoRoot, projectRoot);
    }

    const installed = [];

    for (const category of fs.readdirSync(installedRoot, {
      withFileTypes: true
    })) {
      if (!category.isDirectory()) continue;

      const categoryPath = path.join(installedRoot, category.name);

      for (const skill of fs.readdirSync(categoryPath, {
        withFileTypes: true
      })) {
        if (!skill.isDirectory()) continue;

        const relativePath = path.join(category.name, skill.name);

        installed.push({
          id: skill.name,
          category: category.name,
          relativePath
        });
      }
    }

    if (!installed.length) {
      console.log("No skills installed.");
      return;
    }

    for (const skill of installed) {
      const sourceSkill = availableByPath.get(skill.relativePath);

      if (!sourceSkill) {
        console.warn(
          `Skipped: ${skill.category}/${skill.id} (not found in repository)`
        );
        continue;
      }

      installSkill(repoRoot, sourceSkill, projectRoot);
      console.log(`Updated: ${skill.category}/${skill.id}`);
    }
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function version() {
  console.log(VERSION);
}

function help() {
  console.log(`
QA Agent Skills CLI

Commands:

  qa-skills list
      List available skills.

  qa-skills install <skill> [skill...]
      Install one or more skills. The base folders (.agents/agents and
      .agents/instructions) are copied automatically by default. Use
      --no-base to skip them.

  qa-skills update
      Update only the skills already installed in .agents/skills, and the
      base folders. Use --no-base to skip the base folders.

  qa-skills --version
      Print the CLI version.

Examples:

  qa-skills list

  qa-skills install cypress

  qa-skills install cypress frontend gitflow

  qa-skills update

For local testing:

  qa-skills list --repo file:///absolute/path/to/qa-agent-skills
`);
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list":
    list(args);
    break;

  case "install":
    install(args);
    break;

  case "update":
    update(args);
    break;

  case "help":
  case "--help":
  case "-h":
  case undefined:
    help();
    break;

  case "version":
  case "--version":
  case "-v":
    version();
    break;

  default:
    fail(`Unknown command: ${command}`);
}
