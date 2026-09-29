<template>
  <section class="streak" :class="{ off: currentStreak === 0 }">
    <h2 class="ribbon">🔥 Ofensiva</h2>

    <div class="flame-row">
      <div class="flame" aria-hidden="true">
        <span class="flame-emoji">🔥</span>
        <span class="flame-count">{{ currentStreak }}</span>
      </div>

      <div class="flame-text">
        <p class="headline">
          <template v-if="currentStreak === 0">Chama apagada</template>
          <template v-else>{{ currentStreak }} {{ currentStreak === 1 ? 'dia' : 'dias' }} seguidos!</template>
        </p>
        <p class="sub">
          <template v-if="currentStreak === 0">Conclua 1 foco hoje para acender.</template>
          <template v-else>Recorde: {{ longestStreak }} {{ longestStreak === 1 ? 'dia' : 'dias' }}</template>
        </p>
      </div>
    </div>

    <div v-if="nextPetProgress.pet" class="goal">
      <div class="goal-head">
        <span class="mystery" aria-hidden="true"><span class="mystery-emoji">{{ nextPetProgress.pet.emoji }}</span></span>
        <div>
          <p class="goal-title">Pet misterioso</p>
          <p class="goal-sub">
            faltam <strong>{{ daysLeft }}</strong> {{ daysLeft === 1 ? 'dia' : 'dias' }}
          </p>
        </div>
      </div>

      <div
        class="bar"
        role="progressbar"
        :aria-valuenow="nextPetProgress.current"
        aria-valuemin="0"
        :aria-valuemax="nextPetProgress.required"
        :aria-label="`Progresso da ofensiva: ${nextPetProgress.current} de ${nextPetProgress.required} dias`"
      >
        <div class="bar-fill" :style="{ width: (nextPetProgress.percent || 0) + '%' }"></div>
        <span class="bar-text">{{ nextPetProgress.current }} / {{ nextPetProgress.required }}</span>
      </div>
    </div>

    <p v-else class="all-done">🏆 Todos os pets de ofensiva coletados!</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  nextPetProgress: {
    type: Object,
    default: () => ({ current: 0, required: 0, pet: null, percent: 0 })
  }
})

const daysLeft = computed(() =>
  Math.max(0, props.nextPetProgress.required - props.nextPetProgress.current)
)
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.streak {
  @include panel($spacing-xl $spacing-md $spacing-md);
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.ribbon { @include ribbon($tomato, $tomato-deep); }

.flame-row {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.flame {
  position: relative;
  flex-shrink: 0;
  @include flex-center;
  width: 5rem;
  height: 5rem;
  background: color-mix(in srgb, #{$sun} 35%, transparent);
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: 0 $ledge-sm 0 $outline;

  .off & { background: $surface-2; }
}

.flame-emoji {
  font-size: 2.7rem;
  line-height: 1;
  animation: pp-flicker 1.1s ease-in-out infinite;
  transform-origin: 50% 90%;

  .off & { filter: grayscale(1) opacity(0.45); animation: none; }
}

.flame-count {
  position: absolute;
  right: -0.4rem;
  bottom: -0.4rem;
  @include flex-center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.35rem;
  font-family: $font-numbers;
  font-weight: 900;
  color: $ink-on-color;
  background: $sun;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  box-shadow: inset 0 -3px 0 $sun-deep;
}

.headline {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-xl;
  line-height: 1.2;
}

.sub {
  font-size: $font-size-sm;
  color: $ink-soft;
}

// ---------- Próximo pet ----------
.goal {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem;
  @include well;
}

.goal-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mystery {
  @include flex-center;
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-md;

}

.mystery-emoji {
  // silhueta: o pet só é revelado ao desbloquear
  @include silhouette;
}

.goal-title {
  font-family: $font-display;
  font-weight: 600;
}

.goal-sub {
  font-size: $font-size-sm;
  color: $ink-soft;

  strong { color: $tomato-deep; font-weight: 900; }
}

.bar { @include progress-track(1.5rem); }

.bar-fill { @include progress-fill($sun, $sun-deep); }

.bar-text {
  @include absolute-center;
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-xs;
  color: $ink;
  // contorno garante leitura sobre o trilho e sobre o preenchimento
  -webkit-text-stroke: 3px $surface;
  paint-order: stroke fill;
}

.all-done {
  padding: 0.75rem;
  text-align: center;
  font-family: $font-display;
  font-weight: 600;
  @include well;
}
</style>
