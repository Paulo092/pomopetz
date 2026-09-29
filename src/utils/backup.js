/**
 * Backup do progresso do Pomopetz em forma de texto.
 *
 * Todo o estado do app fica no localStorage em chaves "pomopetz_*".
 * O backup é um código assim:
 *
 *   POMOPETZ1:<dados em base64url>
 *
 * Dentro dele há um JSON com as chaves/valores, a data do backup, a versão
 * dos dados e uma soma de verificação (checksum) para detectar códigos
 * incompletos ou alterados ao copiar e colar.
 *
 * Este módulo não depende do Vue, então pode ser testado isoladamente.
 */

export const STORAGE_PREFIX = 'pomopetz_'
export const BACKUP_PREFIX = 'POMOPETZ1:'
const FORMAT = 1
const MAX_CODE_LENGTH = 500_000

// Chaves locais que não fazem sentido levar para outro navegador
const EXCLUDED_KEYS = new Set([])

export class BackupError extends Error {}

// Marcador (sessionStorage) para avisar, após recarregar, que um backup foi restaurado
export const RESTORED_FLAG = 'pomopetz_restored'

// ---------- Codificação ----------

const toBase64Url = (text) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (code) => {
  let base64 = code.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// Hash cyrb53: rápido e suficiente para detectar erros de cópia (não é criptografia)
const checksum = (text) => {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

// O checksum cobre tudo menos ele mesmo, com campos em ordem fixa
const sign = ({ app, format, dataVersion, createdAt, data }) => {
  const sortedData = Object.keys(data).sort().reduce((acc, key) => {
    acc[key] = data[key]
    return acc
  }, {})
  return checksum(JSON.stringify([app, format, dataVersion, createdAt, sortedData]))
}

// ---------- Leitura do localStorage ----------

export function collectData (storage = localStorage) {
  const data = {}
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(STORAGE_PREFIX) && !EXCLUDED_KEYS.has(key)) {
      data[key] = storage.getItem(key)
    }
  }
  return data
}

// ---------- Exportar ----------

/**
 * Gera o código de backup com todo o progresso salvo.
 * @param {number} dataVersion versão atual do esquema de dados
 */
export function createBackup (dataVersion, storage = localStorage) {
  const data = collectData(storage)
  const payload = {
    app: 'pomopetz',
    format: FORMAT,
    dataVersion,
    createdAt: new Date().toISOString(),
    data
  }
  payload.checksum = sign(payload)
  return BACKUP_PREFIX + toBase64Url(JSON.stringify(payload))
}

// ---------- Importar ----------

const isJsonObjectOrArray = (value) => {
  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object'
  } catch {
    return false
  }
}

// Regras mínimas para não restaurar lixo nas chaves conhecidas
const VALIDATORS = {
  pomopetz_version: (v) => /^\d+$/.test(v),
  pomopetz_theme: (v) => v === 'light' || v === 'dark',
  pomopetz_rewards: (v) => {
    if (!isJsonObjectOrArray(v)) return false
    const r = JSON.parse(v)
    return Number.isFinite(r.coins) && r.coins >= 0 && Array.isArray(r.unlockedPets)
  },
  pomopetz_streak: (v) => {
    if (!isJsonObjectOrArray(v)) return false
    const s = JSON.parse(v)
    return Number.isFinite(s.currentStreak) && Array.isArray(s.unlockedStreakPets ?? [])
  },
  pomopetz_excursions: (v) => isJsonObjectOrArray(v) && Array.isArray(JSON.parse(v)),
  pomopetz_profile: (v) => {
    if (!isJsonObjectOrArray(v)) return false
    const p = JSON.parse(v)
    return typeof (p.name ?? '') === 'string' && (p.name ?? '').length <= 100
  },
  pomopetz_pomodoro: isJsonObjectOrArray,
  pomopetz_settings: isJsonObjectOrArray
}

/**
 * Lê e valida um código de backup. Lança BackupError com mensagem amigável.
 * @param {string} code
 * @param {number} currentDataVersion versão de dados que este app entende
 */
export function parseBackup (code, currentDataVersion) {
  const clean = String(code ?? '').replace(/\s+/g, '')

  if (!clean) throw new BackupError('Cole um código de backup primeiro.')
  if (clean.length > MAX_CODE_LENGTH) throw new BackupError('Esse código é grande demais para ser um backup do Pomopetz.')
  if (!clean.startsWith(BACKUP_PREFIX)) {
    throw new BackupError('Isso não parece um código do Pomopetz. Ele deve começar com "POMOPETZ1:".')
  }

  let payload
  try {
    payload = JSON.parse(fromBase64Url(clean.slice(BACKUP_PREFIX.length)))
  } catch {
    throw new BackupError('Não consegui ler o código. Ele pode ter sido copiado pela metade.')
  }

  if (payload?.app !== 'pomopetz' || typeof payload.data !== 'object' || payload.data === null) {
    throw new BackupError('O código está em um formato desconhecido.')
  }
  if (payload.format > FORMAT) {
    throw new BackupError('Esse backup foi feito por uma versão mais nova do Pomopetz. Atualize o app e tente de novo.')
  }
  if (Number(payload.dataVersion) > currentDataVersion) {
    throw new BackupError('Esse backup usa dados de uma versão mais nova do Pomopetz. Atualize o app e tente de novo.')
  }
  if (payload.checksum !== sign(payload)) {
    throw new BackupError('O código parece incompleto ou foi alterado. Copie o código inteiro de novo.')
  }

  const data = {}
  for (const [key, value] of Object.entries(payload.data)) {
    // Segurança: só aceita chaves do próprio app, com valores em texto
    if (!key.startsWith(STORAGE_PREFIX) || typeof value !== 'string') continue
    const validate = VALIDATORS[key]
    if (validate && !validate(value)) {
      throw new BackupError(`O backup tem dados inválidos (${key.replace(STORAGE_PREFIX, '')}).`)
    }
    data[key] = value
  }

  if (!Object.keys(data).length) throw new BackupError('Esse backup está vazio.')

  return {
    data,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : null,
    dataVersion: Number(payload.dataVersion) || currentDataVersion
  }
}

/**
 * Substitui todo o progresso salvo pelo do backup.
 * Depois disso a página deve ser recarregada para o app ler os novos dados.
 */
export function applyBackup ({ data }, storage = localStorage) {
  Object.keys(collectData(storage)).forEach(key => storage.removeItem(key))
  for (const [key, value] of Object.entries(data)) storage.setItem(key, value)
}

// ---------- Resumo legível ----------

const safeParse = (value, fallback) => {
  try { return JSON.parse(value) ?? fallback } catch { return fallback }
}

/**
 * Resumo para mostrar ao usuário (moedas, pets, ofensiva, ciclos).
 * @param {Record<string, string>} data chaves/valores do localStorage
 */
export function summarizeData (data) {
  const rewards = safeParse(data.pomopetz_rewards, {})
  const streak = safeParse(data.pomopetz_streak, {})
  const pomodoro = safeParse(data.pomopetz_pomodoro, {})
  const profile = safeParse(data.pomopetz_profile, {})
  const pets = new Set([
    ...(Array.isArray(rewards.unlockedPets) ? rewards.unlockedPets : []),
    ...(Array.isArray(streak.unlockedStreakPets) ? streak.unlockedStreakPets : [])
  ])
  return {
    name: typeof profile.name === 'string' ? profile.name : '',
    coins: Number(rewards.coins) || 0,
    pets: pets.size,
    streak: Number(streak.currentStreak) || 0,
    longestStreak: Number(streak.longestStreak) || 0,
    focusCycles: Number(pomodoro.completedFocusCount) || 0
  }
}
