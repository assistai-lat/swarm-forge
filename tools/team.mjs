#!/usr/bin/env node
/**
 * Swarm-Forge Team Manager (team.mjs)
 * Visualizador interactivo y controlador de esfuerzo / proveedor de agentes.
 * Cockpit de gestión de equipo, catálogo de Golden Presets y Hot-Swap de emergencia.
 *
 * Uso:
 *   node tools/team.mjs                      # Modo interactivo (menú con números)
 *   node tools/team.mjs --list               # Solo listar la tabla y salir
 *   node tools/team.mjs --emergency-to agy   # Hot-swap de emergencia: pasa agentes externos a AGY
 *   node tools/team.mjs --emergency-to claude# Hot-swap de emergencia: pasa agentes externos a Claude
 *   node tools/team.mjs --restore            # Restaura el roster previo a la emergencia
 *   node tools/team.mjs --preset <nombre>    # Aplica Golden Preset (duo, solo-claude, solo-agy, solo-opencode, etc.)
 *   node tools/team.mjs --roster <path>      # Ruta específica al archivo roster.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Colores ANSI
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

const BACKUP_FILE = 'roster.last-mixed.json';
const SWARM_FORGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * CATÁLOGO DE GOLDEN PRESETS
 */
export const GOLDEN_PRESETS = {
  'claude,agy': {
    name: 'claude,agy',
    title: 'Dúo Elite: Claude Opus (Workers/Sentinel) + Sonnet (Fase 3) + AGY Gemini Pro',
    description: 'Opus en desarrollo, Sonnet en revisión Fase 3, Gemini 3.1 Pro en auditoría. Sin Haiku. Cero OpenCode.',
    roles: {
      sentinel: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      orchestrator: { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      worker_backend: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      worker_frontend: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'code-reviewer': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'security-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'contract-integrator': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      challenger_routing: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      challenger_realtime: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'forensic-auditor': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'victory-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] }
    }
  },
  'claude': {
    name: 'claude',
    title: 'Solo Claude: Opus en Sentinel & Workers, Sonnet en Fase 3 y Exploración',
    description: 'Sin Haiku. Máxima potencia con Opus en código y Sonnet en revisión.',
    roles: {
      sentinel: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      orchestrator: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      explorer: { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      worker_backend: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      worker_frontend: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'code-reviewer': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'security-auditor': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'contract-integrator': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      challenger_routing: { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      challenger_realtime: { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'forensic-auditor': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'victory-auditor': { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] }
    }
  },
  'agy': {
    name: 'agy',
    title: 'Solo AGY: 100% Google Gemini (Flash High & Pro High)',
    description: 'Visión nativa, contexto de 1M, cero gasto de APIs externas.',
    roles: {
      sentinel: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      orchestrator: { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer: { harness: 'agy', model: 'gemini-3.8-flash-low', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      worker_backend: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      worker_frontend: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'code-reviewer': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'security-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'contract-integrator': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      challenger_routing: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      challenger_realtime: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'forensic-auditor': { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'victory-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] }
    }
  },
  'agy,opencode': {
    name: 'agy,opencode',
    title: 'Mixto Optimizado: Gemini + Kimi 2.7, Qwen 3.6, GLM 5.3, DeepSeek Pro',
    description: 'Modelos abiertos de primer nivel con AGY. Cero Grok para proteger tu saldo.',
    roles: {
      sentinel: { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      orchestrator: { harness: 'opencode', model: 'opencode-go/glm-5.3', family: 'zhipu', autoApproveArgs: ['--auto'] },
      explorer: { harness: 'agy', model: 'gemini-3.8-flash-low', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer_1: { harness: 'agy', model: 'gemini-3.8-flash-low', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer_2: { harness: 'agy', model: 'gemini-3.8-flash-low', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer_3: { harness: 'opencode', model: 'opencode/nemotron-3-ultra-free', family: 'nvidia', autoApproveArgs: ['--auto'] },
      worker_backend: { harness: 'opencode', model: 'opencode-go/kimi-k2.7-code', family: 'moonshot', autoApproveArgs: ['--auto'] },
      worker_frontend: { harness: 'opencode', model: 'opencode-go/qwen3.6-plus', family: 'qwen', autoApproveArgs: ['--auto'] },
      'code-reviewer': { harness: 'opencode', model: 'opencode-go/deepseek-v4-pro', family: 'deepseek', autoApproveArgs: ['--auto'] },
      'security-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'contract-integrator': { harness: 'opencode', model: 'opencode-go/deepseek-v4-pro', family: 'deepseek', autoApproveArgs: ['--auto'] },
      challenger_routing: { harness: 'opencode', model: 'opencode-go/deepseek-v4.1-flash', family: 'deepseek', autoApproveArgs: ['--auto'] },
      challenger_realtime: { harness: 'opencode', model: 'opencode-go/glm-5.3-flash', family: 'zhipu', autoApproveArgs: ['--auto'] },
      'forensic-auditor': { harness: 'agy', model: 'gemini-3.8-flash-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      'victory-auditor': { harness: 'opencode', model: 'opencode-go/glm-5.3', family: 'zhipu', autoApproveArgs: ['--auto'] }
    }
  },
  'claude,agy,opencode': {
    name: 'claude,agy,opencode',
    title: 'Trío Soberano: Claude Opus en Backend + Qwen 3.6 Frontend + Sonnet Fase 3 + Gemini Pro',
    description: 'La máxima combinación: Opus en backend, Qwen/Kimi en OpenCode, Sonnet en revisión, Gemini en auditoría.',
    roles: {
      sentinel: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      orchestrator: { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      explorer: { harness: 'opencode', model: 'opencode/mimo-v2.6-flash-free', family: 'xiaomi', autoApproveArgs: ['--auto'] },
      worker_backend: { harness: 'claude', model: 'opus', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      worker_frontend: { harness: 'opencode', model: 'opencode-go/qwen3.6-plus', family: 'qwen', autoApproveArgs: ['--auto'] },
      'code-reviewer': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'security-auditor': { harness: 'opencode', model: 'opencode-go/deepseek-v4-pro', family: 'deepseek', autoApproveArgs: ['--auto'] },
      'contract-integrator': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] },
      challenger_routing: { harness: 'opencode', model: 'opencode-go/kimi-k2.7-code', family: 'moonshot', autoApproveArgs: ['--auto'] },
      challenger_realtime: { harness: 'opencode', model: 'opencode-go/glm-5.3-flash', family: 'zhipu', autoApproveArgs: ['--auto'] },
      'forensic-auditor': { harness: 'claude', model: 'sonnet', family: 'anthropic', autoApproveArgs: ['--permission-mode', 'auto'] },
      'victory-auditor': { harness: 'agy', model: 'gemini-3.1-pro-high', family: 'google', autoApproveArgs: ['--dangerously-skip-permissions'] }
    }
  },
  'opencode': {
    name: 'opencode',
    title: 'Solo OpenCode: Kimi 2.7 (Backend) + Qwen 3.6 (Frontend) + GLM 5.3 + DeepSeek Pro',
    description: '100% modelos abiertos de vanguardia. Exploradores gratuitos (nemotron/mimo). Cero Grok.',
    roles: {
      sentinel: { harness: 'opencode', model: 'opencode-go/deepseek-v4-flash-vision-exp', family: 'deepseek', autoApproveArgs: ['--auto'] },
      orchestrator: { harness: 'opencode', model: 'opencode-go/glm-5.3', family: 'zhipu', autoApproveArgs: ['--auto'] },
      explorer: { harness: 'opencode', model: 'opencode/nemotron-3-ultra-free', family: 'nvidia', autoApproveArgs: ['--auto'] },
      explorer_1: { harness: 'opencode', model: 'opencode/nemotron-3-ultra-free', family: 'nvidia', autoApproveArgs: ['--auto'] },
      explorer_2: { harness: 'opencode', model: 'opencode/mimo-v2.6-flash-free', family: 'xiaomi', autoApproveArgs: ['--auto'] },
      explorer_3: { harness: 'opencode', model: 'opencode-go/deepseek-v4.1-flash', family: 'deepseek', autoApproveArgs: ['--auto'] },
      worker_backend: { harness: 'opencode', model: 'opencode-go/kimi-k2.7-code', family: 'moonshot', autoApproveArgs: ['--auto'] },
      worker_frontend: { harness: 'opencode', model: 'opencode-go/qwen3.6-plus', family: 'qwen', autoApproveArgs: ['--auto'] },
      'code-reviewer': { harness: 'opencode', model: 'opencode-go/deepseek-v4-pro', family: 'deepseek', autoApproveArgs: ['--auto'] },
      'security-auditor': { harness: 'opencode', model: 'opencode-go/deepseek-v4-pro', family: 'deepseek', autoApproveArgs: ['--auto'] },
      'contract-integrator': { harness: 'opencode', model: 'opencode-go/glm-5.3', family: 'zhipu', autoApproveArgs: ['--auto'] },
      challenger_routing: { harness: 'opencode', model: 'opencode-go/deepseek-v4.1-flash', family: 'deepseek', autoApproveArgs: ['--auto'] },
      challenger_realtime: { harness: 'opencode', model: 'opencode-go/glm-5.3-flash', family: 'zhipu', autoApproveArgs: ['--auto'] },
      'forensic-auditor': { harness: 'opencode', model: 'opencode-go/kimi-k2.7-code', family: 'moonshot', autoApproveArgs: ['--auto'] },
      'victory-auditor': { harness: 'opencode', model: 'opencode-go/glm-5.3', family: 'zhipu', autoApproveArgs: ['--auto'] }
    }
  }
};

export function normalizePresetName(inputStr) {
  const s = (inputStr || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (s === '1' || s === 'claude,agy' || s === 'claude-agy' || s === 'duo') return 'claude,agy';
  if (s === '2' || s === 'claude' || s === 'solo-claude' || s === 'opus') return 'claude';
  if (s === '3' || s === 'agy' || s === 'solo-agy' || s === 'gemini') return 'agy';
  if (s === '4' || s === 'opencode' || s === 'solo-opencode' || s === 'open-weights') return 'opencode';
  if (s === '5' || s === 'agy,opencode' || s === 'opencode,agy' || s === 'mixto' || s === 'mixed') return 'agy,opencode';
  if (s === '6' || s === 'claude,agy,opencode' || s === 'trio' || s === 'all') return 'claude,agy,opencode';
  return s;
}

function parseArgs() {
  const args = { roster: 'roster.json', emergencyTo: null, listOnly: false, restore: false, preset: null };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--roster' && process.argv[i + 1]) {
      args.roster = process.argv[++i];
    } else if (arg === '--emergency-to' && process.argv[i + 1]) {
      args.emergencyTo = process.argv[++i];
    } else if (arg === '--preset' && process.argv[i + 1]) {
      args.preset = process.argv[++i];
    } else if (arg === '--restore' || arg === '-r') {
      args.restore = true;
    } else if (arg === '--list' || arg === '-l') {
      args.listOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso:
  node tools/team.mjs                      Modo interactivo (menú por números)
  node tools/team.mjs --list               Imprime la tabla de equipo y sale
  node tools/team.mjs --emergency-to <harness> Hot-swap de emergencia: migra agentes al harness destino (agy, claude, opencode)
  node tools/team.mjs --restore            Restaura la configuración previa a la emergencia
  node tools/team.mjs --preset <preset>    Aplica Golden Preset recomendado:
                                           - 'duo' / 'claude,agy'      (Claude Opus + Sonnet F3 + AGY)
                                           - 'solo-claude'             (Claude Opus + Sonnet, sin Haiku)
                                           - 'solo-agy' / 'gemini'     (100% Gemini Flash High / Pro High)
                                           - 'solo-opencode' / 'open-weights' (Kimi 2.7, Qwen 3.6, GLM 5.3, DeepSeek Pro)
                                           - 'mixed'                   (AGY + OpenCode)
                                           - 'trio'                    (Claude + AGY + OpenCode)
  node tools/team.mjs --roster <path>      Ruta específica a roster.json
`);
      process.exit(0);
    }
  }
  return args;
}

export function loadRoster(rosterPath) {
  const fullPath = resolve(process.cwd(), rosterPath);
  if (!existsSync(fullPath)) {
    console.error(`${RED}Error: No se encontró el archivo '${rosterPath}'. Asegúrate de estar en la raíz del proyecto o pasar --roster <path>.${RESET}`);
    process.exit(1);
  }
  try {
    const raw = readFileSync(fullPath, 'utf8');
    return { data: JSON.parse(raw), fullPath };
  } catch (err) {
    console.error(`${RED}Error al parsear ${rosterPath}: ${err.message}${RESET}`);
    process.exit(1);
  }
}

export function saveRoster(fullPath, data) {
  writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function inferEffort(agent) {
  const model = (agent.model || '').toLowerCase();

  if (model.includes('-high') || model.includes('opus') || model.includes('r1') || model.includes('deepseek-v4-pro')) {
    return 'High';
  }
  if (model.includes('-medium') || model.includes('sonnet') || model.includes('kimi-k2.7') || model.includes('qwen3.6') || model.includes('qwen3.8-max') || model.includes('glm-5.3')) {
    return 'Medium';
  }
  if (model.includes('-low') || model.includes('flash') || model.includes('haiku') || model.includes('mini') || model.includes('free')) {
    return 'Low';
  }
  return 'Standard';
}

function formatEffortBadge(effort) {
  switch (effort) {
    case 'High':
      return `${RED}${BOLD}High (Deep)${RESET}`;
    case 'Medium':
      return `${YELLOW}Medium     ${RESET}`;
    case 'Low':
      return `${GREEN}Low (Fast) ${RESET}`;
    default:
      return `${CYAN}Standard   ${RESET}`;
  }
}

function formatHarnessBadge(harness) {
  switch (harness) {
    case 'agy':
      return `${CYAN}${BOLD}agy     ${RESET}`;
    case 'opencode':
      return `${MAGENTA}opencode${RESET}`;
    case 'claude':
      return `${YELLOW}claude  ${RESET}`;
    default:
      return `${GRAY}${harness.padEnd(8)}${RESET}`;
  }
}

export function renderTable(rosterData) {
  const agents = rosterData.agents || [];
  const topName = rosterData.topology || 'Proyecto';

  console.log(`\n${CYAN}${BOLD}====================================================================================================${RESET}`);
  console.log(`                     ${BOLD}ROSTER DEL EQUIPO SWARM-FORGE (${topName})${RESET}`);
  console.log(`${CYAN}====================================================================================================${RESET}`);
  console.log(`${BOLD} #   ROL                    FASE    HARNESS    MODELO                          ESFUERZO${RESET}`);
  console.log(`${GRAY}----------------------------------------------------------------------------------------------------${RESET}`);

  agents.forEach((agent, idx) => {
    const num = `[${idx + 1}]`.padEnd(4);
    const role = (agent.role || '').padEnd(22);
    const phase = String(agent.phase ?? 'all').padEnd(7);
    const harness = formatHarnessBadge(agent.harness || 'unknown');
    const model = (agent.model || '').padEnd(31);
    const effort = formatEffortBadge(inferEffort(agent));

    console.log(`${BOLD}${num}${RESET} ${role} ${phase} ${harness} ${model} ${effort}`);
  });

  console.log(`${CYAN}====================================================================================================${RESET}\n`);
}

export function applyEmergencyTo(rosterData, fullPath, targetHarness) {
  const target = (targetHarness || '').toLowerCase().trim();
  const backupPath = resolve(dirname(fullPath), BACKUP_FILE);
  writeFileSync(backupPath, JSON.stringify(rosterData, null, 2) + '\n', 'utf8');

  let changed = 0;

  for (const agent of rosterData.agents) {
    if (target === 'agy') {
      if (agent.harness !== 'agy') {
        agent.harness = 'agy';
        agent.herdrKind = 'agy';
        agent.autoApproveArgs = ['--dangerously-skip-permissions'];
        agent.family = 'google';

        if (agent.role === 'sentinel') {
          agent.model = 'gemini-3.8-flash-high';
        } else if (agent.kind === 'coord') {
          agent.model = 'gemini-3.1-pro-high';
        } else if (agent.kind === 'judge' || agent.role.includes('auditor') || agent.role.includes('reviewer') || agent.role.includes('integrator')) {
          agent.model = 'gemini-3.1-pro-high';
        } else if (agent.kind === 'utility' || agent.role.includes('explorer')) {
          agent.model = 'gemini-3.8-flash-low';
        } else if (agent.kind === 'writer') {
          agent.model = 'gemini-3.8-flash-high';
        } else {
          agent.model = 'gemini-3.8-flash-high';
        }
        agent.modelId = `agy/${agent.model}`;
        changed++;
      }
    } else if (target === 'claude') {
      if (agent.harness !== 'claude') {
        agent.harness = 'claude';
        agent.herdrKind = 'claude';
        agent.autoApproveArgs = ['--permission-mode', 'auto'];
        agent.family = 'anthropic';

        if (agent.kind === 'writer' || agent.role === 'sentinel' || agent.role.includes('victory')) {
          agent.model = 'opus';
        } else {
          agent.model = 'sonnet';
        }
        agent.modelId = `claude/${agent.model}`;
        changed++;
      }
    } else if (target === 'opencode') {
      if (agent.harness !== 'opencode') {
        agent.harness = 'opencode';
        agent.herdrKind = 'opencode';
        agent.autoApproveArgs = ['--auto'];

        if (agent.role === 'sentinel') {
          agent.model = 'opencode-go/deepseek-v4-flash-vision-exp';
          agent.family = 'deepseek';
        } else if (agent.kind === 'coord') {
          agent.model = 'opencode-go/glm-5.3';
          agent.family = 'zhipu';
        } else if (agent.kind === 'writer') {
          const isUi = agent.role.includes('frontend') || agent.role.includes('web') || agent.role.includes('ui');
          agent.model = isUi ? 'opencode-go/qwen3.6-plus' : 'opencode-go/kimi-k2.7-code';
          agent.family = isUi ? 'qwen' : 'moonshot';
        } else if (agent.kind === 'judge') {
          agent.model = 'opencode-go/deepseek-v4-pro';
          agent.family = 'deepseek';
        } else if (agent.kind === 'utility' || agent.role.includes('explorer')) {
          agent.model = 'opencode/nemotron-3-ultra-free';
          agent.family = 'nvidia';
        } else {
          agent.model = 'opencode-go/deepseek-v4-pro';
          agent.family = 'deepseek';
        }
        agent.modelId = `opencode/${agent.model.replace('opencode-go/', '')}`;
        changed++;
      }
    } else {
      throw new Error(`Harness de emergencia no soportado: '${targetHarness}'. Opciones válidas: agy, claude, opencode.`);
    }
  }

  rosterData.harnesses = [...new Set(rosterData.agents.map(a => a.harness))];
  saveRoster(fullPath, rosterData);
  return changed;
}

export function restoreBackup(fullPath) {
  const backupPath = resolve(dirname(fullPath), BACKUP_FILE);
  if (!existsSync(backupPath)) {
    return null;
  }
  const raw = readFileSync(backupPath, 'utf8');
  writeFileSync(fullPath, raw, 'utf8');
  return JSON.parse(raw);
}

export function applyGoldenPreset(presetKey, fullPath, rosterData) {
  const normalized = normalizePresetName(presetKey);
  const golden = GOLDEN_PRESETS[normalized];

  if (golden) {
    for (const agent of rosterData.agents) {
      let roleCfg = golden.roles[agent.role];
      if (!roleCfg) {
        if (agent.role.startsWith('explorer')) {
          roleCfg = golden.roles.explorer || golden.roles.explorer_1 || golden.roles.explorer_2;
        } else if (agent.kind === 'writer') {
          const isUi = agent.role.includes('frontend') || agent.role.includes('web') || agent.role.includes('mobile') || agent.role.includes('ui');
          roleCfg = isUi ? golden.roles.worker_frontend : golden.roles.worker_backend;
        } else if (agent.kind === 'judge') {
          if (agent.role.includes('security')) {
            roleCfg = golden.roles['security-auditor'] || golden.roles['code-reviewer'];
          } else if (agent.role.includes('contract')) {
            roleCfg = golden.roles['contract-integrator'] || golden.roles['code-reviewer'];
          } else if (agent.role.includes('forensic')) {
            roleCfg = golden.roles['forensic-auditor'] || golden.roles['code-reviewer'];
          } else if (agent.role.includes('victory')) {
            roleCfg = golden.roles['victory-auditor'] || golden.roles['code-reviewer'];
          } else if (agent.role.startsWith('challenger')) {
            roleCfg = golden.roles.challenger_routing || golden.roles.challenger_realtime || golden.roles['code-reviewer'];
          } else {
            roleCfg = golden.roles['code-reviewer'];
          }
        } else if (agent.kind === 'coord') {
          roleCfg = golden.roles.orchestrator;
        }
      }

      if (roleCfg) {
        agent.harness = roleCfg.harness;
        agent.herdrKind = roleCfg.harness;
        agent.model = roleCfg.model;
        agent.modelId = `${roleCfg.harness}/${roleCfg.model.replace('opencode-go/', '')}`;
        agent.family = roleCfg.family;
        agent.autoApproveArgs = [...roleCfg.autoApproveArgs];
      }
    }

    rosterData.harnesses = [...new Set(rosterData.agents.map(a => a.harness))];
    rosterData.description = `${golden.title} — Configuración de modelos Swarm-Forge`;
    if (fullPath) saveRoster(fullPath, rosterData);
    return { data: rosterData, title: golden.title, desc: golden.description };
  }

  // Fallback opcional a recomendador dinámico si existe topology.json
  const topologyPath = resolve(process.cwd(), 'topology.json');
  const recommender = join(SWARM_FORGE_ROOT, 'tools', 'recommend-roster.mjs');

  if (existsSync(topologyPath) && existsSync(recommender)) {
    try {
      execSync(`node "${recommender}" --topology "${topologyPath}" --harness "${presetKey}" --out "${fullPath}"`, {
        stdio: 'pipe'
      });
      const raw = readFileSync(fullPath, 'utf8');
      return { data: JSON.parse(raw), title: `Preset dinámico (${presetKey})`, desc: 'Calculado por recomendador Swarm-Forge' };
    } catch (err) {
      console.error(`${RED}Error ejecutando recomendador: ${err.message}${RESET}`);
    }
  }
  return null;
}

const AGY_MODELS = {
  high_pro: 'gemini-3.1-pro-high',
  high_flash: 'gemini-3.8-flash-high',
  medium: 'gemini-3.8-flash-medium',
  low: 'gemini-3.8-flash-low'
};

const OPENCODE_MODELS = {
  high: 'opencode-go/deepseek-v4-pro',
  medium_coder: 'opencode-go/kimi-k2.7-code',
  medium_ui: 'opencode-go/qwen3.6-plus',
  low: 'opencode-go/deepseek-v4.1-flash',
  free: 'opencode/nemotron-3-ultra-free'
};

async function editAgentInteractive(rl, agent, agentNum, fullPath, rosterData) {
  console.log(`\n${GREEN}${BOLD}--> Editando ${agentNum} ${agent.role} (Actual: ${agent.harness} | ${agent.model} | ${inferEffort(agent)})${RESET}`);
  console.log(`¿Qué deseas modificar?`);
  console.log(`  ${BOLD}[1]${RESET} Nivel de Esfuerzo / Thinking`);
  console.log(`  ${BOLD}[2]${RESET} Conmutar Proveedor / Harness (AGY vs OpenCode vs Claude)`);
  console.log(`  ${BOLD}[3]${RESET} Escribir Modelo a mano`);
  console.log(`  ${BOLD}[0]${RESET} Volver atrás`);

  const opt = (await rl.question(`${BOLD}Selecciona opción [1-3, 0]: ${RESET}`)).trim();

  if (opt === '1') {
    console.log(`\nNiveles de esfuerzo disponibles:`);
    console.log(`  ${BOLD}[1] High${RESET}     (Opus / gemini-3.1-pro-high / deepseek-v4-pro)`);
    console.log(`  ${BOLD}[2] Medium${RESET}   (Sonnet / kimi-k2.7-code / qwen3.6-plus / gemini-3.8-flash-medium)`);
    console.log(`  ${BOLD}[3] Low${RESET}      (deepseek-v4.1-flash / gemini-3.8-flash-low / nemotron free)`);

    const effOpt = (await rl.question(`${BOLD}Selecciona esfuerzo [1-3]: ${RESET}`)).trim();

    if (agent.harness === 'claude') {
      if (effOpt === '1') agent.model = 'opus';
      else agent.model = 'sonnet';
      agent.modelId = `claude/${agent.model}`;
    } else if (agent.harness === 'agy') {
      if (effOpt === '1') {
        const isPro = agent.kind === 'coord' || agent.kind === 'judge';
        agent.model = isPro ? AGY_MODELS.high_pro : AGY_MODELS.high_flash;
      } else if (effOpt === '2') {
        agent.model = AGY_MODELS.medium;
      } else if (effOpt === '3') {
        agent.model = AGY_MODELS.low;
      }
      agent.modelId = `agy/${agent.model}`;
    } else if (agent.harness === 'opencode') {
      if (effOpt === '1') agent.model = OPENCODE_MODELS.high;
      else if (effOpt === '2') agent.model = OPENCODE_MODELS.medium_coder;
      else agent.model = OPENCODE_MODELS.low;
      agent.modelId = `opencode/${agent.model.replace('opencode-go/', '')}`;
    }

    saveRoster(fullPath, rosterData);
    console.log(`\n${GREEN}✔ [${agent.role}] actualizado con éxito a: ${agent.harness} | ${agent.model} (${inferEffort(agent)})${RESET}`);

  } else if (opt === '2') {
    console.log(`\nProveedores disponibles:`);
    console.log(`  ${BOLD}[1] claude${RESET}   (Opus en Workers/Sentinel, Sonnet en jueces)`);
    console.log(`  ${BOLD}[2] agy${RESET}      (Gemini 3.1 Pro / 3.8 Flash High - Cero OpenCode)`);
    console.log(`  ${BOLD}[3] opencode${RESET} (Kimi 2.7, Qwen 3.6, GLM 5.3, DeepSeek Pro - Cero Grok)`);

    const provOpt = (await rl.question(`${BOLD}Selecciona proveedor [1-3]: ${RESET}`)).trim();

    if (provOpt === '1') {
      agent.harness = 'claude';
      agent.herdrKind = 'claude';
      agent.autoApproveArgs = ['--permission-mode', 'auto'];
      agent.family = 'anthropic';
      agent.model = (agent.kind === 'writer' || agent.role === 'sentinel') ? 'opus' : 'sonnet';
      agent.modelId = `claude/${agent.model}`;
    } else if (provOpt === '2') {
      agent.harness = 'agy';
      agent.herdrKind = 'agy';
      agent.autoApproveArgs = ['--dangerously-skip-permissions'];
      agent.family = 'google';
      const isJudgeOrCoord = agent.kind === 'coord' || agent.kind === 'judge';
      agent.model = isJudgeOrCoord ? AGY_MODELS.high_pro : AGY_MODELS.high_flash;
      agent.modelId = `agy/${agent.model}`;
    } else if (provOpt === '3') {
      agent.harness = 'opencode';
      agent.herdrKind = 'opencode';
      agent.autoApproveArgs = ['--auto'];
      agent.family = agent.role.includes('backend') ? 'moonshot' : (agent.role.includes('frontend') ? 'qwen' : 'zhipu');
      agent.model = agent.role.includes('backend') ? OPENCODE_MODELS.medium_coder : OPENCODE_MODELS.medium_ui;
      agent.modelId = `opencode/${agent.model.replace('opencode-go/', '')}`;
    }

    saveRoster(fullPath, rosterData);
    console.log(`\n${GREEN}✔ [${agent.role}] cambiado a ${agent.harness} (${agent.model})${RESET}`);

  } else if (opt === '3') {
    const customModel = (await rl.question(`${BOLD}Escribe el identificador del modelo (ej: opus, kimi-k2.7-code, gemini-3.1-pro-high): ${RESET}`)).trim();
    if (customModel) {
      agent.model = customModel;
      agent.modelId = `${agent.harness}/${customModel}`;
      saveRoster(fullPath, rosterData);
      console.log(`\n${GREEN}✔ [${agent.role}] modelo actualizado a ${customModel}${RESET}`);
    }
  }
}

async function main() {
  const args = parseArgs();
  let { data: rosterData, fullPath } = loadRoster(args.roster);

  if (args.emergencyTo) {
    try {
      const changed = applyEmergencyTo(rosterData, fullPath, args.emergencyTo);
      console.log(`${GREEN}${BOLD}✔ HOT-SWAP DE EMERGENCIA COMPLETADO:${RESET} ${changed} agentes fueron migrados a ${args.emergencyTo}.`);
      console.log(`${CYAN}  roster.json actualizado. Backup guardado en ${BACKUP_FILE}.${RESET}`);
      renderTable(rosterData);
      process.exit(0);
    } catch (err) {
      console.error(`${RED}Error en Hot-Swap: ${err.message}${RESET}`);
      process.exit(1);
    }
  }

  if (args.restore) {
    const restored = restoreBackup(fullPath);
    if (restored) {
      console.log(`${GREEN}${BOLD}✔ RESTAURACIÓN EXITOSA:${RESET} Roster restaurado desde ${BACKUP_FILE}.`);
      renderTable(restored);
      process.exit(0);
    } else {
      console.error(`${RED}No se encontró ningún archivo de respaldo (${BACKUP_FILE}).${RESET}`);
      process.exit(1);
    }
  }

  if (args.preset) {
    const res = applyGoldenPreset(args.preset, fullPath, rosterData);
    if (res) {
      console.log(`${GREEN}${BOLD}✔ PRESET '${args.preset}' APLICADO EXITOSAMENTE:${RESET} ${res.title}`);
      console.log(`${GRAY}  ${res.desc}${RESET}`);
      renderTable(res.data);
      process.exit(0);
    } else {
      console.error(`${RED}No se pudo aplicar el preset '${args.preset}'.${RESET}`);
      process.exit(1);
    }
  }

  if (args.listOnly) {
    renderTable(rosterData);
    process.exit(0);
  }

  const rl = readline.createInterface({ input, output });

  try {
    while (true) {
      renderTable(rosterData);

      console.log(`${BOLD}Opciones:${RESET}`);
      console.log(`  • Ingresa un número ${BOLD}[1-${rosterData.agents.length}]${RESET} para editar ese agente puntual.`);
      console.log(`  • Ingresa ${YELLOW}${BOLD}[P]${RESET} para Cargar Golden Preset (Dúo Opus, Trío, Solo Claude, Solo AGY, etc.).`);
      console.log(`  • Ingresa ${RED}${BOLD}[E]${RESET} para Hot-Swap de Emergencia (migra agentes a harness de contingencia, guarda backup).`);
      console.log(`  • Ingresa ${CYAN}${BOLD}[R]${RESET} para Restaurar el Roster previo a la emergencia.`);
      console.log(`  • Presiona ${BOLD}[Enter]${RESET} o escribe ${BOLD}'q'${RESET} para salir.`);

      const ans = (await rl.question(`\n${BOLD}Tu selección: ${RESET}`)).trim().toLowerCase();

      if (!ans || ans === 'q' || ans === 'exit') {
        console.log(`\n${GREEN}¡Listo! Sesión finalizada.${RESET}\n`);
        break;
      }

      if (ans === 'e') {
        const dest = (await rl.question(`${YELLOW}Harness destino de emergencia [agy/claude/opencode, default agy]: ${RESET}`)).trim().toLowerCase() || 'agy';
        const confirm = (await rl.question(`${YELLOW}¿Seguro que deseas migrar agentes externos a '${dest}'? [s/N]: ${RESET}`)).trim().toLowerCase();
        if (confirm === 's' || confirm === 'si' || confirm === 'y') {
          try {
            const changed = applyEmergencyTo(rosterData, fullPath, dest);
            console.log(`\n${GREEN}${BOLD}✔ Se migraron ${changed} agentes a ${dest} con éxito. Backup guardado en ${BACKUP_FILE}.${RESET}\n`);
          } catch (e) {
            console.log(`\n${RED}Error: ${e.message}${RESET}\n`);
          }
        }
        continue;
      }

      if (ans === 'r') {
        const restored = restoreBackup(fullPath);
        if (restored) {
          rosterData = restored;
          console.log(`\n${GREEN}${BOLD}✔ Roster restaurado desde el backup previo a la emergencia.${RESET}\n`);
        } else {
          console.log(`\n${RED}No hay backup previo guardado.${RESET}\n`);
        }
        continue;
      }

      if (ans === 'p') {
        console.log(`\n${BOLD}Golden Presets disponibles:${RESET}`);
        console.log(`  ${BOLD}[1] duo / claude,agy${RESET}      (Dúo Elite: Claude Opus en Workers/Sentinel + Sonnet F3 + AGY Gemini Pro)`);
        console.log(`  ${BOLD}[2] solo-claude${RESET}           (Solo Claude: Opus en Workers/Sentinel + Sonnet en Fase 3. Sin Haiku)`);
        console.log(`  ${BOLD}[3] solo-agy / gemini${RESET}     (Solo AGY: 100% Gemini Flash High & Pro High - Cero APIs externas)`);
        console.log(`  ${BOLD}[4] solo-opencode${RESET}         (Solo OpenCode: Kimi 2.7, Qwen 3.6, GLM 5.3, DeepSeek Pro. Cero Grok)`);
        console.log(`  ${BOLD}[5] mixed / agy,opencode${RESET}  (Mixto: Gemini + Kimi 2.7 / Qwen 3.6 / GLM / DeepSeek)`);
        console.log(`  ${BOLD}[6] trio${RESET}                  (Trío Soberano: Opus Backend, Qwen Frontend, Sonnet F3, Gemini Pro)`);

        const pOpt = (await rl.question(`\nSelecciona preset [1-6]: `)).trim();
        const res = applyGoldenPreset(pOpt, fullPath, rosterData);
        if (res) {
          rosterData = res.data;
          console.log(`\n${GREEN}${BOLD}✔ ${res.title} aplicado con éxito.${RESET}`);
          console.log(`${GRAY}  ${res.desc}${RESET}\n`);
        }
        continue;
      }

      const idx = parseInt(ans, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < rosterData.agents.length) {
        await editAgentInteractive(rl, rosterData.agents[idx], `[${idx + 1}]`, fullPath, rosterData);
      } else {
        console.log(`${RED}Opción no válida. Intenta de nuevo.${RESET}`);
      }
    }
  } finally {
    rl.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
