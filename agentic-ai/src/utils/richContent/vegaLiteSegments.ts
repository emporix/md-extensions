import { isVegaLiteSpec } from './vegaLiteGuard'

const FENCE_TAGS = ['vega-lite', 'mermaid', 'csv', 'json', 'note'] as const

export type RichFenceKind = (typeof FENCE_TAGS)[number]

export type VegaLiteSegment = {
  readonly kind:
    | 'text'
    | 'code'
    | 'code-pending'
    | RichFenceKind
    | `${RichFenceKind}-pending`
  readonly text: string
  readonly spec?: unknown
  readonly error?: string
  readonly title?: string
  readonly language?: string
}

const FENCE = '```'
const LINE_FENCE_INDENT = /^ {0,3}$/

const lineStartIndex = (text: string, index: number): number => {
  let line = index
  while (line > 0 && text[line - 1] !== '\n') {
    line -= 1
  }
  return line
}

const isLineFence = (text: string, index: number): boolean =>
  LINE_FENCE_INDENT.test(text.slice(lineStartIndex(text, index), index))

const findLineFence = (text: string, from: number): number => {
  let cursor = from
  while (cursor < text.length) {
    const index = text.indexOf(FENCE, cursor)
    if (index === -1) {
      return -1
    }
    if (isLineFence(text, index)) {
      return index
    }
    cursor = index + FENCE.length
  }
  return -1
}

export const GENERIC_CODE_LANGUAGE = 'code'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isRichFenceKind = (value: string): value is RichFenceKind =>
  (FENCE_TAGS as readonly string[]).includes(value)

const pendingKind = (kind: RichFenceKind): `${RichFenceKind}-pending` =>
  `${kind}-pending`

const LANGUAGE_ID = /^[A-Za-z][A-Za-z0-9_+#.-]{0,31}$/

type FenceInfo =
  | { readonly kind: RichFenceKind; readonly title?: string }
  | {
      readonly kind: 'code'
      readonly language: string
      readonly title?: string
    }

const codeFence = (
  language: string | undefined,
  title: string | undefined
): FenceInfo | undefined => {
  if (!language) {
    return { kind: 'code', language: GENERIC_CODE_LANGUAGE }
  }
  if (!LANGUAGE_ID.test(language)) {
    return undefined
  }
  return {
    kind: 'code',
    language: language.toLowerCase(),
    ...(title ? { title } : {}),
  }
}

const fenceInfo = (info: string): FenceInfo | undefined => {
  const trimmed = info.trim()
  const hashed = /^language#(\S+)(?:\s+(\S[\s\S]*))?$/i.exec(trimmed)
  if (hashed) {
    return codeFence(hashed[1], hashed[2]?.trim() || undefined)
  }

  const separator = trimmed.indexOf(' ')
  const tag = (
    separator === -1 ? trimmed : trimmed.slice(0, separator)
  ).toLowerCase()
  const rest = separator === -1 ? '' : trimmed.slice(separator + 1).trim()
  if (tag === 'language') {
    if (rest === '') {
      return { kind: 'code', language: GENERIC_CODE_LANGUAGE }
    }
    const space = rest.indexOf(' ')
    const language = space === -1 ? rest : rest.slice(0, space)
    const title =
      space === -1 ? undefined : rest.slice(space + 1).trim() || undefined
    return codeFence(language, title)
  }
  if (isRichFenceKind(tag)) {
    return { kind: tag, title: rest || undefined }
  }
  return codeFence(tag, rest || undefined)
}

const pendingSegment = (info: FenceInfo, text: string): VegaLiteSegment => {
  if (info.kind === 'code') {
    return {
      kind: 'code-pending',
      text,
      language: info.language,
      ...(info.title ? { title: info.title } : {}),
    }
  }
  return { kind: pendingKind(info.kind), text }
}

const pushText = (segments: VegaLiteSegment[], text: string): void => {
  if (text === '') {
    return
  }
  const last = segments[segments.length - 1]
  if (last?.kind === 'text' && last.error === undefined) {
    segments[segments.length - 1] = { ...last, text: last.text + text }
    return
  }
  segments.push({ kind: 'text', text })
}

const wholeMessageSpec = (text: string): VegaLiteSegment | undefined => {
  const trimmed = text.trim()
  if (trimmed === '') {
    return undefined
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (!isVegaLiteSpec(parsed)) {
      return undefined
    }
    return { kind: 'vega-lite', text: trimmed, spec: parsed }
  } catch {
    return undefined
  }
}

const closedVegaLiteSegment = (body: string): VegaLiteSegment => {
  try {
    const parsed: unknown = JSON.parse(body)
    if (isRecord(parsed)) {
      return { kind: 'vega-lite', text: body, spec: parsed }
    }
  } catch {
    return { kind: 'text', text: body, error: 'invalid-json' }
  }
  return { kind: 'text', text: body, error: 'invalid-json' }
}

export const splitVegaLiteSegments = (text: string): VegaLiteSegment[] => {
  const whole = wholeMessageSpec(text)
  if (whole) {
    return [whole]
  }

  const segments: VegaLiteSegment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const open = findLineFence(text, cursor)
    if (open === -1) {
      pushText(segments, text.slice(cursor))
      break
    }
    const openLine = lineStartIndex(text, open)
    pushText(segments, text.slice(cursor, openLine))
    const infoStart = open + FENCE.length
    const lineBreak = text.indexOf('\n', infoStart)
    if (lineBreak === -1) {
      const info = fenceInfo(text.slice(infoStart))
      if (info) {
        segments.push(pendingSegment(info, ''))
      } else {
        pushText(segments, text.slice(openLine))
      }
      break
    }
    const info = fenceInfo(text.slice(infoStart, lineBreak))
    const bodyStart = lineBreak + 1
    const close = findLineFence(text, bodyStart)
    if (close === -1) {
      if (info) {
        segments.push(pendingSegment(info, text.slice(bodyStart)))
      } else {
        pushText(segments, text.slice(openLine))
      }
      break
    }
    const after = close + FENCE.length
    if (!info) {
      pushText(segments, text.slice(openLine, after))
      cursor = after
      continue
    }
    const body = text.slice(bodyStart, lineStartIndex(text, close))
    if (info.kind === 'code') {
      segments.push({
        kind: 'code',
        text: body,
        language: info.language,
        ...(info.title ? { title: info.title } : {}),
      })
    } else if (info.kind === 'vega-lite') {
      const parsed = closedVegaLiteSegment(body)
      segments.push(info.title ? { ...parsed, title: info.title } : parsed)
    } else {
      segments.push(
        info.title
          ? { kind: info.kind, text: body, title: info.title }
          : { kind: info.kind, text: body }
      )
    }
    cursor = after
  }
  return segments
}
