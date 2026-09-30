import { ref, computed, watch } from 'vue'

const MODES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
}

const MODE_DURATIONS = {
  [MODES.FOCUS]: 25 * 60,
  [MODES.SHORT_BREAK]: 5 * 60,
  [MODES.LONG_BREAK]: 15 * 60
}

// A cada N ciclos de foco, a pausa é longa
const FOCUS_CYCLES_BEFORE_LONG_BREAK = 4

const STORAGE_KEY = 'pomopetz_pomodoro'

/**
 * Temporizador Pomodoro.
 * O tempo é calculado a partir de um timestamp de término (endAt), e não
 * decrementando um contador — assim o timer não "atrasa" quando a aba fica
 * em segundo plano e continua correto após recarregar a página.
 *
 * @param {Object} options
 * @param {(mode: string) => void} [options.onComplete] chamado quando um ciclo termina naturalmente
 * @param {() => boolean} [options.shouldAutoStart] se retornar true, o próximo ciclo começa sozinho
 */
export function usePomodoro({ onComplete, shouldAutoStart } = {}) {
  const currentMode = ref(MODES.FOCUS)
  const timeRemaining = ref(MODE_DURATIONS[MODES.FOCUS])
  const isRunning = ref(false)
  const completedFocusCount = ref(0)
  const cyclePosition = ref(0)
  const lastCompletedMode = ref(null)

  let endAt = null
  let interval = null

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentMode: currentMode.value,
        timeRemaining: timeRemaining.value,
        completedFocusCount: completedFocusCount.value,
        cyclePosition: cyclePosition.value,
        endAt: isRunning.value ? endAt : null
      }))
    } catch (error) {
      console.error('Erro ao salvar pomodoro no localStorage:', error)
    }
  }

  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const totalDuration = computed(() => MODE_DURATIONS[currentMode.value])

  // 0 → 1 conforme o ciclo avança (usado no anel do timer)
  const progress = computed(() =>
    Math.min(1, Math.max(0, 1 - timeRemaining.value / totalDuration.value))
  )

  const updateTabTitle = () => {
    document.title = isRunning.value
      ? `${formattedTime.value} · ${getModeLabel()} - Pomopetz`
      : 'Pomopetz'
  }

  const stopInterval = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  const nextMode = computed(() => {
    if (currentMode.value !== MODES.FOCUS) return MODES.FOCUS
    return cyclePosition.value + 1 >= FOCUS_CYCLES_BEFORE_LONG_BREAK
      ? MODES.LONG_BREAK
      : MODES.SHORT_BREAK
  })

  const advanceCycle = () => {
    const target = nextMode.value
    if (currentMode.value === MODES.FOCUS) {
      cyclePosition.value = Math.min(FOCUS_CYCLES_BEFORE_LONG_BREAK, cyclePosition.value + 1)
    } else if (currentMode.value === MODES.LONG_BREAK) {
      cyclePosition.value = 0
    }
    goToMode(target)
  }

  const goToMode = (mode) => {
    currentMode.value = mode
    timeRemaining.value = MODE_DURATIONS[mode]
  }

  // Ciclo terminou naturalmente (tempo chegou a zero).
  // `live` = terminou com o app aberto (false ao restaurar um ciclo que
  // expirou enquanto a página estava fechada — aí não faz sentido auto-iniciar).
  const complete = ({ live = true } = {}) => {
    const finishedMode = currentMode.value
    stopInterval()
    isRunning.value = false
    endAt = null

    if (finishedMode === MODES.FOCUS) completedFocusCount.value++
    lastCompletedMode.value = finishedMode
    advanceCycle()
    saveToStorage()
    updateTabTitle()

    onComplete?.(finishedMode)

    // Ciclagem automática: emenda o próximo modo da sequência
    if (live && shouldAutoStart?.()) start()
  }

  const tick = () => {
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    if (remaining !== timeRemaining.value) timeRemaining.value = remaining
    if (remaining === 0) complete()
  }

  const runInterval = () => {
    stopInterval()
    isRunning.value = true
    // 250ms mantém o display preciso sem custo relevante
    interval = setInterval(tick, 250)
    tick()
  }

  const start = () => {
    if (isRunning.value) return
    if (timeRemaining.value <= 0) timeRemaining.value = MODE_DURATIONS[currentMode.value]
    lastCompletedMode.value = null
    endAt = Date.now() + timeRemaining.value * 1000
    runInterval()
    saveToStorage()
  }

  const pause = () => {
    if (!isRunning.value) return
    tick()
    stopInterval()
    isRunning.value = false
    endAt = null
    saveToStorage()
    updateTabTitle()
  }

  const reset = () => {
    stopInterval()
    isRunning.value = false
    endAt = null
    lastCompletedMode.value = null
    timeRemaining.value = MODE_DURATIONS[currentMode.value]
    saveToStorage()
    updateTabTitle()
  }

  // Pular NÃO conta como ciclo concluído (sem recompensa),
  // mas avança a sequência normalmente (inclusive até a pausa longa)
  const skip = () => {
    stopInterval()
    isRunning.value = false
    endAt = null
    lastCompletedMode.value = null
    advanceCycle()
    saveToStorage()
    updateTabTitle()
  }

  const setMode = (mode) => {
    if (!Object.values(MODES).includes(mode)) return
    stopInterval()
    isRunning.value = false
    endAt = null
    lastCompletedMode.value = null
    goToMode(mode)
    saveToStorage()
    updateTabTitle()
  }

  function getModeLabel (mode = currentMode.value) {
    const labels = {
      [MODES.FOCUS]: 'Foco',
      [MODES.SHORT_BREAK]: 'Pausa Curta',
      [MODES.LONG_BREAK]: 'Pausa Longa'
    }
    return labels[mode]
  }

  const cleanup = () => stopInterval()

  const initializeFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const data = JSON.parse(stored)

      currentMode.value = Object.values(MODES).includes(data.currentMode) ? data.currentMode : MODES.FOCUS
      completedFocusCount.value = Number(data.completedFocusCount) || 0
      const storedPosition = Number.isFinite(data.cyclePosition)
        ? data.cyclePosition
        : completedFocusCount.value % FOCUS_CYCLES_BEFORE_LONG_BREAK
      cyclePosition.value = Math.min(FOCUS_CYCLES_BEFORE_LONG_BREAK, Math.max(0, Math.floor(storedPosition)))
      timeRemaining.value = Number.isFinite(data.timeRemaining) && data.timeRemaining > 0
        ? data.timeRemaining
        : MODE_DURATIONS[currentMode.value]

      // Estava rodando quando a página foi fechada/recarregada
      if (data.endAt) {
        endAt = data.endAt
        if (endAt > Date.now()) {
          runInterval()
        } else {
          complete({ live: false })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pomodoro do localStorage:', error)
    }
  }

  watch([timeRemaining, isRunning], updateTabTitle)

  initializeFromStorage()
  updateTabTitle()

  return {
    currentMode,
    timeRemaining,
    isRunning,
    completedFocusCount,
    cyclePosition,
    nextMode,
    focusCyclesBeforeLongBreak: FOCUS_CYCLES_BEFORE_LONG_BREAK,
    lastCompletedMode,
    formattedTime,
    totalDuration,
    progress,
    start,
    pause,
    reset,
    skip,
    setMode,
    getModeLabel,
    cleanup,
    MODES
  }
}
