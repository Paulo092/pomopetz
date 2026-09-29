<template>
  <div class="backup">
    <!-- Exportar -->
    <section class="box" aria-labelledby="export-heading">
      <h3 id="export-heading" class="box-title">📤 Exportar progresso</h3>
      <p class="box-text">
        Gere um código com <strong>todo o seu progresso</strong>: moedas, pets, ofensiva,
        excursões e configurações. Guarde-o num lugar seguro para recuperar depois
        ou continuar em outro navegador.
      </p>

      <p class="summary" aria-label="Progresso atual">
        <span>🪙 {{ current.coins }}</span>
        <span>🐾 {{ plural(current.pets, 'pet') }}</span>
        <span>🔥 {{ plural(current.streak, 'dia') }}</span>
        <span>🍅 {{ plural(current.focusCycles, 'ciclo') }}</span>
      </p>

      <button v-if="!exportCode" class="btn-grape" @click="generate">✨ Gerar código de backup</button>

      <template v-else>
        <label for="export-code" class="sr-only">Código de backup</label>
        <textarea
          id="export-code"
          ref="exportArea"
          class="code"
          :value="exportCode"
          rows="4"
          readonly
          spellcheck="false"
          @focus="$event.target.select()"
        ></textarea>
        <div class="row">
          <button class="btn-grape" @click="copy">{{ copied ? '✓ Copiado!' : '📋 Copiar' }}</button>
          <button class="btn-plain" @click="download">⬇️ Baixar .txt</button>
          <button class="btn-plain small" title="Gerar de novo com os dados atuais" @click="generate">🔄</button>
        </div>
      </template>
    </section>

    <!-- Importar -->
    <section class="box" aria-labelledby="import-heading">
      <h3 id="import-heading" class="box-title">📥 Restaurar progresso</h3>
      <p class="box-text">
        Cole um código de backup ou abra o arquivo <code>.txt</code>.
        <strong>O progresso atual será substituído.</strong>
      </p>

      <label for="import-code" class="sr-only">Código para restaurar</label>
      <textarea
        id="import-code"
        v-model="importCode"
        class="code"
        :class="{ invalid: error }"
        rows="4"
        spellcheck="false"
        placeholder="POMOPETZ1:..."
        :aria-invalid="!!error"
        aria-describedby="import-error"
        @input="error = ''"
      ></textarea>

      <p v-if="error" id="import-error" class="error" role="alert">⚠️ {{ error }}</p>

      <div class="row">
        <label class="btn-plain file">
          📂 Abrir arquivo
          <input type="file" accept=".txt,text/plain" class="sr-only" @change="loadFile" />
        </label>
        <button class="btn-danger" :disabled="!importCode.trim()" @click="validate">♻️ Restaurar</button>
      </div>
    </section>

    <ConfirmDialog
      :open="!!pending"
      icon="♻️"
      tone="danger"
      title="Substituir seu progresso?"
      confirm-label="Restaurar backup"
      cancel-label="Cancelar"
      @cancel="pending = null"
      @confirm="restore"
    >
      <template v-if="pending">
        <p>
          Backup<template v-if="pending.createdAt"> de <strong>{{ formatDate(pending.createdAt) }}</strong></template>:
        </p>
        <p class="summary">
          <span>🪙 {{ pendingSummary.coins }}</span>
          <span>🐾 {{ plural(pendingSummary.pets, 'pet') }}</span>
          <span>🔥 {{ plural(pendingSummary.streak, 'dia') }}</span>
          <span>🍅 {{ plural(pendingSummary.focusCycles, 'ciclo') }}</span>
        </p>
        <p>
          Seu progresso atual (🪙 {{ current.coins }} · 🐾 {{ plural(current.pets, 'pet') }} · 🔥 {{ plural(current.streak, 'dia') }})
          será <strong>apagado</strong>. Se quiser guardá-lo, exporte um backup antes.
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { CURRENT_VERSION } from '../composables/useDataMigration'
import {
  createBackup,
  parseBackup,
  applyBackup,
  collectData,
  summarizeData,
  BackupError,
  RESTORED_FLAG
} from '../utils/backup'

const current = ref(summarizeData(collectData()))

// ---------- Exportar ----------
const exportCode = ref('')
const exportArea = ref(null)
const copied = ref(false)

const generate = () => {
  current.value = summarizeData(collectData())
  exportCode.value = createBackup(CURRENT_VERSION)
  copied.value = false
}

const copy = async () => {
  try {
    await navigator.clipboard.writeText(exportCode.value)
  } catch {
    // Sem permissão de área de transferência: seleciona para o usuário copiar
    exportArea.value?.select()
    document.execCommand?.('copy')
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const download = () => {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([exportCode.value + '\n'], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pomopetz-backup-${date}.txt`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- Importar ----------
const importCode = ref('')
const error = ref('')
const pending = ref(null)

const pendingSummary = computed(() => pending.value ? summarizeData(pending.value.data) : null)

const loadFile = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (file.size > 1_000_000) {
    error.value = 'Esse arquivo é grande demais para ser um backup do Pomopetz.'
    return
  }
  importCode.value = (await file.text()).trim()
  error.value = ''
}

const validate = () => {
  try {
    current.value = summarizeData(collectData())
    pending.value = parseBackup(importCode.value, CURRENT_VERSION)
  } catch (e) {
    error.value = e instanceof BackupError ? e.message : 'Não foi possível ler esse backup.'
  }
}

const restore = () => {
  applyBackup(pending.value)
  try { sessionStorage.setItem(RESTORED_FLAG, '1') } catch {}
  // Recarrega para todos os composables lerem os dados restaurados
  window.location.reload()
}

const plural = (n, word) => `${n} ${n === 1 ? word : word + 's'}`

const formatDate = (date) =>
  date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.backup {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  text-align: left;
}

.box {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem;
  @include well;
}

.box-title {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-lg;
  color: $ink;
}

.box-text {
  font-size: $font-size-sm;

  code {
    font-family: $font-numbers;
    font-weight: 800;
    color: $ink;
  }
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  span {
    @include chip($surface, $ink);
    font-size: $font-size-xs;
    text-transform: none;
    letter-spacing: 0;
  }
}

.code {
  width: 100%;
  resize: vertical;
  padding: 0.65rem 0.8rem;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  word-break: break-all;
  color: $ink;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-md;

  &:focus-visible { outline: 3px solid $sun; outline-offset: 2px; }
  &::placeholder { color: $ink-faint; }

  &.invalid { border-color: $tomato-deep; }
}

.error {
  font-weight: 800;
  font-size: $font-size-sm;
  color: $tomato-deep;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  > * { flex: 1 1 auto; }
}

.btn-grape { @include chunky-btn($grape, $grape-deep); padding: 0.6em 1.1em; font-size: $font-size-sm; }
.btn-danger { @include chunky-btn($tomato, $tomato-deep); padding: 0.6em 1.1em; font-size: $font-size-sm; }
.btn-plain { @include chunky-btn($surface, $surface-3, $ink); padding: 0.6em 1.1em; font-size: $font-size-sm; }

.small { flex: 0 0 auto; }

.file {
  cursor: pointer;

  &:focus-within { outline: 3px solid $sun; outline-offset: 2px; }
}
</style>
