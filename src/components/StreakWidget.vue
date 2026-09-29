<template>
  <div class="streak-widget">
    <h3 class="widget-title">🔥 Ofensiva Diária</h3>
    <div class="streak-info">
      <div class="streak-number">{{ currentStreak }}</div>
      <p class="streak-text">dias seguidos</p>
    </div>

    <div v-if="nextPetProgress.pet" class="next-pet-section">
      <div class="progress-info">
        <p class="progress-label">Próximo Pet:</p>
        <div class="pet-preview">
          <span class="pet-emoji">{{ nextPetProgress.pet.emoji }}</span>
          <span class="pet-name">{{ nextPetProgress.pet.name }}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: nextPetProgress.percent + '%' }"></div>
      </div>
      <p class="progress-text">
        {{ nextPetProgress.current }} / {{ nextPetProgress.required }} dias
      </p>
    </div>

    <div v-else class="all-unlocked">
      <p>🏆 Todos os pets de ofensiva desbloqueados!</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStreak: { type: Number, default: 0 },
  nextPetProgress: { type: Object, default: () => ({ current: 0, required: 0, pet: null, percent: 0 }) }
})
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.streak-widget {
  @include card;
  @include flex-column;
  gap: $spacing-lg;
  background: linear-gradient(135deg, rgba($warning-color, 0.05), rgba($danger-color, 0.05));
  border: 2px solid $warning-color;
}

.widget-title {
  margin: 0;
  font-size: $font-size-lg;
  color: $text-primary;
}

.streak-info {
  text-align: center;
  padding: $spacing-lg;
  background-color: rgba($warning-color, 0.1);
  border-radius: $radius-lg;
}

.streak-number {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  color: $warning-color;
  line-height: 1;
}

.streak-text {
  margin: $spacing-sm 0 0;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.next-pet-section {
  @include flex-column;
  gap: $spacing-md;
}

.progress-info {
  @include flex-column;
  gap: $spacing-sm;
}

.progress-label {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $text-secondary;
}

.pet-preview {
  @include flex-center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: $bg-tertiary;
  border-radius: $radius-md;
}

.pet-emoji {
  font-size: $font-size-2xl;
}

.pet-name {
  font-weight: $font-weight-semibold;
  color: $text-primary;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: $bg-tertiary;
  border-radius: $radius-full;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $warning-color, $danger-color);
  transition: width $transition-base;
}

.progress-text {
  margin: 0;
  text-align: center;
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.all-unlocked {
  text-align: center;
  padding: $spacing-lg;
  background-color: rgba($success-color, 0.1);
  border-radius: $radius-lg;
  color: $success-color;
  font-weight: $font-weight-semibold;

  p {
    margin: 0;
  }
}
</style>
