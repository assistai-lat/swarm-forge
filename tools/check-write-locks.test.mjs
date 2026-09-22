// Tests del verificador de Write-Locks con worktrees fuera del clon, como los crea herdr (SF-6).
// Sin dependencias: node --test (desde la raíz del repo).
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CHECK = resolve(dirname(fileURLToPath(import.meta.url)), "check-write-locks.mjs");
const tmp = mkdtempSync(join(tmpdir(), "sf-locks-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

function git(cwd, ...args) {
  const run = spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-C", cwd, ...args], { encoding: "utf8" });
  assert.equal(run.status, 0, `git ${args.join(" ")}: ${run.stderr}`);
}

function write(path, content = "x\n") {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function check(...args) {
  const run = spawnSync(process.execPath, [CHECK, "--topology", join(root, "topology.json"), ...args], { cwd: root, encoding: "utf8" });
  return { status: run.status, out: run.stdout + run.stderr };
}

// Polyrepo: la raíz no es un repo git; "web" sí, con rama develop. El worker tiene su rama
// swarm/worker_web en un worktree que vive fuera de la raíz, como ~/.herdr/worktrees/.
let root, worktree, n = 0;
beforeEach(() => {
  root = join(tmp, `case${++n}`, "kasah");
  worktree = join(tmp, `case${n}`, "herdr-worktrees", "web-swarm-worker_web");
  write(join(root, "web", "src", "app.ts"));
  write(join(root, "web", "README.md"));
  git(join(root, "web"), "init", "-q", "-b", "develop");
  git(join(root, "web"), "add", ".");
  git(join(root, "web"), "commit", "-q", "-m", "init");
  git(join(root, "web"), "worktree", "add", "-q", "-b", "swarm/worker_web", worktree, "develop");
  write(join(root, "topology.json"), JSON.stringify({
    name: "t",
    surfaces: { web: { repo: "web", paths: ["web/src/**"], baseBranch: "develop", workerRole: "worker_web" } },
  }));
});

test("un archivo sin commitear fuera de frontera en el worktree hace fallar --role (antes: falso verde)", () => {
  write(join(worktree, "fuera-de-lugar.txt"));
  const { status, out } = check("--role", "worker_web");
  assert.equal(status, 1, out);
  assert.match(out, /web\/fuera-de-lugar\.txt/);
});

test("un archivo commiteado en la rama del worker fuera de frontera hace fallar --role", () => {
  write(join(worktree, "README.md"), "cambiado\n");
  git(worktree, "commit", "-q", "-am", "toca README");
  const { status, out } = check("--role", "worker_web");
  assert.equal(status, 1, out);
  assert.match(out, /web\/README\.md/);
});

test("cambios dentro de la frontera pasan", () => {
  write(join(worktree, "src", "nuevo.ts"));
  write(join(worktree, "src", "app.ts"), "cambiado\n");
  git(worktree, "commit", "-q", "-am", "dentro");
  const { status, out } = check("--role", "worker_web");
  assert.equal(status, 0, out);
  assert.match(out, /2 archivo\(s\)/);
});

test("el modo reporte revisa la rama de cada agente contra su baseBranch", () => {
  write(join(worktree, "fuera-de-lugar.txt"));
  const { status, out } = check();
  assert.equal(status, 1, out);
  assert.match(out, /worker_web escribió fuera de su Write-Lock \(rama swarm\/worker_web desde develop/);
});

test("sin rama de agente, revisa el clon como siempre", () => {
  git(join(root, "web"), "worktree", "remove", "--force", worktree);
  git(join(root, "web"), "branch", "-q", "-D", "swarm/worker_web");
  write(join(root, "web", "fuera.txt"));
  const { status, out } = check("--role", "worker_web");
  assert.equal(status, 1, out);
  assert.match(out, /web\/fuera\.txt/);
});
