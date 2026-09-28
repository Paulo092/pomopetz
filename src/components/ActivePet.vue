<template>
  <div class="active-pet">
    <h3 class="pet-title">Seu Pet</h3>
    <div class="pet-container">
      <div v-if="pet" class="pet-card">
        <div class="pet-emoji">{{ pet.emoji }}</div>
        <div class="pet-name">{{ pet.name }}</div>
        <div class="pet-info">
          <span class="rarity" :class="pet.rarity">{{ rarityLabel }}</span>
        </div>
      </div>
      <div v-else class="pet-empty">
        <div class="empty-message">
          <p>Nenhum pet selecionado</p>
          <p class="text-small">Compre um pet na loja para começar!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: { type: Object, default: null }
})

const rarityLabel = computed(() => {
  const labels = {
    common: 'Comum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário'
  }
  return labels[props.pet?.rarity] || 'Desconhecido'
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.active-pet {
  @include card;
  @include flex-column;
  gap: $spacing-lg;
}

.pet-title {
  margin: 0;
  font-size: $font-size-lg;
  color: $text-primary;
}

.pet-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.pet-card {
  @include flex-column;
  @include flex-center;
  gap: $spacing-md;
  background: linear-gradient(135deg, rgba($primary-color, 0.1), rgba($primary-light, 0.1));
  border: 2px solid $primary-light;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  text-align: center;
  transition: transform $transition-base;

  &:hover {
    transform: scale(1.05);
  }
}

.pet-emoji {
  font-size: 4rem;
  line-height: 1;
}

.pet-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $text-primary;
}

.pet-info {
  @include flex-center;
  gap: $spacing-md;
  width: 100%;
}

.rarity {
  display: inline-block;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-full;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.common { background-color: rgba($text-secondary, 0.2); color: $text-secondary; }
  &.rare { background-color: rgba($info-color, 0.2); color: $info-color; }
  &.epic { background-color: rgba($primary-color, 0.2); color: $primary-color; }
  &.legendary { background-color: rgba($warning-color, 0.2); color: $warning-color; }
}

.pet-empty {
  @include flex-center;
  width: 100%;
  min-height: 200px;
  text-align: center;
  color: $text-tertiary;
}

.empty-message {
  @include flex-column;
  gap: $spacing-md;
}

.text-small {
  font-size: $font-size-sm;
  margin: 0;
  opacity: 0.8;
}
</style>
