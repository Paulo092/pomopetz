import { ref, shallowRef, computed } from 'vue'

/**
 * Janela flutuante (Picture-in-Picture) que fica por cima de outros apps.
 *
 * Duas estratégias, da melhor para a mais compatível:
 *  1. Document Picture-in-Picture (Chrome/Edge 116+): abre uma mini janela
 *     com HTML de verdade. O Vue renderiza o conteúdo lá via <Teleport>,
 *     então os botões funcionam normalmente.
 *  2. Vídeo Picture-in-Picture (Safari e outros): o timer é desenhado num
 *     <canvas>, transmitido como vídeo e aberto em PiP. Os controles de
 *     play/pause da janela são ligados ao timer pela Media Session API.
 *
 * O estado fica no escopo do módulo: só existe uma janela PiP por vez.
 */

const supportsDocument =
  typeof window !== 'undefined' && 'documentPictureInPicture' in window

const supportsVideo =
  typeof document !== 'undefined' &&
  !!document.pictureInPictureEnabled &&
  typeof HTMLCanvasElement !== 'undefined' &&
  'captureStream' in HTMLCanvasElement.prototype

const mode = ref(null) // 'document' | 'video' | null
const documentBody = shallowRef(null) // alvo do <Teleport> no modo documento

let pipWindow = null
let themeObserver = null
let videoEl = null
let stream = null

// ---------- Modo documento ----------

// Copia as folhas de estilo da página para a janela PiP
const copyStyles = (targetDoc) => {
  for (const sheet of document.styleSheets) {
    try {
      const css = [...sheet.cssRules].map(rule => rule.cssText).join('\n')
      const style = targetDoc.createElement('style')
      style.textContent = css
      targetDoc.head.appendChild(style)
    } catch {
      // Folhas de outra origem (ex.: Google Fonts) não podem ser lidas: usa <link>
      if (sheet.href) {
        const link = targetDoc.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        targetDoc.head.appendChild(link)
      }
    }
  }
}

// Mantém o tema (dia/noite) da janela PiP igual ao da página
const syncTheme = (targetDoc) => {
  const apply = () => {
    const theme = document.documentElement.dataset.theme
    if (theme) targetDoc.documentElement.dataset.theme = theme
    else delete targetDoc.documentElement.dataset.theme
  }
  apply()
  themeObserver = new MutationObserver(apply)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

/**
 * Abre a janela PiP de documento. Precisa ser chamada direto num clique.
 */
async function openDocument ({ width = 320, height = 360 } = {}) {
  // requestWindow é a primeira chamada: ainda dentro do gesto do usuário
  const win = await window.documentPictureInPicture.requestWindow({ width, height })

  pipWindow = win

  // A classe ativa as regras de html.pip-document (main.scss):
  // fundo opaco na janela inteira e sem rolagem.
  win.document.documentElement.classList.add('pip-document')
  win.document.title = 'Pomopetz'
  win.document.documentElement.lang = document.documentElement.lang
  copyStyles(win.document)
  syncTheme(win.document)

  const root = win.document.createElement('div')
  root.className = 'pip-root'
  win.document.body.appendChild(root)

  // Fechar a janela pelo "X" dispara pagehide
  win.addEventListener('pagehide', cleanup, { once: true })

  documentBody.value = root
  mode.value = 'document'
}

// ---------- Modo vídeo (fallback) ----------

/**
 * Abre o canvas como vídeo PiP. O canvas já deve ter um quadro desenhado.
 * `actions` liga os botões da janela ao timer: { play, pause }.
 */
async function openVideo (canvas, actions = {}) {
  stream = canvas.captureStream()

  videoEl = document.createElement('video')
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.srcObject = stream
  // Fica no DOM (alguns navegadores exigem), mas invisível
  Object.assign(videoEl.style, {
    position: 'fixed', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none', bottom: '0', left: '0'
  })
  document.body.appendChild(videoEl)

  await videoEl.play()
  await videoEl.requestPictureInPicture()

  videoEl.addEventListener('leavepictureinpicture', cleanup, { once: true })

  if ('mediaSession' in navigator) {
    for (const [action, handler] of Object.entries(actions)) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch {}
    }
  }

  mode.value = 'video'
}

// Avisa o navegador que um novo quadro foi desenhado no canvas
function requestFrame () {
  stream?.getVideoTracks()[0]?.requestFrame?.()
}

// Ícone de play/pause mostrado na janela de vídeo PiP
function setPlaybackState (isPlaying) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }
}

// ---------- Comum ----------

function cleanup () {
  themeObserver?.disconnect()
  themeObserver = null
  pipWindow = null
  documentBody.value = null

  if (videoEl) {
    stream?.getTracks().forEach(track => track.stop())
    videoEl.remove()
    videoEl = null
    stream = null
    if ('mediaSession' in navigator) {
      for (const action of ['play', 'pause']) {
        try { navigator.mediaSession.setActionHandler(action, null) } catch {}
      }
    }
  }

  mode.value = null
}

async function close () {
  try {
    if (mode.value === 'document') pipWindow?.close()
    else if (mode.value === 'video' && document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    }
  } finally {
    cleanup()
  }
}

export function usePictureInPicture () {
  return {
    isSupported: supportsDocument || supportsVideo,
    supportsDocument,
    supportsVideo,
    mode,
    isActive: computed(() => mode.value !== null),
    documentBody,
    openDocument,
    openVideo,
    requestFrame,
    setPlaybackState,
    close
  }
}
