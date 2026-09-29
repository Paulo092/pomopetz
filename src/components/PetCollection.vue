<template>
  <section class="album">
    <h2 class="ribbon">📖 Coleção</h2>

    <div class="album-top">
      <div class="tabs" role="tablist" aria-label="Categorias da coleção">
        <button
          v-for="cat in categories"
          :key="cat.id"
          role="tab"
          class="tab"
          :class="[cat.id, { active: activeCategory === cat.id }]"
          :aria-selected="activeCategory === cat.id"
          @click="activeCategory = cat.id"
        >
          <span aria-hidden="true">{{ cat.icon }}</span>
          {{ cat.label }}
          <span class="tab-count">{{ ownedCount(cat.id) }}/{{ cat.pets.length }}</span>
        </button>
      </div>

      <div class="completion" :aria-label="`${totalOwned} de ${totalPets} pets coletados`">
        <div class="completion-bar">
          <div class="completion-fill" :style="{ width: (totalOwned / totalPets) * 100 + '%' }"></div>
        </div>
        <span class="completion-text">{{ totalOwned }}/{{ totalPets }}</span>
      </div>
    </div>

    <p class="hint">{{ currentCategory.hint }}</p>

    <ul class="grid">
      <li v-for="pet in currentCategory.pets" :key="pet.id">
        <button
          class="slot"
          :class="[pet.rarity, {
            locked: !isOwned(pet),
            equipped: rewards.activePetId === pet.id,
            away: isAway(pet.id)
          }]"
          :disabled="!isOwned(pet) || isAway(pet.id)"
          :aria-label="slotLabel(pet)"
          @click="selectPet(pet.id)"
        >
          <span class="slot-art">
            <span class="slot-emoji" aria-hidden="true">{{ pet.emoji }}</span>
            <span v-if="isOwned(pet) && rewards.activePetId === pet.id" class="slot-flag">Equipado</span>
            <span v-else-if="isAway(pet.id)" class="slot-flag away-flag">🧳 Viajando</span>
          </span>

          <span class="slot-name">{{ isOwned(pet) ? pet.name : '???' }}</span>
          <span class="slot-sub">{{ isOwned(pet) ? rarityLabel(pet.rarity) : lockHint(pet) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  rewards: { type: Object, required: true },
  streak: { type: Object, required: true },
  excursion: { type: Object, default: null }
})

const emit = defineEmits(['pet-selected'])

const RARITY_LABELS = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' }
const rarityLabel = (r) => RARITY_LABELS[r]

const activeCategory = ref('shop')

const categories = computed(() => [
  {
    id: 'shop',
    icon: '🏪',
    label: 'Loja',
    pets: props.rewards.SHOP_PETS,
    hint: 'Compre com moedas ganhas nos ciclos de foco.'
  },
  {
    id: 'streak',
    icon: '🔥',
    label: 'Ofensiva',
    pets: props.streak.STREAK_PETS,
    hint: 'Exclusivos de perseverança: mantenha a chama acesa por vários dias.'
  },
  {
    id: 'excursion',
    icon: '🗺️',
    label: 'Excursão',
    pets: props.excursion?.EXCURSION_PETS || [],
    hint: 'Encontrados por sorte quando seus pets voltam de excursões.'
  }
])

const currentCategory = computed(() =>
  categories.value.find(c => c.id === activeCategory.value)
)

const isOwned = (pet) =>
  props.rewards.hasPet(pet.id) || (props.streak.hasStreakPet?.(pet.id) ?? false)

const isAway = (petId) =>
  !!props.excursion?.activeExcursions?.some(e => e.petId === petId && !e.claimed)

const ownedCount = (catId) =>
  categories.value.find(c => c.id === catId).pets.filter(isOwned).length

const totalPets = computed(() => categories.value.reduce((n, c) => n + c.pets.length, 0) || 1)
const totalOwned = computed(() => categories.value.reduce((n, c) => n + c.pets.filter(isOwned).length, 0))

const lockHint = (pet) => {
  if (pet.price) return `🪙 ${pet.price}`
  if (pet.streakRequired) return `🔥 ${pet.streakRequired} dias`
  const region = pet.regions?.[0]
  const cfg = region && props.excursion?.EXCURSION_CONFIG?.[region]
  return cfg ? `${cfg.emoji} ${cfg.name}` : 'Bloqueado'
}

const slotLabel = (pet) => {
  if (!isOwned(pet)) return `Pet bloqueado. ${lockHint(pet)}`
  if (isAway(pet.id)) return `${pet.name} está em excursão`
  return props.rewards.activePetId === pet.id ? `${pet.name}, equipado` : `Equipar ${pet.name}`
}

const selectPet = (petId) => {
  if (props.rewards.activePetId === petId) return
  if (props.rewards.setActivePet(petId)) {
    emit('pet-selected', petId)
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.album {
  @include panel($spacing-2xl $spacing-md $spacing-lg);
  @include stitched;

  @include md-up { padding: $spacing-2xl $spacing-xl $spacing-xl; }
}

.ribbon { @include ribbon($grape, $grape-deep); }

.album-top {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
}

// ---------- Abas ----------
.tabs {
  @include well($radius-full);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.35rem;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-sm;
  color: $ink-soft;
  border: $border-width solid transparent;
  border-radius: $radius-full;
  transition: color $transition-base, transform $transition-fast;

  &:hover:not(.active) { color: $ink; transform: translateY(-1px); }

  &.active {
    --t: #{$grape};
    --t-deep: #{$grape-deep};
    color: $ink-on-color;
    background: var(--t);
    border-color: $outline;
    box-shadow: inset 0 -3px 0 var(--t-deep), 0 2px 0 $outline;
  }

  &.shop.active { --t: #{$sun}; --t-deep: #{$sun-deep}; }
  &.streak.active { --t: #{$tomato}; --t-deep: #{$tomato-deep}; }
  &.excursion.active { --t: #{$mint}; --t-deep: #{$mint-deep}; }
}

.tab-count {
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-xs;
  opacity: 0.75;
}

// ---------- Progresso total ----------
.completion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 11rem;
  flex: 0 1 16rem;
}

.completion-bar {
  flex: 1;
  @include progress-track(1.1rem);
}

.completion-fill { @include progress-fill($grape, $grape-deep); }

.completion-text {
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-sm;
}

.hint {
  position: relative;
  z-index: 1;
  margin: $spacing-md 0 $spacing-lg;
  font-size: $font-size-sm;
  color: $ink-soft;
}

// ---------- Grade de slots ----------
.grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: $spacing-md;

  @include md-up { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

.slot {
  @include rarity-vars;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.5rem 0.75rem;
  text-align: center;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  box-shadow: 0 $ledge 0 $outline;
  transition: transform $transition-base $ease-bounce, box-shadow $transition-fast;
  animation: pp-pop-in 320ms $ease-bounce both;

  &:hover:not(:disabled) { transform: translateY(-4px); }
  &:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 $outline; }

  &.equipped {
    background: color-mix(in srgb, var(--r) 22%, var(--pp-surface));
    box-shadow: 0 $ledge 0 $outline, 0 0 0 4px var(--r);
  }

  &.locked {
    cursor: default;
    background: $surface-2;
    border-style: dashed;
    box-shadow: none;
  }

  &.away { cursor: default; }
}

.slot-art {
  position: relative;
  @include flex-center;
  width: 100%;
  aspect-ratio: 1;
  background:
    radial-gradient(circle at 50% 60%, rgba(255, 255, 255, 0.55), transparent 60%),
    var(--r);
  border: $border-width solid $outline;
  border-radius: $radius-md;
  box-shadow: inset 0 -5px 0 var(--r-deep);

  .locked & {
    background: $surface-3;
    box-shadow: none;
    border-style: dashed;
  }
}

.slot-emoji {
  font-size: 3rem;
  line-height: 1;
  filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.18));

  .slot:hover:not(:disabled) & { animation: pp-wiggle 500ms ease-in-out; }

  // silhueta dos bloqueados
  .locked & { @include silhouette; }

  .away & { opacity: 0.45; }
}

.slot-flag {
  position: absolute;
  bottom: -0.7rem;
  left: 50%;
  translate: -50% 0;
  @include chip($mint, $ink-on-color);
  box-shadow: inset 0 -2px 0 $mint-deep;
  white-space: nowrap;
  font-size: 0.65rem;

  &.away-flag {
    background: $sky;
    box-shadow: inset 0 -2px 0 $sky-deep;
  }
}

.slot-name {
  margin-top: 0.55rem;
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-base;
  line-height: 1.1;
  color: $ink;

  .locked & { color: $ink-faint; letter-spacing: 0.2em; }
}

.slot-sub {
  font-size: $font-size-xs;
  font-weight: 800;
  color: $ink-soft;
}
</style>
