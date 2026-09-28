<template>
  <div class="app">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <h1 class="app-title">🍅 Pomopetz</h1>
          <div class="header-stats">
            <div class="stat">
              <span class="stat-icon">💰</span>
              <span class="stat-value">{{ rewards.coins }}</span>
            </div>
            <div class="stat" v-if="streak.currentStreak > 0">
              <span class="stat-icon">🔥</span>
              <span class="stat-value">{{ streak.currentStreak }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <div class="content-grid">
          <div class="timer-section">
            <TimerDisplay 
              :pomodoro="pomodoro"
              @focus-completed="onFocusCompleted"
            />
          </div>
          <div class="pet-section">
            <ActivePet :pet="rewards.getActivePet()" />
            <StreakWidget 
              :current-streak="streak.currentStreak"
              :next-pet-progress="streak.getNextPetProgress"
            />
          </div>
        </div>

        <div class="tabs-navigation">
          <button 
            v-for="tab in tabs"
            :key="tab"
            class="tab-button"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ getTabLabel(tab) }}
          </button>
        </div>

        <div class="tabs-content">
          <div v-if="activeTab === 'shop'" class="tab-pane">
            <Shop 
              :rewards="rewards"
              @pet-purchased="onPetPurchased"
            />
          </div>
          <div v-if="activeTab === 'collection'" class="tab-pane">
            <PetCollection 
              :rewards="rewards"
              :streak="streak"
              @pet-selected="onPetSelected"
            />
          </div>
          <div v-if="activeTab === 'excursions'" class="tab-pane">
            <ExcursionPanel 
              :excursion="excursion"
              :rewards="rewards"
              :pets="getAllPets()"
              @excursion-started="onExcursionStarted"
              @excursion-claimed="onExcursionClaimed"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePomodoro } from './composables/usePomodoro'
import { useRewards } from './composables/useRewards'
import { useStreak } from './composables/useStreak'
import { useExcursion } from './composables/useExcursion'
import { useDataMigration } from './composables/useDataMigration'

import TimerDisplay from './components/TimerDisplay.vue'
import ActivePet from './components/ActivePet.vue'
import StreakWidget from './components/StreakWidget.vue'
import Shop from './components/Shop.vue'
import PetCollection from './components/PetCollection.vue'
import ExcursionPanel from './components/ExcursionPanel.vue'

const dataMigration = useDataMigration()
const pomodoro = usePomodoro()
const rewards = useRewards()
const streak = useStreak()
const excursion = useExcursion(
  (coins) => rewards.addCoins(coins),
  (petId) => {
    if (!rewards.hasPet(petId)) {
      rewards.unlockedPets.value.push(petId)
      rewards.save?.()
    }
  }
)

const activeTab = ref('shop')
const tabs = ['shop', 'collection', 'excursions']

onMounted(() => {
  dataMigration.initialize()
})

onUnmounted(() => {
  pomodoro.cleanup()
})

const getTabLabel = (tab) => {
  const labels = {
    shop: '🏪 Loja',
    collection: '📚 Coleção',
    excursions: '🧳 Excursões'
  }
  return labels[tab]
}

const onFocusCompleted = () => {
  if (streak.recordFocusCompletion()) {
    console.log('Novo pet de streak desbloqueado!')
  }
  rewards.addCoins(25)
}

const onPetPurchased = (petId) => {
  if (rewards.unlockedPets.value.length === 1) {
    rewards.setActivePet(petId)
  }
}

const onPetSelected = (petId) => {
  rewards.setActivePet(petId)
}

const onExcursionStarted = () => {}
const onExcursionClaimed = () => {}

const getAllPets = () => [
  ...rewards.SHOP_PETS,
  ...streak.STREAK_PETS,
  ...excursion.EXCURSION_PETS
]
</script>

<style lang="scss" scoped>
@import './styles/variables.scss';
@import './styles/mixins.scss';

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-secondary;
}

.app-header {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  color: white;
  padding: $spacing-xl $spacing-lg;
  box-shadow: $shadow-md;
}

.header-content {
  @include flex-between;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

.app-title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-bold;
  margin: 0;
}

.header-stats {
  @include flex-center;
  gap: $spacing-lg;
}

.stat {
  @include flex-center;
  gap: $spacing-sm;
  background: rgba(255, 255, 255, 0.2);
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  font-weight: $font-weight-semibold;
  backdrop-filter: blur(10px);
}

.app-main {
  flex: 1;
  padding: $spacing-xl $spacing-lg;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $spacing-2xl;
  margin-bottom: $spacing-2xl;

  @include md-up {
    grid-template-columns: 2fr 1fr;
  }
}

.timer-section {
  @include card;
}

.pet-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.tabs-navigation {
  @include flex-center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
}

.tab-button {
  @include btn-base;
  background-color: $bg-primary;
  border: 1px solid $border-color;
  color: $text-primary;

  &:hover:not(:disabled) {
    border-color: $primary-color;
    color: $primary-color;
  }

  &.active {
    background-color: $primary-color;
    color: white;
    border-color: $primary-color;
  }
}

.tab-pane {
  @include slide-up;
}
</style>
