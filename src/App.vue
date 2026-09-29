<template>
  <div class="app">
    <GameToast :toasts="toasts" @dismiss="dismissToast" />
    <SettingsDialog :open="showSettings" @close="showSettings = false" />

    <!-- HUD superior -->
    <header class="hud">
      <div class="container hud-inner">
        <div class="brand">
          <span class="brand-badge" aria-hidden="true">🍅</span>
          <h1 class="brand-name">Pomo<span>petz</span></h1>
        </div>

        <div class="hud-stats">
          <div class="stat-pill coins" title="Moedas">
            <span class="stat-icon" aria-hidden="true">🪙</span>
            <span class="stat-value">{{ rewards.coins }}</span>
            <span class="sr-only">moedas</span>
          </div>
          <div class="stat-pill streak" :class="{ off: streak.currentStreak === 0 }" title="Ofensiva diária">
            <span class="stat-icon" aria-hidden="true">🔥</span>
            <span class="stat-value">{{ streak.currentStreak }}</span>
            <span class="sr-only">dias de ofensiva</span>
          </div>
          <button
            class="theme-toggle"
            :title="isDark ? 'Mudar para tema dia' : 'Mudar para tema noite'"
            :aria-label="isDark ? 'Mudar para tema dia' : 'Mudar para tema noite'"
            @click="toggleTheme"
          >
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <button
            class="settings-btn"
            title="Configurações"
            aria-label="Configurações"
            @click="showSettings = true"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <div class="stage">
          <section class="stage-timer" aria-label="Temporizador">
            <TimerDisplay
              :pomodoro="pomodoro"
              :pet="rewards.getActivePet()"
              @pip-error="pushToast('🪟', 'Não foi possível abrir a janela flutuante neste navegador.', 'info')"
            />
          </section>

          <aside class="stage-side">
            <ActivePet :pet="rewards.getActivePet()" :mood="petMood" />
            <StreakWidget
              :current-streak="streak.currentStreak"
              :longest-streak="streak.longestStreak"
              :next-pet-progress="streak.getNextPetProgress"
            />
          </aside>
        </div>

        <!-- Menu do jogo -->
        <nav class="menu" role="tablist" aria-label="Menu">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            role="tab"
            class="menu-tab"
            :class="[tab.id, { active: activeTab === tab.id }]"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            <span class="menu-icon" aria-hidden="true">{{ tab.icon }}</span>
            <span class="menu-label">{{ tab.label }}</span>
            <span v-if="tab.id === 'excursions' && readyCount > 0" class="menu-badge">{{ readyCount }}</span>
          </button>
        </nav>

        <div class="menu-content" role="tabpanel">
          <Transition name="swap" mode="out-in">
            <Shop
              v-if="activeTab === 'shop'"
              key="shop"
              :rewards="rewards"
              @pet-purchased="onPetPurchased"
            />
            <PetCollection
              v-else-if="activeTab === 'collection'"
              key="collection"
              :rewards="rewards"
              :streak="streak"
              :excursion="excursion"
              @pet-selected="onPetSelected"
            />
            <ExcursionPanel
              v-else
              key="excursions"
              :excursion="excursion"
              :rewards="rewards"
              :pets="rewards.ALL_PETS"
              @excursion-started="onExcursionStarted"
              @excursion-claimed="onExcursionClaimed"
            />
          </Transition>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>Foque, descanse e cuide dos seus pets 🐾</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { usePomodoro } from './composables/usePomodoro'
import { useRewards } from './composables/useRewards'
import { useStreak } from './composables/useStreak'
import { useExcursion } from './composables/useExcursion'
import { useDataMigration } from './composables/useDataMigration'
import { useSound } from './composables/useSound'

import GameToast from './components/GameToast.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import TimerDisplay from './components/TimerDisplay.vue'
import ActivePet from './components/ActivePet.vue'
import StreakWidget from './components/StreakWidget.vue'
import Shop from './components/Shop.vue'
import PetCollection from './components/PetCollection.vue'
import ExcursionPanel from './components/ExcursionPanel.vue'

// Os composables retornam objetos com refs. Envolvê-los em reactive()
// desembrulha as refs, então nos templates e nos componentes filhos
// `pomodoro.isRunning` é um boolean (e não um objeto Ref sempre "truthy").
const dataMigration = useDataMigration()
const rewards = reactive(useRewards())
const streak = reactive(useStreak())
const pomodoro = reactive(usePomodoro({ onComplete: handleCycleCompleted }))
const excursion = reactive(useExcursion(
  (coins) => rewards.addCoins(coins),
  (petId) => {
    if (!rewards.hasPet(petId)) {
      rewards.unlockedPets.push(petId)
      rewards.save()
    }
  }
))

const COINS_PER_FOCUS = 25

// ---------- Som e configurações ----------
const sound = useSound()
const showSettings = ref(false)

// ---------- Toasts ----------
const toasts = ref([])
let toastId = 0

const pushToast = (icon, text, tone = 'info') => {
  const id = ++toastId
  toasts.value.push({ id, icon, text, tone })
  if (toasts.value.length > 3) toasts.value.shift()
  setTimeout(() => dismissToast(id), 3200)
}

const dismissToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// ---------- Tema ----------
const THEME_KEY = 'pomopetz_theme'
const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')
const theme = ref(null)

const isDark = computed(() =>
  theme.value ? theme.value === 'dark' : !!systemDark?.matches
)

const applyTheme = () => {
  if (theme.value) document.documentElement.dataset.theme = theme.value
  else delete document.documentElement.dataset.theme
}

const toggleTheme = () => {
  theme.value = isDark.value ? 'light' : 'dark'
  try { localStorage.setItem(THEME_KEY, theme.value) } catch {}
  applyTheme()
}

try { theme.value = localStorage.getItem(THEME_KEY) } catch {}
applyTheme()

// ---------- Navegação ----------
const activeTab = ref('shop')
const tabs = [
  { id: 'shop', icon: '🏪', label: 'Loja' },
  { id: 'collection', icon: '📖', label: 'Coleção' },
  { id: 'excursions', icon: '🗺️', label: 'Excursões' }
]

const readyCount = computed(() => excursion.getReadyExcursions().length)

// Humor do pet acompanha o timer
const petMood = computed(() => {
  if (!pomodoro.isRunning) return 'idle'
  return pomodoro.currentMode === pomodoro.MODES.FOCUS ? 'focus' : 'break'
})

// Pets de ofensiva também entram na coleção (podem ser equipados/enviados)
const syncStreakPets = () => {
  let changed = false
  streak.unlockedStreakPets.forEach(id => {
    if (!rewards.hasPet(id)) {
      rewards.unlockedPets.push(id)
      changed = true
    }
  })
  if (changed) rewards.save()
}

syncStreakPets()

onMounted(() => {
  dataMigration.initialize()
  // Navegadores bloqueiam áudio até a primeira interação: libera no 1º clique/tecla
  window.addEventListener('pointerdown', sound.unlock, { once: true })
  window.addEventListener('keydown', sound.unlock, { once: true })
})

onUnmounted(() => {
  pomodoro.cleanup()
  window.removeEventListener('pointerdown', sound.unlock)
  window.removeEventListener('keydown', sound.unlock)
})

// Chamado pelo usePomodoro quando um ciclo termina naturalmente
function handleCycleCompleted (mode) {
  sound.play()

  if (mode !== pomodoro.MODES.FOCUS) {
    pushToast('☕', 'Pausa encerrada! Bora focar de novo?', 'info')
    return
  }

  rewards.addCoins(COINS_PER_FOCUS)
  pushToast('🪙', `+${COINS_PER_FOCUS} moedas! Foco concluído`, 'coins')

  const before = streak.unlockedStreakPets.length
  if (streak.recordFocusCompletion()) {
    pushToast('🔥', `Ofensiva: ${streak.currentStreak} ${streak.currentStreak === 1 ? 'dia' : 'dias'}!`, 'streak')
  }

  if (streak.unlockedStreakPets.length > before) {
    const newPets = streak.getUnlockedStreakPets().slice(before)
    newPets.forEach(pet => pushToast(pet.emoji, `Novo pet desbloqueado: ${pet.name}!`, 'pet'))
    syncStreakPets()
  }
}

const onPetPurchased = (petId) => {
  const pet = rewards.getPetById(petId)
  pushToast(pet?.emoji || '🎉', `${pet?.name || 'Pet'} entrou para a coleção!`, 'pet')
  if (!rewards.activePetId) rewards.setActivePet(petId)
}

const onPetSelected = (petId) => {
  const pet = rewards.getPetById(petId)
  if (pet) pushToast(pet.emoji, `${pet.name} está com você agora!`, 'success')
}

const onExcursionStarted = ({ petId, region }) => {
  const pet = rewards.getPetById(petId)
  const place = excursion.EXCURSION_CONFIG[region]
  pushToast(place.emoji, `${pet?.name || 'Seu pet'} partiu para ${place.name}!`, 'info')
}

const onExcursionClaimed = (reward) => {
  pushToast('🪙', `+${reward.coins} moedas da excursão!`, 'coins')
  if (reward.pet) pushToast(reward.pet.emoji, `Achado raro: ${reward.pet.name}!`, 'pet')
}
</script>

<style lang="scss" scoped>
@use './styles/variables' as *;
@use './styles/mixins' as *;

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

// ================= HUD =================
.hud {
  padding: $spacing-md 0;

  @include md-up { padding: $spacing-lg 0 $spacing-md; }
}

.hud-inner {
  @include flex-between;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.brand-badge {
  @include flex-center;
  width: 3rem;
  height: 3rem;
  font-size: 1.7rem;
  background: $tomato;
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 -4px 0 $tomato-deep, 0 $ledge-sm 0 $outline;
  animation: pp-wiggle 3s ease-in-out infinite;

  @include md-up {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 2rem;
  }
}

.brand-name {
  font-family: $font-display;
  font-weight: 700;
  font-size: 1.75rem;
  letter-spacing: 0.01em;
  color: $tomato;
  // Contorno grosso no texto, típico de logos de jogos
  -webkit-text-stroke: 6px $outline;
  paint-order: stroke fill;
  text-shadow: 0 4px 0 $outline;

  span { color: $sun; }

  @include md-up { font-size: 2.25rem; }
}

.hud-stats {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  @include md-up { gap: $spacing-md; }
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 5.5rem;
  padding: 0.2rem 0.9rem 0.2rem 0.2rem;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  box-shadow: 0 $ledge-sm 0 $outline;

  .stat-icon {
    @include flex-center;
    width: 2.1rem;
    height: 2.1rem;
    font-size: 1.1rem;
    border: $border-width solid $outline;
    border-radius: 50%;
  }

  .stat-value {
    font-family: $font-numbers;
    font-weight: 900;
    font-size: $font-size-lg;
    font-variant-numeric: tabular-nums;
  }

  &.coins .stat-icon {
    background: $sun;
    box-shadow: inset 0 -3px 0 $sun-deep;
  }

  &.streak .stat-icon {
    background: $tomato;
    box-shadow: inset 0 -3px 0 $tomato-deep;
  }

  &.streak.off .stat-icon { filter: grayscale(1); }
}

.theme-toggle,
.settings-btn {
  @include chunky-icon-btn(2.75rem);
}

// ================= Palco principal =================
.app-main {
  flex: 1;
  padding: $spacing-md 0 $spacing-2xl;
}

.stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-2xl;
  margin-top: $spacing-lg;

  @include lg-up {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: start;
    gap: $spacing-xl;
  }
}

.stage-side {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
}

// ================= Menu =================
.menu {
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
  margin-top: $spacing-3xl;
  padding: 0 $spacing-sm;

  @include md-up { gap: $spacing-md; }
}

.menu-tab {
  --tab: #{$surface};
  --tab-deep: #{$surface-3};

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  flex: 1;
  max-width: 11rem;
  padding: 0.6rem 0.5rem 0.75rem;
  font-family: $font-display;
  font-weight: 600;
  color: $ink;
  background: var(--tab);
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  box-shadow: inset 0 -4px 0 var(--tab-deep), 0 $ledge 0 $outline;
  transition: transform $transition-fast, box-shadow $transition-fast;

  &:hover:not(.active) { transform: translateY(-3px); }

  &:active { transform: translateY(3px); box-shadow: inset 0 -2px 0 var(--tab-deep), 0 1px 0 $outline; }

  &.active {
    color: $ink-on-color;
    transform: translateY(-4px);
  }

  &.shop.active { --tab: #{$sun}; --tab-deep: #{$sun-deep}; }
  &.collection.active { --tab: #{$grape}; --tab-deep: #{$grape-deep}; }
  &.excursions.active { --tab: #{$mint}; --tab-deep: #{$mint-deep}; }
}

.menu-icon {
  font-size: 1.75rem;
  line-height: 1.2;

  .menu-tab.active & { animation: pp-bob 1.8s ease-in-out infinite; }
}

.menu-label { font-size: $font-size-sm; @include md-up { font-size: $font-size-base; } }

.menu-badge {
  position: absolute;
  top: -0.6rem;
  right: -0.4rem;
  @include flex-center;
  min-width: 1.6rem;
  height: 1.6rem;
  padding: 0 0.35rem;
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-sm;
  color: #fff;
  background: $tomato-deep;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  animation: pp-pulse 1.2s ease-in-out infinite;
}

.menu-content {
  margin-top: $spacing-2xl;
}

.swap-enter-active { animation: pp-slide-up 300ms $ease-bounce both; }
.swap-leave-active { transition: opacity 120ms ease; }
.swap-leave-to { opacity: 0; }

// ================= Rodapé =================
.app-footer {
  padding: $spacing-lg 0 $spacing-xl;
  text-align: center;
  font-family: $font-display;
  font-weight: 500;
  color: $ink-faint;
}
</style>
