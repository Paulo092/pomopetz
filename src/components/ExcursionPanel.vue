<template>
  <div class="excursion-panel">
    <h2>🧳 Excursões de Pets</h2>

    <div class="excursion-content">
      <div class="section">
        <h3>Em Andamento</h3>
        <div v-if="activeExcursions.length === 0" class="empty-message">
          <p>Nenhuma excursão em andamento</p>
        </div>
        <div v-else class="excursion-list">
          <div v-for="(excursion, idx) in activeExcursions" :key="idx" class="excursion-item">
            <div class="excursion-info">
              <div class="pet-info">
                <span class="pet-emoji">{{ getPetEmoji(excursion.petId) }}</span>
                <div class="pet-details">
                  <div class="pet-name">{{ getPetName(excursion.petId) }}</div>
                  <div class="region-name">
                    {{ getRegionConfig(excursion.region).emoji }} {{ getRegionConfig(excursion.region).name }}
                  </div>
                </div>
              </div>
              <div class="time-remaining">
                {{ formatTimeRemaining(idx) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Prontas para Coletar</h3>
        <div v-if="readyExcursions.length === 0" class="empty-message">
          <p>Nenhuma excursão pronta</p>
        </div>
        <div v-else class="excursion-list">
          <div v-for="(excursion, idx) in readyExcursions" :key="idx" class="excursion-item ready">
            <div class="excursion-info">
              <div class="pet-info">
                <span class="pet-emoji">{{ getPetEmoji(excursion.petId) }}</span>
                <div class="pet-details">
                  <div class="pet-name">{{ getPetName(excursion.petId) }}</div>
                  <div class="region-name">
                    {{ getRegionConfig(excursion.region).emoji }} {{ getRegionConfig(excursion.region).name }}
                  </div>
                </div>
              </div>
            </div>
            <button class="claim-button" @click="claimReward(excursion.index)">
              ✅ Coletar
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Enviar para Excursão</h3>
        <div v-if="rewards.getUnlockedPets().length === 0" class="empty-message">
          <p>Você precisa ter pets desbloqueados para enviar em excursões</p>
        </div>
        <div v-else>
          <div class="regions-grid">
            <div v-for="region in Object.values(excursion.EXCURSION_REGIONS)" :key="region" class="region-card">
              <div class="region-header">
                <div class="region-emoji">{{ getRegionConfig(region).emoji }}</div>
                <div class="region-name">{{ getRegionConfig(region).name }}</div>
              </div>
              <div class="region-details">
                <div class="detail">
                  <span class="label">Duração:</span>
                  <span class="value">{{ formatDuration(getRegionConfig(region).duration) }}</span>
                </div>
                <div class="detail">
                  <span class="label">Custo:</span>
                  <span class="value">💰 {{ getRegionConfig(region).cost }}</span>
                </div>
              </div>
              <select v-model="selectedPetPerRegion[region]" class="pet-select">
                <option value="">-- Selecione um pet --</option>
                <option v-for="pet in availablePets" :key="pet.id" :value="pet.id">
                  {{ pet.emoji }} {{ pet.name }}
                </option>
              </select>
              <button class="send-button" :disabled="!canSendExcursion(region)" @click="sendExcursion(region)">
                🚀 Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  excursion: { type: Object, required: true },
  rewards: { type: Object, required: true },
  pets: { type: Array, default: () => [] }
})

const emit = defineEmits(['excursion-started', 'excursion-claimed'])

const selectedPetPerRegion = ref({})
let updateInterval = null

onMounted(() => {
  updateInterval = setInterval(() => {}, 1000)
})

onUnmounted(() => {
  if (updateInterval) clearInterval(updateInterval)
})

const activeExcursions = computed(() => props.excursion.getActiveExcursions())
const readyExcursions = computed(() => props.excursion.getReadyExcursions())
const availablePets = computed(() => props.rewards.getUnlockedPets())

const getRegionConfig = (region) => props.excursion.EXCURSION_CONFIG[region]
const getPetEmoji = (petId) => {
  const pet = props.pets.find(p => p.id === petId)
  return pet?.emoji || '❓'
}

const getPetName = (petId) => {
  const pet = props.pets.find(p => p.id === petId)
  return pet?.name || 'Desconhecido'
}

const formatTimeRemaining = (idx) => {
  return props.excursion.formatTimeRemaining(activeExcursions.value[idx].index)
}

const formatDuration = (ms) => {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  return `${hours}h`
}

const canSendExcursion = (region) => {
  const petId = parseInt(selectedPetPerRegion.value[region])
  return petId && props.excursion.canStartExcursion(petId, region, props.rewards.coins)
}

const sendExcursion = (region) => {
  const petId = parseInt(selectedPetPerRegion.value[region])
  if (!canSendExcursion(region)) return
  const cost = props.excursion.getExcursionCost(region)
  if (props.rewards.removeCoins(cost)) {
    props.excursion.startExcursion(petId, region)
    selectedPetPerRegion.value[region] = ''
    emit('excursion-started')
  }
}

const claimReward = (excursionIndex) => {
  const reward = props.excursion.completeExcursion(excursionIndex)
  if (reward) { emit('excursion-claimed') }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;
@use "sass:color";

.excursion-panel { @include card; }

.excursion-content {
  @include flex-column;
  gap: $spacing-2xl;
}

.section {
  @include flex-column;
  gap: $spacing-lg;

  h3 {
    margin: 0;
    font-size: $font-size-lg;
    color: $text-primary;
  }
}

.empty-message {
  text-align: center;
  padding: $spacing-xl;
  background-color: $bg-tertiary;
  border-radius: $radius-lg;
  color: $text-secondary;

  p { margin: 0; }
}

.excursion-list {
  @include flex-column;
  gap: $spacing-md;
}

.excursion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  background-color: $bg-tertiary;
  border-radius: $radius-lg;
  border-left: 4px solid $info-color;

  &.ready {
    border-left-color: $success-color;
    background: linear-gradient(135deg, rgba($success-color, 0.05), rgba($success-color, 0.02));
  }
}

.excursion-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: $spacing-lg;
}

.pet-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.pet-emoji { font-size: $font-size-2xl; }

.pet-details { @include flex-column; }

.pet-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.region-name {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.time-remaining {
  font-weight: $font-weight-bold;
  color: $warning-color;
  font-family: $font-family-mono;
  white-space: nowrap;
}

.claim-button {
  @include btn-base;
  @include btn-primary;
  background-color: $success-color;
  padding: $spacing-md $spacing-lg;

  &:hover:not(:disabled) {
    background-color: color.adjust($success-color, $lightness: -10%);
  }
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $spacing-lg;
}

.region-card {
  @include flex-column;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: $bg-tertiary;
  border: 2px solid $border-color;
  border-radius: $radius-lg;
  transition: all $transition-base;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-md;
  }
}

.region-header {
  @include flex-column;
  @include flex-center;
  gap: $spacing-sm;
}

.region-emoji { font-size: $font-size-3xl; }

.region-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
  text-align: center;
}

.region-details {
  @include flex-column;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: $bg-primary;
  border-radius: $radius-md;
}

.detail {
  @include flex-between;
  font-size: $font-size-sm;
}

.label { color: $text-secondary; }
.value {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.pet-select { @include input-base; padding: $spacing-md; }

.send-button {
  @include btn-base;
  @include btn-primary;
  padding: $spacing-md;
  width: 100%;

  &:disabled { opacity: 0.5; }
}
</style>
