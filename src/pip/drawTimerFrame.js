/**
 * Desenha o mini-timer num canvas (usado no PiP em modo vídeo).
 * Sem dependência do Vue: recebe os dados prontos.
 */

export const FRAME_WIDTH = 480
export const FRAME_HEIGHT = 270

const MODE_COLORS = {
  focus: ['#ff7a59', '#d9553a'],
  shortBreak: ['#5cc99a', '#35a273'],
  longBreak: ['#62b8e0', '#3a93be']
}

// Lê as cores do tema atual (dia/noite) das CSS custom properties
export function readThemeColors () {
  const css = getComputedStyle(document.documentElement)
  const get = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return {
    bg: get('--pp-bg', '#fff3e0'),
    surface: get('--pp-surface', '#fffdf7'),
    surface2: get('--pp-surface-2', '#fdf0dc'),
    ink: get('--pp-ink', '#4a3426'),
    inkSoft: get('--pp-ink-soft', '#7e6450'),
    outline: get('--pp-outline', '#4a3426')
  }
}

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ time: string, label: string, icon: string, mode: string,
 *           progress: number, running: boolean, petEmoji?: string }} data
 * @param {ReturnType<typeof readThemeColors>} colors
 */
export function drawTimerFrame (ctx, data, colors) {
  const W = FRAME_WIDTH
  const H = FRAME_HEIGHT
  const [modeColor, modeDeep] = MODE_COLORS[data.mode] || MODE_COLORS.focus
  const FONT_DISPLAY = 'Fredoka, Nunito, system-ui, sans-serif'
  const FONT_NUM = 'Nunito, system-ui, sans-serif'

  // Fundo
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, W, H)

  // Cartão com "degrau"
  ctx.fillStyle = colors.outline
  roundRect(ctx, 14, 20, W - 28, H - 32, 28)
  ctx.fill()
  ctx.fillStyle = colors.surface
  ctx.strokeStyle = colors.outline
  ctx.lineWidth = 5
  roundRect(ctx, 14, 12, W - 28, H - 32, 28)
  ctx.fill()
  ctx.stroke()

  // Etiqueta do modo
  ctx.font = `600 24px ${FONT_DISPLAY}`
  const chipText = `${data.icon} ${data.label}`
  const chipW = ctx.measureText(chipText).width + 36
  ctx.fillStyle = modeColor
  roundRect(ctx, 34, 30, chipW, 42, 21)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.fillStyle = '#3b2a1f'
  ctx.textBaseline = 'middle'
  ctx.fillText(chipText, 52, 52)

  // Pet
  if (data.petEmoji) {
    ctx.font = `46px ${FONT_NUM}`
    ctx.textAlign = 'right'
    ctx.fillText(data.petEmoji, W - 36, 54)
    ctx.textAlign = 'left'
  }

  // Tempo
  ctx.fillStyle = colors.ink
  ctx.font = `900 104px ${FONT_NUM}`
  ctx.textAlign = 'center'
  ctx.fillText(data.time, W / 2, 142)

  // Estado
  ctx.font = `700 20px ${FONT_NUM}`
  ctx.fillStyle = colors.inkSoft
  ctx.fillText(data.running ? 'em andamento' : '⏸ pausado', W / 2, 200)
  ctx.textAlign = 'left'

  // Barra de progresso
  const barX = 40
  const barY = 218
  const barW = W - 80
  const barH = 18
  ctx.fillStyle = colors.surface2
  roundRect(ctx, barX, barY, barW, barH, 9)
  ctx.fill()
  const fillW = Math.max(0, Math.min(1, data.progress)) * barW
  if (fillW > 0) {
    ctx.fillStyle = modeColor
    roundRect(ctx, barX, barY, Math.max(fillW, barH), barH, 9)
    ctx.fill()
    ctx.fillStyle = modeDeep
    ctx.fillRect(barX + 6, barY + barH - 5, Math.max(0, Math.max(fillW, barH) - 12), 3)
  }
  ctx.strokeStyle = colors.outline
  ctx.lineWidth = 4
  roundRect(ctx, barX, barY, barW, barH, 9)
  ctx.stroke()
}
