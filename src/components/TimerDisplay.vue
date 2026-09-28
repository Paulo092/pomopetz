<template>
  <div class="timer-display">
    <div class="timer-modes">
      <button
        v-for="mode in Object.values(pomodoro.MODES)"
        :key="mode"
        class="mode-button"
        :class="{ active: pomodoro.currentMode === mode }"
        @click="pomodoro.setMode(mode)"
      >
        {{ pomodoro.getModeLabel(mode) }}
      </button>
    </div>

    <div class="timer-clock">
      <div class="time-display">{{ pomodoro.formattedTime }}</div>
    </div>

    <div class="timer-controls">
      <button class="control-button start" :disabled="pomodoro.isRunning" @click="pomodoro.start()">
        ▶️ Iniciar
      </button>
      <button class="control-button pause" :disabled="!pomodoro.isRunning" @click="pomodoro.pause()">
        ⏸️ Pausar
      </button>
      <button class="control-button reset" @click="pomodoro.reset()">
        🔄 Resetar
      </button>
      <button class="control-button skip" @click="handleSkip()">
        ⏭️ Pular
      </button>
    </div>

    <div class="timer-status" :class="{ completed: pomodoro.timeRemaining === 0 && !pomodoro.isRunning }">
      <span v-if="pomodoro.isRunning" class="status-text">⏱️ Temporizador em execução...</span>
      <span v-else-if="pomodoro.timeRemaining === 0" class="status-text">✅ Ciclo completo! Parabéns!</span>
      <span v-else class="status-text">⏸️ Pausado</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pomodoro: { type: Object, required: true }
})

const emit = defineEmits(['focus-completed'])

const handleSkip = () => {
  const wasFocus = props.pomodoro.currentMode === props.pomodoro.MODES.FOCUS
  props.pomodoro.skip()
  if (wasFocus) emit('focus-completed')
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';
@import '../styles/mixins.scss';

.timer-display {
  @include flex-column;
  gap: $spacing-xl;
}

.timer-modes {
  @include flex-center;
  gap: $spacing-md;
  flex-wrap: wrap;
}

.mode-button {
  @include btn-base;
  background-color: $bg-tertiary;
  color: $text-primary;
  border: 2px solid transparent;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;

  &:hover:not(:disabled) {
    border-color: $primary-color;
  }

  &.active {
    background-color: $primary-color;
    color: white;
    border-color: $primary-color;
  }
}

.timer-clock {
  @include flex-center;
  padding: $spacing-2xl;
  background: linear-gradient(135deg, $primary-light, $primary-dark);
  border-radius: $radius-xl;
  color: white;
}

.time-display {
  font-size: 5rem;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  letter-spacing: $spacing-md;

  @include sm-up {
    font-size: 6rem;
  }
}

.timer-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;

  @include sm-up {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.control-button {
  @include btn-base;
  @include btn-primary;
  padding: $spacing-md;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.pause { background-color: $warning-color; }
  &.reset { background-color: $info-color; }
  &.skip { background-color: $success-color; }
}

.timer-status {
  text-align: center;
  padding: $spacing-lg;
  background-color: $bg-tertiary;
  border-radius: $radius-lg;
  font-weight: $font-weight-semibold;
  color: $text-secondary;

  &.completed {
    background-color: rgba($success-color, 0.1);
    color: $success-color;
  }
}
</style>
