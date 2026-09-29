import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'pomopetz_profile'
export const NAME_MAX_LENGTH = 30

// Remove caracteres de controle e espaços extras; limita o tamanho
export const sanitizeName = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX_LENGTH)

const load = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { name: '', onboarded: false }
    const data = JSON.parse(stored)
    return { name: sanitizeName(data.name), onboarded: data.onboarded !== false }
  } catch {
    return { name: '', onboarded: false }
  }
}

// Estado no escopo do módulo: um único perfil para o app inteiro
const profile = reactive(load())

watch(profile, () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.error('Erro ao salvar perfil:', error)
  }
}, { deep: true })

// Primeiro nome, para mensagens curtas ("Mandou bem, Paulo!")
const firstName = computed(() => profile.name.split(' ')[0] || '')

/**
 * Sufixo para personalizar frases: `Mandou bem${nameSuffix.value}!`
 * vira "Mandou bem, Paulo!" com nome, ou "Mandou bem!" sem nome.
 */
const nameSuffix = computed(() => (firstName.value ? `, ${firstName.value}` : ''))

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 5) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function useProfile () {
  const setName = (name) => { profile.name = sanitizeName(name) }

  // Conclui o primeiro acesso (com ou sem nome)
  const finishOnboarding = (name = '') => {
    setName(name)
    profile.onboarded = true
  }

  return {
    profile,
    firstName,
    nameSuffix,
    hasName: computed(() => !!profile.name),
    needsOnboarding: computed(() => !profile.onboarded),
    greeting,
    setName,
    finishOnboarding
  }
}
