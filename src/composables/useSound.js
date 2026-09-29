import { reactive, watch } from 'vue'
import { SOUND_OPTIONS, DEFAULT_SOUND_ID, scheduleSound } from '../audio/sounds'

const STORAGE_KEY = 'pomopetz_settings'

const DEFAULTS = {
  soundEnabled: true,
  soundId: DEFAULT_SOUND_ID,
  volume: 0.7 // 0 → 1
}

const loadSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const merged = { ...DEFAULTS, ...stored }
    if (!SOUND_OPTIONS.some(s => s.id === merged.soundId)) merged.soundId = DEFAULT_SOUND_ID
    merged.volume = Math.min(1, Math.max(0, Number(merged.volume) || 0))
    return merged
  } catch {
    return { ...DEFAULTS }
  }
}

// Estado no escopo do módulo: as preferências são únicas no app inteiro,
// então todos os componentes que chamarem useSound() enxergam os mesmos valores.
const settings = reactive(loadSettings())

watch(settings, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
  }
}, { deep: true })

let audioCtx = null
let currentOutput = null

const getContext = () => {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    audioCtx = new AudioCtx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

// Os navegadores só liberam áudio depois de uma interação do usuário.
// Chamar isto num clique garante que o som toque quando o timer acabar.
const unlock = () => { getContext() }

const playSound = (id, volume) => {
  const ctx = getContext()
  if (!ctx || volume <= 0) return

  // Corta suavemente o som anterior (ex.: clicar em várias prévias seguidas)
  if (currentOutput) {
    const previous = currentOutput
    previous.gain.setTargetAtTime(0, ctx.currentTime, 0.03)
    setTimeout(() => previous.disconnect(), 300)
  }

  const output = ctx.createGain()
  output.gain.value = volume
  output.connect(ctx.destination)
  currentOutput = output

  const duration = scheduleSound(ctx, output, id, ctx.currentTime + 0.02)
  setTimeout(() => {
    output.disconnect()
    if (currentOutput === output) currentOutput = null
  }, (duration + 0.5) * 1000)
}

export function useSound () {
  // Som de fim de ciclo (respeita as preferências)
  const play = () => {
    if (!settings.soundEnabled) return
    playSound(settings.soundId, settings.volume)
  }

  // Prévia na tela de configurações (toca mesmo com o som desligado,
  // mas no volume escolhido)
  const preview = (id = settings.soundId) => {
    playSound(id, settings.volume)
  }

  return {
    settings,
    SOUND_OPTIONS,
    play,
    preview,
    unlock
  }
}
