---
name: swarm-forge
description: Universal Multi-Agent Engineering Engine for Antigravity (AGY). Implements the 5-phase adversarial lifecycle with Sentinel, Gate M0, Write-Locks, Challengers, and Victory Auditor across polyglot topologies.
---

# Swarm-Forge Engine for Antigravity (AGY)

When this skill is activated (via `@swarm-forge`, `/swarm`, or when tackling a multi-repo / complex feature request), you must follow the Swarm-Forge Protocol.

## Activation Workflow

1. **Phase 0 (360° Survey):**
   - Read the local `topology.json` (or `AGENTS.md`) in the workspace root to identify the active execution surfaces.
   - Run `TOPOLOGY_DRIFT` detection: check for newly added directories, framework files, or microservices.
   - Spawn up to 3 parallel exploration subagents using `invoke_subagent` with `model: "flash_lite"`:
     - Explorer Backend (DB, routes, models)
     - Explorer Frontend (UI, stores, components)
     - Explorer Contracts (DTOs, deep links, WebSocket events)
   - Synthesize findings into `ANALYSIS_REPORT.md` and `PROJECT.md`.

2. **Phase 1 (Mandatory Human Gate M0):**
   - Stop execution and present the analysis report to the human user using `ask_question` or clear visible markdown.
   - **Do NOT proceed to modify any project files without explicit approval.**

3. **Phase 2 (Parallel Implementation with Write-Locks):**
   - For each impacted surface, spawn a dedicated worker with `model: "flash"` and medium thinking.
   - Provide an explicit, disjoint list of writable files in their prompt (`DISPATCH.md`).
   - Require that each worker run their surface's `verifyCommand` (e.g. `npx tsc --noEmit`) before completing.

4. **Phase 3 (Adversarial Verification Ring):**
   - Spawn a Code/Contract Reviewer (`model: "pro"`, high thinking).
   - Spawn Challengers (`model: "flash"`) to execute adversarial tests (fuzzing routing, WebSocket concurrency, mobile backward-compatibility).
   - Spawn a Forensic Auditor (`model: "pro"`) to inspect the complete `git diff` ensuring zero fake/mocked code.

5. **Phase 4 (Victory Audit):**
   - Spawn a `victory-auditor` (`model: "pro"`) in a fresh subagent context with clean memory.
   - The Victory Auditor verifies all acceptance criteria and returns either `VICTORY CONFIRMED` or `VICTORY REJECTED`.
   - Upon confirmation, report delivery to the user.
