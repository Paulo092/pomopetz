<template>
  <BaseDialog
    :open="open"
    :title="view === 'name' ? 'Bem-vindo ao Pomopetz!' : 'Restaurar backup'"
    :icon="view === 'name' ? '🐣' : '💾'"
    tone="warning"
    width="440px"
    :dismissable="false"
  >
    <!-- Passo principal: nome -->
    <form v-if="view === 'name'" class="welcome" @submit.prevent="finish">
      <p class="intro">
        Foque com a técnica Pomodoro, ganhe moedas e colecione pets. 🍅🐾
      </p>

      <label for="welcome-name" class="label">Como podemos te chamar?</label>
      <input
        id="welcome-name"
        v-model="name"
        class="name-input"
        type="text"
        :maxlength="NAME_MAX_LENGTH"
        autocomplete="given-name"
        placeholder="Seu nome ou apelido"
        autofocus
      />
      <p class="hint">É opcional e fica salvo só neste navegador. Dá para mudar depois nas configurações.</p>

      <button type="submit" class="finish" :class="{ filled: hasTyped }">
        {{ hasTyped ? 'Pronto!' : 'Prefiro não informar' }}
      </button>

      <button type="button" class="link" @click="view = 'restore'">
        💾 Já usei o Pomopetz e tenho um backup
      </button>
    </form>

    <!-- Alternativa: restaurar backup -->
    <div v-else class="welcome">
      <BackupPanel import-only />
      <button type="button" class="link" @click="view = 'name'">← Voltar</button>
    </div>
  </BaseDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseDialog from './BaseDialog.vue'
import BackupPanel from './BackupPanel.vue'
import { NAME_MAX_LENGTH, sanitizeName } from '../composables/useProfile'

defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['done'])

const view = ref('name') // 'name' | 'restore'
const name = ref('')

const hasTyped = computed(() => sanitizeName(name.value).length > 0)

const finish = () => emit('done', sanitizeName(name.value))
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.welcome {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
}

.intro {
  font-size: $font-size-base;
  color: $ink-soft;
}

.label {
  margin-top: 0.25rem;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-lg;
  color: $ink;
}

.name-input {
  @include input-base;
  width: 100%;
  text-align: center;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-xl;

  &::placeholder { color: $ink-faint; font-weight: 500; }
}

.hint {
  font-size: $font-size-xs;
  color: $ink-faint;
}

.finish {
  @include chunky-btn($surface, $surface-3, $ink);
  margin-top: 0.25rem;
  padding: 0.85em 1.2em;
  font-size: $font-size-lg;

  &.filled {
    @include chunky-btn($tomato, $tomato-deep);
    margin-top: 0.25rem;
    padding: 0.85em 1.2em;
    font-size: $font-size-lg;
    animation: pp-pop-in 260ms $ease-bounce;
  }
}

.link {
  align-self: center;
  padding: 0.35rem 0.5rem;
  font-weight: 800;
  font-size: $font-size-sm;
  color: $ink-soft;
  text-decoration: underline;
  text-underline-offset: 3px;
  border-radius: $radius-sm;

  &:hover { color: $ink; }
}
</style>
