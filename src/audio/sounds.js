/**
 * Sons do Pomopetz, sintetizados com a Web Audio API.
 * Não há arquivos de áudio: tudo é gerado na hora (zero download,
 * sem problemas de licença e funciona offline).
 *
 * Este módulo não depende do Vue — só recebe um AudioContext.
 */

export const SOUND_OPTIONS = [
  {
    id: 'bell',
    icon: '🔔',
    name: 'Sino',
    description: 'Clássico e bem audível, com duas badaladas.'
  },
  {
    id: 'chime',
    icon: '🎐',
    name: 'Suave',
    description: 'Notas delicadas de mensageiro do vento.'
  },
  {
    id: 'retro',
    icon: '👾',
    name: 'Retrô',
    description: 'Jingle 8-bit de fase concluída.'
  }
]

export const DEFAULT_SOUND_ID = 'bell'

/**
 * Toca uma nota com envelope de ataque/decaimento.
 */
function tone (ctx, destination, {
  freq,
  start,
  duration,
  type = 'sine',
  gain = 0.3,
  attack = 0.005
}) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(env).connect(destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

// Sino: parciais inarmônicos (característicos de sinos) com decaimento longo
function bell (ctx, out, t) {
  // Nível ajustado para o sino não soar bem mais alto que os outros sons
  const BELL_LEVEL = 0.55
  const PARTIALS = [
    [1, 0.5],
    [2, 0.28],
    [2.76, 0.2],
    [5.4, 0.1],
    [8.93, 0.05]
  ]
  const strike = (at, fundamental) => {
    PARTIALS.forEach(([ratio, amp], i) => {
      tone(ctx, out, {
        freq: fundamental * ratio,
        start: at,
        duration: 2.4 - i * 0.35,
        gain: amp * BELL_LEVEL,
        attack: 0.003
      })
    })
  }
  strike(t, 660)
  strike(t + 0.75, 660)
  return 3.2
}

// Suave: arpejo de notas senoidais baixinhas, passando por um filtro
function chime (ctx, out, t) {
  const soft = ctx.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 2600
  soft.connect(out)

  const NOTES = [659.25, 783.99, 987.77, 1318.51] // Mi5, Sol5, Si5, Mi6
  NOTES.forEach((freq, i) => {
    tone(ctx, soft, {
      freq,
      start: t + i * 0.2,
      duration: 1.6,
      type: 'triangle',
      gain: 0.22,
      attack: 0.03
    })
  })
  return 2.6
}

// Retrô: arpejo rápido em onda quadrada, estilo videogame 8-bit
function retro (ctx, out, t) {
  const STEP = 0.09
  const NOTES = [523.25, 659.25, 783.99, 1046.5] // Dó5, Mi5, Sol5, Dó6
  NOTES.forEach((freq, i) => {
    tone(ctx, out, { freq, start: t + i * STEP, duration: STEP * 0.95, type: 'square', gain: 0.2 })
  })
  const end = t + NOTES.length * STEP + 0.06
  tone(ctx, out, { freq: 1046.5, start: end, duration: 0.42, type: 'square', gain: 0.2 })
  tone(ctx, out, { freq: 1318.51, start: end, duration: 0.42, type: 'square', gain: 0.1 })
  return end - t + 0.5
}

const SYNTHS = { bell, chime, retro }

/**
 * Agenda o som `id` em `destination` a partir do tempo `when` do contexto.
 * Retorna a duração aproximada em segundos.
 */
export function scheduleSound (ctx, destination, id, when = ctx.currentTime) {
  const synth = SYNTHS[id] || SYNTHS[DEFAULT_SOUND_ID]
  return synth(ctx, destination, when)
}
