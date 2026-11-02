const PNG_SCALE = 2
const PNG_BACKGROUND = '#ffffff'

const pngBackground = (): string => {
  if (typeof document === 'undefined') {
    return PNG_BACKGROUND
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-surface-white')
    .trim()
  return value === '' ? PNG_BACKGROUND : value
}
const UNSAFE_FILENAME = /[\\/:*?"<>|]/g
const PAINT_PROPERTIES = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linejoin',
  'stroke-linecap',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
] as const

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/
const FRONT_TITLE = /^title:\s*["']?(.+?)["']?\s*$/m
const LINE_TITLE = /^title\s+(.+)$/m

const isSafePaintValue = (value: string): boolean => {
  if (value === '') {
    return false
  }
  if (!/url\s*\(/i.test(value)) {
    return true
  }
  return /url\s*\(\s*['"]?#[^)'"]+['"]?\s*\)/i.test(value)
}

const paintStyle = (element: Element): string => {
  const computed = getComputedStyle(element)
  return PAINT_PROPERTIES.flatMap((name) => {
    const value = computed.getPropertyValue(name).trim()
    return isSafePaintValue(value) ? [`${name}:${value}`] : []
  }).join(';')
}

const applyComputedPaint = (source: Element, target: Element) => {
  const paint = paintStyle(source)
  if (paint === '') {
    return
  }
  const existing = target.getAttribute('style') ?? ''
  target.setAttribute('style', [existing, paint].filter(Boolean).join(';'))
}

const diagramSize = (
  svg: SVGSVGElement
): {
  readonly width: number
  readonly height: number
  readonly viewBox: string
} => {
  const box = svg.viewBox.baseVal
  if (box.width > 0 && box.height > 0) {
    return {
      width: box.width,
      height: box.height,
      viewBox: `${box.x} ${box.y} ${box.width} ${box.height}`,
    }
  }
  const bounds = svg.getBoundingClientRect()
  const width = Math.max(1, Math.round(bounds.width))
  const height = Math.max(1, Math.round(bounds.height))
  return { width, height, viewBox: `0 0 ${width} ${height}` }
}

const textTitle = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  }
  if (!Array.isArray(value)) {
    return undefined
  }
  const joined = value
    .filter((item) => typeof item === 'string')
    .join(' ')
    .trim()
  return joined === '' ? undefined : joined
}

export const pngFilename = (
  name: string | undefined,
  fallback: string
): string => {
  const cleaned = Array.from(name ?? '')
    .map((char) => (char.charCodeAt(0) < 32 ? ' ' : char))
    .join('')
    .replace(UNSAFE_FILENAME, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.png$/i, '')
    .slice(0, 80)
    .trim()
  return `${cleaned === '' ? fallback : cleaned}.png`
}

export const chartDownloadName = (
  fenceTitle: string | undefined,
  spec: unknown
): string | undefined => {
  const fence = fenceTitle?.trim()
  if (fence) {
    return fence
  }
  if (typeof spec !== 'object' || spec === null) {
    return undefined
  }
  const title = (spec as { title?: unknown }).title
  if (typeof title === 'string' || Array.isArray(title)) {
    return textTitle(title)
  }
  if (typeof title === 'object' && title !== null) {
    return textTitle((title as { text?: unknown }).text)
  }
  return undefined
}

export const diagramDownloadName = (
  fenceTitle: string | undefined,
  source: string
): string | undefined => {
  const fence = fenceTitle?.trim()
  if (fence) {
    return fence
  }
  const front = FRONT_MATTER.exec(source.trim())
  const frontTitle = front?.[1] ? FRONT_TITLE.exec(front[1]) : null
  if (frontTitle?.[1]) {
    return frontTitle[1].trim()
  }
  return LINE_TITLE.exec(source)?.[1]?.trim()
}

export const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const svgElementToPngBlob = (
  svg: SVGSVGElement,
  scale = PNG_SCALE
): Promise<Blob> => {
  const backgroundColor = pngBackground()
  const { width, height, viewBox } = diagramSize(svg)
  const clone = svg.cloneNode(true)
  if (!(clone instanceof SVGSVGElement)) {
    return Promise.reject(new Error('svg'))
  }

  const sources = [svg, ...svg.querySelectorAll('*')]
  const targets = [clone, ...clone.querySelectorAll('*')]
  sources.forEach((source, index) => {
    const target = targets[index]
    if (target) {
      applyComputedPaint(source, target)
    }
  })

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', viewBox)
  clone.style.width = `${width}px`
  clone.style.height = `${height}px`
  clone.style.maxWidth = 'none'
  clone.style.maxHeight = 'none'

  const [minX = '0', minY = '0'] = viewBox.split(/\s+/)
  const background = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
  )
  background.setAttribute('x', minX)
  background.setAttribute('y', minY)
  background.setAttribute('width', String(width))
  background.setAttribute('height', String(height))
  background.setAttribute('fill', backgroundColor)
  clone.insertBefore(background, clone.firstChild)

  const markup = new XMLSerializer().serializeToString(clone)
  const source = URL.createObjectURL(
    new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  )
  const image = new Image()

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(source)
        reject(new Error('canvas'))
        return
      }

      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((png) => {
        URL.revokeObjectURL(source)
        if (!png) {
          reject(new Error('png'))
          return
        }
        resolve(png)
      }, 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(source)
      reject(new Error('svg'))
    }
    image.src = source
  })
}

type VegaImageView = {
  background: (color?: string) => unknown
  toImageURL: (type: 'png', scale: number) => Promise<string>
}

const vegaViewToPngBlobWithBackground = async (
  view: VegaImageView
): Promise<Blob> => {
  const dataUrl = await view.toImageURL('png', PNG_SCALE)
  const response = await fetch(dataUrl)
  if (!response.ok) {
    throw new Error('png')
  }
  return response.blob()
}

export const vegaViewToPngBlob = async (view: VegaImageView): Promise<Blob> => {
  const previous = view.background()
  view.background(pngBackground())
  try {
    return await vegaViewToPngBlobWithBackground(view)
  } finally {
    if (typeof previous === 'string') {
      view.background(previous)
    }
  }
}
