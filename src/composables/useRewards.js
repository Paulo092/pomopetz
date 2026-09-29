import { ref } from 'vue'
import { STREAK_PETS } from './useStreak'
import { EXCURSION_PETS } from './useExcursion'

const STORAGE_KEY = 'pomopetz_rewards'

export const SHOP_PETS = [
  { id: 1, name: 'Pikachu', emoji: '⚡', price: 100, rarity: 'common' },
  { id: 2, name: 'Bulbassauro', emoji: '🌱', price: 150, rarity: 'common' },
  { id: 3, name: 'Blastoise', emoji: '💧', price: 250, rarity: 'rare' },
  { id: 4, name: 'Charizard', emoji: '🔥', price: 300, rarity: 'rare' },
  { id: 5, name: 'Dragonite', emoji: '🐉', price: 500, rarity: 'epic' },
  { id: 6, name: 'Mewtwo', emoji: '👽', price: 1000, rarity: 'legendary' }
]

export function useRewards() {
  const coins = ref(0)
  const unlockedPets = ref([])
  const activePetId = ref(null)

  const initialize = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        coins.value = data.coins || 0
        unlockedPets.value = data.unlockedPets || []
        activePetId.value = data.activePetId || null
      } else {
        coins.value = 0
        unlockedPets.value = [1]
        activePetId.value = 1
        // Salva já o pet inicial, para aparecer em backups e resumos
        save()
      }
    } catch (error) {
      console.error('Erro ao carregar rewards:', error)
    }
  }

  const save = () => {
    try {
      const data = { coins: coins.value, unlockedPets: unlockedPets.value, activePetId: activePetId.value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar rewards:', error)
    }
  }

  const addCoins = (amount) => {
    coins.value += amount
    save()
  }

  const removeCoins = (amount) => {
    if (coins.value >= amount) {
      coins.value -= amount
      save()
      return true
    }
    return false
  }

  const buyPet = (petId) => {
    const pet = SHOP_PETS.find(p => p.id === petId)
    if (!pet) return false
    if (removeCoins(pet.price)) {
      if (!unlockedPets.value.includes(petId)) {
        unlockedPets.value.push(petId)
        save()
      }
      return true
    }
    return false
  }

  const setActivePet = (petId) => {
    if (unlockedPets.value.includes(petId)) {
      activePetId.value = petId
      save()
      return true
    }
    return false
  }

  // Catálogo completo: loja + ofensiva + excursão
  const ALL_PETS = [...SHOP_PETS, ...STREAK_PETS, ...EXCURSION_PETS]

  const getActivePet = () => ALL_PETS.find(p => p.id === activePetId.value) || null

  const getPetById = (petId) => ALL_PETS.find(p => p.id === petId)

  const getUnlockedPets = () => unlockedPets.value.map(id => getPetById(id)).filter(Boolean)

  const hasPet = (petId) => unlockedPets.value.includes(petId)

  const canBuy = (petId) => {
    const pet = SHOP_PETS.find(p => p.id === petId)
    return pet && coins.value >= pet.price && !hasPet(petId)
  }

  initialize()

  return { coins, unlockedPets, activePetId, addCoins, removeCoins, buyPet, setActivePet, getActivePet, getPetById, getUnlockedPets, hasPet, canBuy, SHOP_PETS, ALL_PETS, save }
}
