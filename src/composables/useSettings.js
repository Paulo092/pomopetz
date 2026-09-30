import { reactive, watch } from 'vue'
import { SOUND_OPTIONS, DEFAULT_SOUND_ID } from '../audio/sounds'

const STORAGE_KEY = 'pomopetz_settings'

const DEFAULTS = {
  // Som
  soundEnabled: true,
  soundId: DEFAULT_SOUND_ID,
  volume: 0.7, // 0 → 1
  // Timer: ao terminar um ciclo, o próximo começa sozinho
  autoCycle: false
}

const loadSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const merged = { ...DEFAULTS, ...stored }
    if (!SOUND_OPTIONS.some(s => s.id === merged.soundId)) merged.soundId = DEFAULT_SOUND_ID
    merged.volume = Math.min(1, Math.max(0, Number(merged.volume) || 0))
    merged.soundEnabled = merged.soundEnabled !== false
    merged.autoCycle = merged.autoCycle === true
    return merged
  } catch {
    return { ...DEFAULTS }
  }
}

// Estado no escopo do módulo: as preferências são únicas no app inteiro,
// então todos os componentes que chamarem useSettings() enxergam os mesmos valores.
const settings = reactive(loadSettings())

watch(settings, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
  }
}, { deep: true })

export function useSettings () {
  return { settings }
}
