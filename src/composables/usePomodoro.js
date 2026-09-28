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

const STORAGE_KEY = 'pomopetz_pomodoro'

export function usePomodoro() {
  const currentMode = ref(MODES.FOCUS)
  const timeRemaining = ref(MODE_DURATIONS[MODES.FOCUS])
  const isRunning = ref(false)
  let interval = null

  const initializeFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        currentMode.value = data.currentMode || MODES.FOCUS
        timeRemaining.value = data.timeRemaining || MODE_DURATIONS[currentMode.value]
      }
    } catch (error) {
      console.error('Erro ao carregar pomodoro do localStorage:', error)
    }
  }

  const saveToStorage = () => {
    try {
      const data = {
        currentMode: currentMode.value,
        timeRemaining: timeRemaining.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar pomodoro no localStorage:', error)
    }
  }

  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  const updateTabTitle = () => {
    document.title = `${formattedTime.value} - Pomopetz`
  }

  const start = () => {
    if (isRunning.value || timeRemaining.value === 0) return
    isRunning.value = true
    interval = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value === 0) {
        pause()
      }
      updateTabTitle()
      saveToStorage()
    }, 1000)
  }

  const pause = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
    isRunning.value = false
    saveToStorage()
  }

  const reset = () => {
    pause()
    timeRemaining.value = MODE_DURATIONS[currentMode.value]
    updateTabTitle()
    saveToStorage()
  }

  const skip = () => {
    pause()
    const modes = Object.values(MODES)
    const currentIndex = modes.indexOf(currentMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    currentMode.value = modes[nextIndex]
    timeRemaining.value = MODE_DURATIONS[currentMode.value]
    updateTabTitle()
    saveToStorage()
  }

  const setMode = (mode) => {
    if (!Object.values(MODES).includes(mode)) return
    pause()
    currentMode.value = mode
    timeRemaining.value = MODE_DURATIONS[mode]
    updateTabTitle()
    saveToStorage()
  }

  const getModeLabel = (mode = currentMode.value) => {
    const labels = {
      [MODES.FOCUS]: 'Foco',
      [MODES.SHORT_BREAK]: 'Pausa Curta',
      [MODES.LONG_BREAK]: 'Pausa Longa'
    }
    return labels[mode]
  }

  const cleanup = () => {
    if (interval) clearInterval(interval)
  }

  watch(timeRemaining, updateTabTitle)
  initializeFromStorage()
  updateTabTitle()

  return {
    currentMode, timeRemaining, isRunning, formattedTime,
    start, pause, reset, skip, setMode, getModeLabel, cleanup, MODES
  }
}
