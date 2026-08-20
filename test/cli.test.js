const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const CLI = path.join(__dirname, "..", "bin", "qa-skills.js");

function runCli(args, cwd) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `CLI failed: ${result.stderr || result.stdout}`);

  return { stdout: result.stdout, stderr: result.stderr };
}

function runGit(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
}

function writeSkill(repoRoot, category, name, content) {
  const skillDir = path.join(repoRoot, ".agents", "skills", category, name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${name}\ncategory: ${category}\n---\n\n${content}\n`
  );
}

function commitAll(repoRoot, message) {
  runGit(["add", "-A"], repoRoot);
  runGit(
    ["-c", "user.name=test", "-c", "user.email=test@test", "commit", "-m", message],
    repoRoot
  );
}

function writeBase(repoRoot) {
  const agentFile = path.join(repoRoot, ".agents", "agents", "qa-engineer", "AGENT.md");
  fs.mkdirSync(path.dirname(agentFile), { recursive: true });
  fs.writeFileSync(agentFile, "# QA Engineer\n\nAgente base.");

  const instructionsDir = path.join(repoRoot, ".agents", "instructions");
  fs.mkdirSync(instructionsDir, { recursive: true });
  fs.writeFileSync(
    path.join(instructionsDir, "general.md"),
    "# General\n\n- Regla base."
  );
}

function makeSkillRepo(t) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "qa-skills-fixture-"));
  fs.mkdirSync(path.join(repoRoot, ".agents"), { recursive: true });

  runGit(["init", "-q"], repoRoot);

  writeBase(repoRoot);

  writeSkill(
    repoRoot,
    "automation",
    "cypress",
    "# Cypress\n\n- Usar selectores estables."
  );
  writeSkill(
    repoRoot,
    "testing",
    "frontend",
    "# Frontend Testing\n\n- Cubrir happy paths."
  );
  writeSkill(
    repoRoot,
    "general",
    "gitflow",
    "# GitFlow\n\n- Usar feature branches."
  );
  commitAll(repoRoot, "initial skills");

  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  return { repoRoot, repoUrl: pathToFileURL(repoRoot).href };
}

function makeConsumerProject(t) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "qa-skills-consumer-"));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  return projectRoot;
}

test("version prints package version", () => {
  const pkg = require("../package.json");
  const { stdout } = runCli(["--version"], os.tmpdir());
  assert.equal(stdout.trim(), pkg.version);
});

test("list shows skills grouped by category", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const { stdout } = runCli(["list", "--repo", repoUrl], os.tmpdir());

  assert.match(stdout, /automation/);
  assert.match(stdout, /\s+cypress/);
  assert.match(stdout, /testing/);
  assert.match(stdout, /\s+frontend/);
  assert.match(stdout, /general/);
  assert.match(stdout, /\s+gitflow/);
});

test("install copies the skill into a non-node project (e.g. Java)", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  runCli(["install", "cypress", "--repo", repoUrl], projectRoot);

  const installed = path.join(projectRoot, ".agents", "skills", "automation", "cypress", "SKILL.md");
  assert.ok(fs.existsSync(installed));
  assert.match(fs.readFileSync(installed, "utf8"), /Usar selectores estables/);
  assert.ok(!fs.existsSync(path.join(projectRoot, ".agents", "skills", "testing")));
});

test("install copies several skills into a node project (e.g. Cypress)", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);
  fs.writeFileSync(path.join(projectRoot, "package.json"), "{}");

  runCli(["install", "cypress", "frontend", "--repo", repoUrl], projectRoot);

  for (const rel of ["automation/cypress", "testing/frontend"]) {
    assert.ok(
      fs.existsSync(path.join(projectRoot, ".agents", "skills", rel, "SKILL.md")),
      `${rel} should be installed`
    );
  }

  assert.ok(
    !fs.existsSync(path.join(projectRoot, ".agents", "skills", "general", "gitflow")),
    "unrequested skill should not be installed"
  );

  const { stdout } = runCli(["install", "cypress", "frontend", "--repo", repoUrl], projectRoot);
  assert.match(stdout, /Installed: automation\/cypress/);
});

test("install of an unknown skill reports it without failing", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  const { stderr } = runCli(["install", "does-not-exist", "--repo", repoUrl], projectRoot);

  assert.match(stderr, /Skill not found: does-not-exist/);
  assert.equal(
    fs.existsSync(path.join(projectRoot, ".agents", "skills")),
    false
  );
});

test("install is idempotent", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  runCli(["install", "cypress", "--repo", repoUrl], projectRoot);
  runCli(["install", "cypress", "--repo", repoUrl], projectRoot);

  const installed = path.join(projectRoot, ".agents", "skills", "automation", "cypress");
  assert.ok(fs.existsSync(installed));
  assert.equal(fs.readdirSync(installed).length, 1);
});

test("install imports agents and instructions by default", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  const { stdout } = runCli(["install", "cypress", "--repo", repoUrl], projectRoot);

  assert.match(stdout, /Installed: agents\//);
  assert.match(stdout, /Installed: instructions\//);

  assert.ok(
    fs.existsSync(path.join(projectRoot, ".agents", "agents", "qa-engineer", "AGENT.md"))
  );
  assert.match(
    fs.readFileSync(path.join(projectRoot, ".agents", "instructions", "general.md"), "utf8"),
    /Regla base/
  );
});

test("install with --no-base skips agents and instructions", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  const { stdout } = runCli(
    ["install", "cypress", "--no-base", "--repo", repoUrl],
    projectRoot
  );

  assert.doesNotMatch(stdout, /Installed: agents\//);
  assert.ok(
    !fs.existsSync(path.join(projectRoot, ".agents", "agents")),
    "agents should not be installed with --no-base"
  );
  assert.ok(
    !fs.existsSync(path.join(projectRoot, ".agents", "instructions")),
    "instructions should not be installed with --no-base"
  );
  assert.ok(
    fs.existsSync(path.join(projectRoot, ".agents", "skills", "automation", "cypress", "SKILL.md"))
  );
});

test("update refreshes base folders", (t) => {
  const { repoRoot, repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  runCli(["install", "cypress", "--repo", repoUrl], projectRoot);

  fs.writeFileSync(
    path.join(repoRoot, ".agents", "instructions", "general.md"),
    "# General\n\n- Nueva regla base."
  );
  commitAll(repoRoot, "update base");

  runCli(["update", "--repo", repoUrl], projectRoot);

  assert.match(
    fs.readFileSync(path.join(projectRoot, ".agents", "instructions", "general.md"), "utf8"),
    /Nueva regla base/
  );
});

test("update refreshes installed skills but does not install new ones", (t) => {
  const { repoRoot, repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  runCli(["install", "cypress", "frontend", "--repo", repoUrl], projectRoot);

  writeSkill(
    repoRoot,
    "automation",
    "cypress",
    "# Cypress v2\n\n- Evitar cy.wait() fijo."
  );
  writeSkill(
    repoRoot,
    "testing",
    "backend",
    "# Backend Testing\n\n- Validar status codes."
  );
  commitAll(repoRoot, "update skills");

  const { stdout } = runCli(["update", "--repo", repoUrl], projectRoot);
  assert.match(stdout, /Updated: automation\/cypress/);
  assert.match(stdout, /Updated: testing\/frontend/);

  const cypressFile = path.join(projectRoot, ".agents", "skills", "automation", "cypress", "SKILL.md");
  assert.match(fs.readFileSync(cypressFile, "utf8"), /Cypress v2/);

  assert.ok(
    !fs.existsSync(path.join(projectRoot, ".agents", "skills", "testing", "backend")),
    "new skill should not be installed by update"
  );
});

test("update with no installed skills is a no-op", (t) => {
  const { repoUrl } = makeSkillRepo(t);
  const projectRoot = makeConsumerProject(t);

  const { stdout } = runCli(["update", "--repo", repoUrl], projectRoot);
  assert.match(stdout, /No skills installed/);
});