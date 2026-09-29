<template>
  <dialog
    ref="dialogEl"
    class="dialog"
    :class="`tone-${tone}`"
    :style="{ '--dialog-width': width }"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('close')"
    @click="onBackdropClick"
  >
    <div class="card">
      <span class="icon" aria-hidden="true">{{ icon }}</span>

      <h2 :id="titleId" class="title">{{ title }}</h2>

      <div class="body">
        <slot />
      </div>

      <div v-if="$slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

/**
 * Casca de popup no estilo do jogo, usada por todos os diálogos.
 * Usa <dialog> nativo: foco preso no popup, Esc fecha e o resto da
 * página fica inerte enquanto está aberto. Para escolher qual elemento
 * recebe o foco ao abrir, coloque `autofocus` nele.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  icon: { type: String, default: '💬' },
  // 'warning' | 'danger' | 'info' | 'grape'
  tone: { type: String, default: 'info' },
  width: { type: String, default: '460px' }
})

const emit = defineEmits(['close'])

const dialogEl = ref(null)
const titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`

const sync = (open) => {
  const el = dialogEl.value
  if (!el) return
  if (open && !el.open) el.showModal()
  else if (!open && el.open) el.close()
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

// Clique no fundo escurecido (fora do cartão) fecha
const onBackdropClick = (event) => {
  if (event.target === dialogEl.value) emit('close')
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.dialog {
  --tone: #{$sky};
  --tone-deep: #{$sky-deep};

  width: min(92vw, var(--dialog-width));
  max-height: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  overflow: visible;
  color: $ink;
  background: transparent;
  border: none;

  &.tone-warning { --tone: #{$sun}; --tone-deep: #{$sun-deep}; }
  &.tone-danger { --tone: #{$tomato}; --tone-deep: #{$tomato-deep}; }
  &.tone-grape { --tone: #{$grape}; --tone-deep: #{$grape-deep}; }

  &[open] { animation: pp-pop-in 320ms $ease-bounce both; }

  &::backdrop {
    background: rgba(30, 20, 14, 0.55);
    backdrop-filter: blur(3px);
    animation: pp-fade-in 200ms ease-out both;
  }
}

.card {
  @include panel($spacing-2xl $spacing-lg $spacing-lg);
  @include stitched;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  max-height: calc(100dvh - 4.5rem);
  margin-top: 2.2rem;
  text-align: center;
}

.icon {
  position: absolute;
  top: 0;
  left: 50%;
  // `translate` separado para não brigar com o `transform` da animação
  translate: -50% -55%;
  z-index: 2;
  @include flex-center;
  width: 4.2rem;
  height: 4.2rem;
  font-size: 2.2rem;
  background: var(--tone);
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 -5px 0 var(--tone-deep), 0 $ledge-sm 0 $outline;
  animation: pp-wiggle 700ms ease-in-out 200ms 2;
}

.title {
  position: relative;
  z-index: 1;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-2xl;
}

.body {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $ink-soft;

  :deep(strong) { color: $ink; }
  :deep(p + p) { margin-top: 0.5rem; }
}

.actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-sm $spacing-md;
  width: 100%;
  margin-top: $spacing-sm;

  > :deep(*) { flex: 1 1 10rem; }
}
</style>
