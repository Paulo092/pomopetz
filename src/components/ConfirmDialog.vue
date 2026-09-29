<template>
  <BaseDialog
    :open="open"
    :title="title"
    :icon="icon"
    :tone="tone"
    @close="emit('cancel')"
  >
    <slot />

    <template #actions>
      <!-- autofocus: a opção segura recebe o foco ao abrir -->
      <button class="btn-cancel" autofocus @click="emit('cancel')">
        {{ cancelLabel }}
      </button>
      <button class="btn-confirm" :class="`tone-${tone}`" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </template>
  </BaseDialog>
</template>

<script setup>
import BaseDialog from './BaseDialog.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  icon: { type: String, default: '⚠️' },
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  // 'warning' | 'danger' | 'info'
  tone: { type: String, default: 'warning' }
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.btn-cancel { @include chunky-btn($mint, $mint-deep); }

.btn-confirm {
  @include chunky-btn($sun, $sun-deep);

  &.tone-danger { @include chunky-btn($tomato, $tomato-deep); }
  &.tone-info { @include chunky-btn($sky, $sky-deep); }
}
</style>
