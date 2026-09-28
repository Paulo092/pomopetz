import { ref } from 'vue'

const STORAGE_KEY = 'pomopetz_excursions'

export const EXCURSION_REGIONS = {
  FOREST: 'forest',
  MOUNTAIN: 'mountain',
  OCEAN: 'ocean',
  VOLCANO: 'volcano'
}

export const EXCURSION_CONFIG = {
  forest: { name: 'Floresta', emoji: '🌲', duration: 4 * 60 * 60 * 1000, cost: 100, rewardCoins: { min: 50, max: 150 }, petDropChance: 0.3 },
  mountain: { name: 'Montanha', emoji: '⛰️', duration: 8 * 60 * 60 * 1000, cost: 200, rewardCoins: { min: 100, max: 300 }, petDropChance: 0.25 },
  ocean: { name: 'Oceano', emoji: '🌊', duration: 6 * 60 * 60 * 1000, cost: 150, rewardCoins: { min: 75, max: 200 }, petDropChance: 0.35 },
  volcano: { name: 'Vulcão', emoji: '🌋', duration: 10 * 60 * 60 * 1000, cost: 300, rewardCoins: { min: 150, max: 400 }, petDropChance: 0.2 }
}

export const EXCURSION_PETS = [
  { id: 201, name: 'Venusaur', emoji: '🦕', regions: ['forest'], rarity: 'rare' },
  { id: 202, name: 'Golem', emoji: '🪨', regions: ['mountain'], rarity: 'rare' },
  { id: 203, name: 'Lapras', emoji: '🐢', regions: ['ocean'], rarity: 'rare' },
  { id: 204, name: 'Magmortar', emoji: '🔥', regions: ['volcano'], rarity: 'rare' },
  { id: 205, name: 'Articuno', emoji: '❄️🦅', regions: ['mountain'], rarity: 'legendary' },
  { id: 206, name: 'Zapdos', emoji: '⚡🦅', regions: ['forest'], rarity: 'legendary' },
  { id: 207, name: 'Moltres', emoji: '🔥🦅', regions: ['volcano'], rarity: 'legendary' }
]

export function useExcursion(onGetCoinsCallback = null, onUnlockPetCallback = null) {
  const activeExcursions = ref([])

  const initialize = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        activeExcursions.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Erro ao carregar excursions:', error)
    }
  }

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeExcursions.value))
    } catch (error) {
      console.error('Erro ao salvar excursions:', error)
    }
  }

  const startExcursion = (petId, region) => {
    if (!Object.values(EXCURSION_REGIONS).includes(region)) return false
    const config = EXCURSION_CONFIG[region]
    const returnTimestamp = Date.now() + config.duration
    activeExcursions.value.push({ petId, region, returnTimestamp, claimed: false })
    save()
    return true
  }

  const completeExcursion = (excursionIndex) => {
    const excursion = activeExcursions.value[excursionIndex]
    if (!excursion || excursion.claimed) return null
    const config = EXCURSION_CONFIG[excursion.region]
    const rewards = { coins: Math.floor(Math.random() * (config.rewardCoins.max - config.rewardCoins.min + 1)) + config.rewardCoins.min, pet: null }
    if (Math.random() < config.petDropChance) {
      const regionPets = EXCURSION_PETS.filter(p => p.regions.includes(excursion.region))
      if (regionPets.length > 0) {
        rewards.pet = regionPets[Math.floor(Math.random() * regionPets.length)]
      }
    }
    excursion.claimed = true
    if (onGetCoinsCallback) onGetCoinsCallback(rewards.coins)
    if (onUnlockPetCallback && rewards.pet) onUnlockPetCallback(rewards.pet.id)
    save()
    return rewards
  }

  const removeExcursion = (excursionIndex) => {
    activeExcursions.value.splice(excursionIndex, 1)
    save()
  }

  const getTimeRemaining = (excursionIndex) => {
    const excursion = activeExcursions.value[excursionIndex]
    if (!excursion) return 0
    const now = Date.now()
    return Math.max(0, excursion.returnTimestamp - now)
  }

  const formatTimeRemaining = (excursionIndex) => {
    const remaining = getTimeRemaining(excursionIndex)
    const totalSeconds = Math.floor(remaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    else if (minutes > 0) return `${minutes}m ${seconds}s`
    else return `${seconds}s`
  }

  const getReadyExcursions = () => {
    const now = Date.now()
    return activeExcursions.value.map((e, i) => ({ ...e, index: i })).filter(e => !e.claimed && e.returnTimestamp <= now)
  }

  const getActiveExcursions = () => {
    const now = Date.now()
    return activeExcursions.value.map((e, i) => ({ ...e, index: i })).filter(e => !e.claimed && e.returnTimestamp > now).sort((a, b) => a.returnTimestamp - b.returnTimestamp)
  }

  const getExcursionCost = (region) => EXCURSION_CONFIG[region]?.cost || 0

  const canStartExcursion = (petId, region, availableCoins) => {
    const cost = getExcursionCost(region)
    const alreadySent = activeExcursions.value.some(e => e.petId === petId && !e.claimed)
    return availableCoins >= cost && !alreadySent
  }

  initialize()

  return { activeExcursions, startExcursion, completeExcursion, removeExcursion, getTimeRemaining, formatTimeRemaining, getReadyExcursions, getActiveExcursions, getExcursionCost, canStartExcursion, EXCURSION_REGIONS, EXCURSION_CONFIG, EXCURSION_PETS }
}
