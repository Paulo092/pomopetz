<template>
  <dialog
    ref="dialogEl"
    class="dialog"
    :class="`tone-${tone}`"
    :aria-labelledby="titleId"
    @cancel.prevent="emit('cancel')"
    @click="onBackdropClick"
  >
    <div class="card">
      <span class="icon" aria-hidden="true">{{ icon }}</span>

      <h2 :id="titleId" class="title">{{ title }}</h2>

      <div class="message">
        <slot />
      </div>

      <div class="actions">
        <button ref="cancelBtn" class="btn-cancel" @click="emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button class="btn-confirm" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

/**
 * Popup de confirmação no estilo do jogo.
 * Usa <dialog> nativo: foco preso no popup, Esc fecha e o resto da
 * página fica inerte enquanto está aberto.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  icon: { type: String, default: '⚠️' },
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  // 'warning' | 'danger' | 'info'
  tone: { type: String, default: 'warning' }
})

const emit = defineEmits(['confirm', 'cancel'])

const dialogEl = ref(null)
const cancelBtn = ref(null)
const titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`

const sync = async (open) => {
  const el = dialogEl.value
  if (!el) return
  if (open && !el.open) {
    el.showModal()
    await nextTick()
    // Foco na opção segura por padrão
    cancelBtn.value?.focus()
  } else if (!open && el.open) {
    el.close()
  }
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

// Clique fora do cartão (no fundo escurecido) = cancelar
const onBackdropClick = (event) => {
  if (event.target === dialogEl.value) emit('cancel')
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.dialog {
  --tone: #{$sun};
  --tone-deep: #{$sun-deep};

  width: min(92vw, 460px);
  margin: auto;
  padding: 0;
  overflow: visible;
  color: $ink;
  background: transparent;
  border: none;

  &.tone-danger { --tone: #{$tomato}; --tone-deep: #{$tomato-deep}; }
  &.tone-info { --tone: #{$sky}; --tone-deep: #{$sky-deep}; }

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

.message {
  position: relative;
  z-index: 1;
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

  > * { flex: 1 1 10rem; }
}

.btn-cancel { @include chunky-btn($mint, $mint-deep); }
.btn-confirm { @include chunky-btn(var(--tone), var(--tone-deep)); }
</style>
