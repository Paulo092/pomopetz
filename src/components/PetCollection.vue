<template>
  <div class="collection">
    <h2>📚 Minha Coleção</h2>

    <div v-if="unlockedPets.length === 0" class="empty-state">
      <p>Nenhum pet desbloqueado ainda.</p>
      <p class="text-small">Compre um pet na loja para começar sua coleção!</p>
    </div>

    <div v-else>
      <div class="collection-tabs">
        <button v-for="tab in collectionTabs" :key="tab" class="tab-button" :class="{ active: activeCollectionTab === tab }" @click="activeCollectionTab = tab">
          {{ getTabLabel(tab) }}
        </button>
      </div>

      <div v-if="activeCollectionTab === 'shop'" class="tab-content">
        <div class="pets-grid">
          <div v-for="pet in shopPets" :key="pet.id" class="pet-item" :class="{ active: rewards.activePetId === pet.id }" @click="selectPet(pet.id)">
            <div class="pet-emoji">{{ pet.emoji }}</div>
            <div class="pet-name">{{ pet.name }}</div>
            <div v-if="rewards.activePetId === pet.id" class="active-indicator">✓</div>
          </div>
        </div>
      </div>

      <div v-if="activeCollectionTab === 'streak'" class="tab-content">
        <div v-if="streakPets.length === 0" class="empty-state">
          <p>Nenhum pet de streak desbloqueado ainda.</p>
          <p class="text-small">Complete ciclos de foco seguidos para desbloquear!</p>
        </div>
        <div v-else class="pets-grid">
          <div v-for="pet in streakPets" :key="pet.id" class="pet-item" :class="{ active: rewards.activePetId === pet.id }" @click="selectPet(pet.id)">
            <div class="pet-emoji">{{ pet.emoji }}</div>
            <div class="pet-name">{{ pet.name }}</div>
            <div class="pet-badge">🔥</div>
            <div v-if="rewards.activePetId === pet.id" class="active-indicator">✓</div>
          </div>
        </div>
      </div>

      <div v-if="activeCollectionTab === 'excursion'" class="tab-content">
        <div class="empty-state">
          <p>Pets de excursão aparecerão aqui quando você completar excursões!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  rewards: { type: Object, required: true },
  streak: { type: Object, required: true }
})

const emit = defineEmits(['pet-selected'])

const activeCollectionTab = ref('shop')
const collectionTabs = ['shop', 'streak', 'excursion']

const unlockedPets = computed(() => props.rewards.getUnlockedPets())
const shopPets = computed(() => props.rewards.SHOP_PETS.filter(pet => props.rewards.hasPet(pet.id)))
const streakPets = computed(() => props.streak.STREAK_PETS.filter(pet => props.streak.hasStreakPet(pet.id)))

const getTabLabel = (tab) => {
  const labels = { shop: '🛍️ Loja', streak: '🔥 Ofensiva', excursion: '🧳 Excursão' }
  return labels[tab]
}

const selectPet = (petId) => {
  if (props.rewards.setActivePet(petId)) {
    emit('pet-selected', petId)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.collection { @include card; }

.empty-state {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-secondary;

  p { margin-bottom: $spacing-sm;

    &:last-child { margin-bottom: 0; }
  }
}

.text-small {
  font-size: $font-size-sm;
  opacity: 0.8;
}

.collection-tabs {
  @include flex-center;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
}

.tab-button {
  @include btn-base;
  background-color: $bg-tertiary;
  color: $text-primary;
  border: 1px solid $border-color;
  padding: $spacing-md $spacing-lg;
  font-size: $font-size-sm;

  &:hover:not(:disabled) { border-color: $primary-color; }
  &.active {
    background-color: $primary-color;
    color: white;
    border-color: $primary-color;
  }
}

.tab-content { @include slide-up; }

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: $spacing-md;

  @include md-up {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

.pet-item {
  position: relative;
  @include flex-column;
  @include flex-center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  background-color: $bg-tertiary;
  border: 2px solid transparent;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    border-color: $primary-color;
    transform: translateY(-4px);
  }

  &.active {
    border-color: $success-color;
    background: linear-gradient(135deg, rgba($success-color, 0.1), rgba($success-color, 0.05));
  }
}

.pet-emoji { font-size: $font-size-3xl; }
.pet-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  text-align: center;
  color: $text-primary;
}

.pet-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  font-size: $font-size-base;
}

.active-indicator {
  position: absolute;
  bottom: $spacing-sm;
  right: $spacing-sm;
  width: 24px;
  height: 24px;
  @include flex-center;
  background-color: $success-color;
  color: white;
  border-radius: 50%;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
}
</style>
