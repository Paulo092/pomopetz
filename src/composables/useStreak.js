import { ref, computed } from 'vue'

const STORAGE_KEY = 'pomopetz_streak'

export const STREAK_PETS = [
  { id: 101, name: 'Ninetales', emoji: '🦊', streakRequired: 3, rarity: 'rare' },
  { id: 102, name: 'Arcanine', emoji: '🐕‍🦺', streakRequired: 7, rarity: 'rare' },
  { id: 103, name: 'Moltres', emoji: '🔥🦅', streakRequired: 30, rarity: 'legendary' },
  { id: 104, name: 'Ho-Oh', emoji: '🌈🦅', streakRequired: 60, rarity: 'legendary' },
  { id: 105, name: 'Lugia', emoji: '💫🐦', streakRequired: 100, rarity: 'legendary' }
]

export function useStreak() {
  const currentStreak = ref(0)
  const longestStreak = ref(0)
  const lastFocusDate = ref(null)
  const unlockedStreakPets = ref([])

  const initialize = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        currentStreak.value = data.currentStreak || 0
        longestStreak.value = data.longestStreak || 0
        lastFocusDate.value = data.lastFocusDate || null
        unlockedStreakPets.value = data.unlockedStreakPets || []
      }
    } catch (error) {
      console.error('Erro ao carregar streak:', error)
    }
  }

  const save = () => {
    try {
      const data = { currentStreak: currentStreak.value, longestStreak: longestStreak.value, lastFocusDate: lastFocusDate.value, unlockedStreakPets: unlockedStreakPets.value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar streak:', error)
    }
  }

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const recordFocusCompletion = () => {
    const today = getTodayDateString()
    if (lastFocusDate.value === today) return false

    if (lastFocusDate.value) {
      const lastDate = new Date(lastFocusDate.value)
      const today_date = new Date(today)
      const diffTime = today_date - lastDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 1) {
        currentStreak.value = 1
      } else if (diffDays === 1) {
        currentStreak.value++
      }
    } else {
      currentStreak.value = 1
    }

    lastFocusDate.value = today
    if (currentStreak.value > longestStreak.value) {
      longestStreak.value = currentStreak.value
    }
    checkAndUnlockPets()
    save()
    return true
  }

  const checkAndUnlockPets = () => {
    STREAK_PETS.forEach(pet => {
      if (currentStreak.value >= pet.streakRequired && !unlockedStreakPets.value.includes(pet.id)) {
        unlockedStreakPets.value.push(pet.id)
      }
    })
  }

  const getNextStreakPet = () => {
    const locked = STREAK_PETS.filter(pet => !unlockedStreakPets.value.includes(pet.id))
    if (locked.length === 0) return null
    return locked.sort((a, b) => a.streakRequired - b.streakRequired)[0]
  }

  const getNextPetProgress = computed(() => {
    const nextPet = getNextStreakPet()
    if (!nextPet) return { current: currentStreak.value, required: currentStreak.value, pet: null }
    return { current: currentStreak.value, required: nextPet.streakRequired, pet: nextPet, percent: Math.min((currentStreak.value / nextPet.streakRequired) * 100, 100) }
  })

  const getUnlockedStreakPets = () => unlockedStreakPets.value.map(id => STREAK_PETS.find(p => p.id === id)).filter(Boolean)

  const hasStreakPet = (petId) => unlockedStreakPets.value.includes(petId)

  const resetStreak = () => {
    currentStreak.value = 0
    lastFocusDate.value = null
    unlockedStreakPets.value = []
    save()
  }

  initialize()

  return { currentStreak, longestStreak, lastFocusDate, unlockedStreakPets, recordFocusCompletion, getNextStreakPet, getNextPetProgress, getUnlockedStreakPets, hasStreakPet, resetStreak, STREAK_PETS }
}
