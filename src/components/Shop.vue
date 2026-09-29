<template>
  <section class="shop">
    <h2 class="ribbon">🏪 Loja de Pets</h2>

    <div class="shop-header">
      <span class="keeper" aria-hidden="true">🦝</span>
      <p class="keeper-line">
        Bem-vindo{{ nameSuffix }}! Cada foco concluído rende <strong>🪙 25</strong>. O que vai levar hoje?
      </p>
      <div class="wallet">
        <span class="wallet-icon" aria-hidden="true">🪙</span>
        <span class="wallet-value">{{ rewards.coins }}</span>
      </div>
    </div>

    <ul class="grid">
      <li
        v-for="pet in rewards.SHOP_PETS"
        :key="pet.id"
        class="item"
        :class="[pet.rarity, { owned: rewards.hasPet(pet.id), poor: !rewards.hasPet(pet.id) && !rewards.canBuy(pet.id) }]"
      >
        <div class="item-art">
          <span class="item-emoji" aria-hidden="true">{{ pet.emoji }}</span>
          <span class="item-rarity">{{ rarityLabel(pet.rarity) }}</span>
          <span v-if="rewards.hasPet(pet.id)" class="stamp">Adquirido</span>
        </div>

        <h3 class="item-name">{{ pet.name }}</h3>

        <button
          v-if="!rewards.hasPet(pet.id)"
          class="buy"
          :disabled="!rewards.canBuy(pet.id)"
          :aria-label="`Comprar ${pet.name} por ${pet.price} moedas`"
          @click="buyPet(pet.id)"
        >
          <span aria-hidden="true">🪙</span> {{ pet.price }}
        </button>
        <p v-else class="owned-note">✓ Na coleção</p>

        <p v-if="!rewards.hasPet(pet.id) && !rewards.canBuy(pet.id)" class="missing">
          faltam {{ pet.price - rewards.coins }}
        </p>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { useProfile } from '../composables/useProfile'

const props = defineProps({
  rewards: { type: Object, required: true }
})

const emit = defineEmits(['pet-purchased'])

const { nameSuffix } = useProfile()

const RARITY_LABELS = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' }
const rarityLabel = (rarity) => RARITY_LABELS[rarity]

const buyPet = (petId) => {
  if (props.rewards.buyPet(petId)) {
    emit('pet-purchased', petId)
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;
@use '../styles/mixins' as *;

.shop {
  @include panel($spacing-2xl $spacing-md $spacing-lg);
  @include stitched;

  @include md-up { padding: $spacing-2xl $spacing-xl $spacing-xl; }
}

.ribbon { @include ribbon($sun, $sun-deep); }

// ---------- Balcão ----------
.shop-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  @include well;
  flex-wrap: wrap;
}

.keeper {
  font-size: 2.4rem;
  line-height: 1;
  animation: pp-bob 2.2s ease-in-out infinite;
}

.keeper-line {
  flex: 1;
  min-width: 12rem;
  font-size: $font-size-sm;
  color: $ink-soft;

  strong { color: $ink; white-space: nowrap; }
}

.wallet {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 1rem 0.25rem 0.25rem;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-full;
  box-shadow: 0 $ledge-sm 0 $outline;
}

.wallet-icon {
  @include flex-center;
  width: 2.2rem;
  height: 2.2rem;
  background: $sun;
  border: $border-width solid $outline;
  border-radius: 50%;
  box-shadow: inset 0 -3px 0 $sun-deep;
}

.wallet-value {
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-xl;
  font-variant-numeric: tabular-nums;
}

// ---------- Vitrine ----------
.grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: $spacing-lg $spacing-md;
}

.item {
  @include rarity-vars;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.6rem 0.9rem;
  text-align: center;
  background: $surface;
  border: $border-width solid $outline;
  border-radius: $radius-lg;
  box-shadow: 0 $ledge 0 $outline;
  transition: transform $transition-base $ease-bounce;
  animation: pp-slide-up 320ms $ease-bounce both;

  @for $i from 1 through 8 {
    &:nth-child(#{$i}) { animation-delay: #{($i - 1) * 45}ms; }
  }

  &:hover { transform: translateY(-4px) rotate(-0.6deg); }
}

.item-art {
  position: relative;
  @include flex-center;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 65%, rgba(255, 255, 255, 0.55), transparent 55%),
    var(--r);
  border: $border-width solid $outline;
  border-radius: $radius-md;
  box-shadow: inset 0 -5px 0 var(--r-deep);

  // reflexo que atravessa os cards lendários
  .legendary &::after {
    content: '';
    position: absolute;
    top: -20%;
    left: 0;
    width: 30%;
    height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
    animation: pp-shine 2.8s ease-in-out infinite;
  }
}

.item-emoji {
  font-size: 3.6rem;
  line-height: 1;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.18));
  transition: transform $transition-base $ease-bounce;

  .item:hover & { transform: scale(1.12) rotate(-6deg); }
}

.item-rarity {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  @include chip($surface, $ink);
  font-size: 0.65rem;
  padding: 0.25em 0.6em;
}

.stamp {
  position: absolute;
  bottom: 0.5rem;
  right: -0.2rem;
  padding: 0.2rem 0.6rem;
  font-family: $font-display;
  font-weight: 700;
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $mint-deep;
  background: #fff;
  border: 2px solid $mint-deep;
  border-radius: $radius-sm;
  transform: rotate(-10deg);
  animation: pp-pop-in 300ms $ease-bounce both;
}

.item-name {
  font-family: $font-display;
  font-weight: 600;
  font-size: $font-size-lg;
  line-height: 1.1;
}

.buy {
  @include chunky-btn($sun, $sun-deep);
  width: 100%;
  font-family: $font-numbers;
  font-weight: 900;
  font-size: $font-size-lg;
}

.owned-note {
  font-family: $font-display;
  font-weight: 600;
  color: $mint-deep;
  padding: 0.55rem 0;
}

.missing {
  margin-top: -0.3rem;
  font-size: $font-size-xs;
  color: $ink-faint;
}

.owned .item-art { filter: saturate(0.85); }
</style>
