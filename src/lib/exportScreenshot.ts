/**
 * Capture the active visualizer pane as a PNG download.
 * Handles DOM (SVG/HTML) and WebGL canvases (Three.js).
 */

export async function exportMainScreenshot(
  root: HTMLElement,
  filename = 'algoviz.png',
): Promise<void> {
  // Ensure WebGL canvases keep pixels readable
  const glCanvases = root.querySelectorAll('canvas')
  glCanvases.forEach((c) => {
    // no-op hint — R3F may need preserveDrawingBuffer; we still try to draw
    void c
  })

  // Wait a frame so any pending rAF paints complete
  await new Promise<void>((r) => requestAnimationFrame(() => r()))

  const width = Math.max(1, Math.floor(root.scrollWidth))
  const height = Math.max(1, Math.floor(root.scrollHeight))
  const scale = Math.min(2, window.devicePixelRatio || 1)

  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(width * scale)
  canvas.height = Math.floor(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create 2D context')

  ctx.scale(scale, scale)
  ctx.fillStyle = '#07070b'
  ctx.fillRect(0, 0, width, height)

  // Draw background from computed style if available
  const bg = getComputedStyle(root).backgroundColor
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)
  }

  const rootRect = root.getBoundingClientRect()

  // 1) Rasterize foreign HTML via SVG foreignObject (best-effort)
  try {
    const clone = root.cloneNode(true) as HTMLElement
    // Strip interactive controls rail if marked
    clone.querySelectorAll('[data-export-ignore]').forEach((el) => el.remove())
    // Replace live canvases in clone with placeholders (we'll composite real ones)
    clone.querySelectorAll('canvas').forEach((c) => {
      const ph = document.createElement('div')
      ph.style.width = `${(c as HTMLCanvasElement).clientWidth}px`
      ph.style.height = `${(c as HTMLCanvasElement).clientHeight}px`
      ph.style.background = '#07070b'
      c.replaceWith(ph)
    })

    const serialized = new XMLSerializer().serializeToString(clone)
    // Inline minimal wrapper with Tailwind-ish dark bg
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#07070b;color:#e4e4ef;font-family:Inter,system-ui,sans-serif;overflow:hidden;">
            ${serialized}
          </div>
        </foreignObject>
      </svg>`

    const url = URL.createObjectURL(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    )
    try {
      const img = await loadImage(url)
      ctx.drawImage(img, 0, 0, width, height)
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    // foreignObject often blocked by CORS styles — fall back to canvas-only
  }

  // 2) Composite actual WebGL / 2D canvases on top at correct positions
  glCanvases.forEach((c) => {
    try {
      const rect = c.getBoundingClientRect()
      const x = rect.left - rootRect.left + root.scrollLeft
      const y = rect.top - rootRect.top + root.scrollTop
      ctx.drawImage(c, x, y, rect.width, rect.height)
    } catch {
      // tainted canvas
    }
  })

  // 3) Also draw inline SVGs as images for sharper export when FO fails
  const svgs = root.querySelectorAll('svg')
  for (const svgEl of Array.from(svgs)) {
    try {
      const rect = svgEl.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      const x = rect.left - rootRect.left + root.scrollLeft
      const y = rect.top - rootRect.top + root.scrollTop
      const data = new XMLSerializer().serializeToString(svgEl)
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      try {
        const img = await loadImage(url)
        ctx.drawImage(img, x, y, rect.width, rect.height)
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch {
      /* skip */
    }
  }

  await downloadCanvas(canvas, filename)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('toBlob failed'))
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}

export function makeExportFilename(algo: string): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `algoviz-${algo}-${stamp}.png`
}
