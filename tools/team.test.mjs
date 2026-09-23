import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  inferEffort,
  normalizePresetName,
  applyGoldenPreset,
  applyEmergencyTo,
  restoreBackup,
  GOLDEN_PRESETS
} from './team.mjs';

function createSampleRoster() {
  return {
    $schema: 'https://swarm-forge.org/schemas/roster.v1.json',
    topology: 'test-topology',
    profile: 'balanced',
    harnesses: ['claude', 'opencode'],
    agents: [
      {
        role: 'sentinel',
        phase: 'all',
        harness: 'claude',
        model: 'opus',
        family: 'anthropic',
        kind: 'judge',
        autoApproveArgs: ['--permission-mode', 'auto']
      },
      {
        role: 'orchestrator',
        phase: 'all',
        harness: 'opencode',
        model: 'opencode-go/glm-5.3',
        family: 'zhipu',
        kind: 'coord',
        autoApproveArgs: ['--auto']
      },
      {
        role: 'explorer',
        phase: 0,
        harness: 'opencode',
        model: 'opencode/nemotron-3-ultra-free',
        family: 'nvidia',
        kind: 'utility',
        autoApproveArgs: ['--auto']
      },
      {
        role: 'worker_backend',
        phase: 2,
        harness: 'opencode',
        model: 'opencode-go/kimi-k2.7-code',
        family: 'moonshot',
        kind: 'writer',
        writeLock: ['src/api/**'],
        autoApproveArgs: ['--auto']
      },
      {
        role: 'worker_frontend',
        phase: 2,
        harness: 'claude',
        model: 'opus',
        family: 'anthropic',
        kind: 'writer',
        writeLock: ['src/web/**'],
        autoApproveArgs: ['--permission-mode', 'auto']
      },
      {
        role: 'code-reviewer',
        phase: 3,
        harness: 'opencode',
        model: 'opencode-go/deepseek-v4-pro',
        family: 'deepseek',
        kind: 'judge',
        autoApproveArgs: ['--auto']
      },
      {
        role: 'victory-auditor',
        phase: 4,
        harness: 'opencode',
        model: 'opencode-go/glm-5.3',
        family: 'zhipu',
        kind: 'judge',
        autoApproveArgs: ['--auto']
      }
    ]
  };
}

test('inferEffort: clasifica adecuadamente los modelos por nivel de esfuerzo', () => {
  assert.equal(inferEffort({ model: 'opus' }), 'High');
  assert.equal(inferEffort({ model: 'gemini-3.1-pro-high' }), 'High');
  assert.equal(inferEffort({ model: 'opencode-go/deepseek-v4-pro' }), 'High');

  assert.equal(inferEffort({ model: 'sonnet' }), 'Medium');
  assert.equal(inferEffort({ model: 'opencode-go/kimi-k2.7-code' }), 'Medium');
  assert.equal(inferEffort({ model: 'opencode-go/glm-5.3' }), 'Medium');
  assert.equal(inferEffort({ model: 'gemini-3.8-flash-medium' }), 'Medium');

  assert.equal(inferEffort({ model: 'gemini-3.8-flash-low' }), 'Low');
  assert.equal(inferEffort({ model: 'opencode-go/deepseek-v4.1-flash' }), 'Low');
  assert.equal(inferEffort({ model: 'opencode/nemotron-3-ultra-free' }), 'Low');
  assert.equal(inferEffort({ model: 'haiku' }), 'Low');

  assert.equal(inferEffort({ model: 'custom-model' }), 'Standard');
});

test('normalizePresetName: normaliza nombres de presets y alias', () => {
  assert.equal(normalizePresetName('duo'), 'claude,agy');
  assert.equal(normalizePresetName('claude,agy'), 'claude,agy');
  assert.equal(normalizePresetName('solo-claude'), 'claude');
  assert.equal(normalizePresetName('solo-agy'), 'agy');
  assert.equal(normalizePresetName('gemini'), 'agy');
  assert.equal(normalizePresetName('solo-opencode'), 'opencode');
  assert.equal(normalizePresetName('open-weights'), 'opencode');
  assert.equal(normalizePresetName('mixed'), 'agy,opencode');
  assert.equal(normalizePresetName('trio'), 'claude,agy,opencode');
});

test('applyGoldenPreset: aplica configuración predefinida y preserva writeLock', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sf-team-preset-'));
  try {
    const rosterFile = join(dir, 'roster.json');
    const roster = createSampleRoster();
    writeFileSync(rosterFile, JSON.stringify(roster, null, 2), 'utf8');

    const result = applyGoldenPreset('solo-agy', rosterFile, roster);
    assert.ok(result);
    assert.match(result.title, /Solo AGY/);

    const updated = JSON.parse(readFileSync(rosterFile, 'utf8'));
    assert.deepEqual(updated.harnesses, ['agy']);

    const wb = updated.agents.find(a => a.role === 'worker_backend');
    assert.equal(wb.harness, 'agy');
    assert.equal(wb.family, 'google');
    assert.equal(wb.model, 'gemini-3.8-flash-high');
    assert.deepEqual(wb.writeLock, ['src/api/**']); // writeLock preservado intacto

    const sentinel = updated.agents.find(a => a.role === 'sentinel');
    assert.equal(sentinel.harness, 'agy');
    assert.equal(sentinel.model, 'gemini-3.8-flash-high');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('applyEmergencyTo y restoreBackup: migra agentes de emergencia y restaura backup', () => {
  const dir = mkdtempSync(join(tmpdir(), 'sf-team-emergency-'));
  try {
    const rosterFile = join(dir, 'roster.json');
    const backupFile = join(dir, 'roster.last-mixed.json');
    const originalRoster = createSampleRoster();
    writeFileSync(rosterFile, JSON.stringify(originalRoster, null, 2), 'utf8');

    // Hot-swap de emergencia a AGY
    const changed = applyEmergencyTo(originalRoster, rosterFile, 'agy');
    assert.ok(changed > 0);
    assert.ok(existsSync(backupFile), 'El archivo de backup debe existir');

    const emergencyRoster = JSON.parse(readFileSync(rosterFile, 'utf8'));
    assert.ok(emergencyRoster.agents.every(a => a.harness === 'agy'));
    assert.deepEqual(emergencyRoster.harnesses, ['agy']);

    // Verificar preservación de frontera y tipo
    const backendWorker = emergencyRoster.agents.find(a => a.role === 'worker_backend');
    assert.deepEqual(backendWorker.writeLock, ['src/api/**']);
    assert.equal(backendWorker.kind, 'writer');

    // Restaurar desde backup
    const restored = restoreBackup(rosterFile);
    assert.ok(restored);
    const restoredFromFile = JSON.parse(readFileSync(rosterFile, 'utf8'));
    assert.deepEqual(restoredFromFile.harnesses, ['claude', 'opencode']);
    assert.equal(restoredFromFile.agents.find(a => a.role === 'worker_backend').harness, 'opencode');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
