<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.tone"
        role="status"
        @click="$emit('dismiss', toast.id)"
      >
        <span class="toast-icon" aria-hidden="true">{{ toast.icon }}</span>
        <span class="toast-text">{{ toast.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
defineProps({
  toasts: { type: Array, default: () => [] }
})

defineEmits(['dismiss'])
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.toast-stack {
  position: fixed;
  top: $spacing-md;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  width: min(92vw, 420px);
  pointer-events: none;
}

.toast {
  --t: #{$sun};
  --t-deep: #{$sun-deep};

  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 0.65rem;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-base;
  color: $ink;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  box-shadow: 0 $ledge 0 $outline;
  pointer-events: auto;
  cursor: pointer;

  &.coins { --t: #{$sun}; --t-deep: #{$sun-deep}; }
  &.streak { --t: #{$tomato}; --t-deep: #{$tomato-deep}; }
  &.pet { --t: #{$grape}; --t-deep: #{$grape-deep}; }
  &.info { --t: #{$sky}; --t-deep: #{$sky-deep}; }
  &.success { --t: #{$mint}; --t-deep: #{$mint-deep}; }
}

.toast-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  font-size: 1.3rem;
  background: var(--t);
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 -3px 0 var(--t-deep);
}

.toast-text { line-height: 1.25; }

.toast-enter-active { animation: pp-pop-in 380ms $ease-bounce both; }
.toast-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.toast-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }
</style>
