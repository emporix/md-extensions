export type JsonTokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punct'
  | 'text'

export type JsonToken = {
  readonly kind: JsonTokenKind
  readonly text: string
}

const isDigit = (char: string): boolean => char >= '0' && char <= '9'

const isSpace = (char: string): boolean =>
  char === ' ' || char === '\n' || char === '\r' || char === '\t'

const readStringEnd = (source: string, start: number): number => {
  let index = start + 1
  while (index < source.length) {
    const char = source[index]
    if (char === '\\') {
      index += 2
      continue
    }
    if (char === '"') {
      return index + 1
    }
    index += 1
  }
  return source.length
}

const nextNonSpace = (source: string, start: number): string => {
  let index = start
  while (index < source.length && isSpace(source[index] ?? '')) {
    index += 1
  }
  return source[index] ?? ''
}

const literalAt = (source: string, index: number): string | null => {
  if (source.startsWith('true', index)) {
    return 'true'
  }
  if (source.startsWith('false', index)) {
    return 'false'
  }
  if (source.startsWith('null', index)) {
    return 'null'
  }
  return null
}

export const formatJsonBlock = (value: unknown): string =>
  JSON.stringify(value, null, 2) ?? ''

export const highlightJson = (source: string): JsonToken[] => {
  const tokens: JsonToken[] = []
  let index = 0

  while (index < source.length) {
    const char = source[index] ?? ''

    if (char === '"') {
      const end = readStringEnd(source, index)
      tokens.push({
        kind: nextNonSpace(source, end) === ':' ? 'key' : 'string',
        text: source.slice(index, end),
      })
      index = end
      continue
    }

    if (char === '-' || isDigit(char)) {
      let end = index + 1
      while (end < source.length && /[0-9.eE+-]/.test(source[end] ?? '')) {
        end += 1
      }
      tokens.push({ kind: 'number', text: source.slice(index, end) })
      index = end
      continue
    }

    const literal = literalAt(source, index)
    if (literal) {
      tokens.push({ kind: 'literal', text: literal })
      index += literal.length
      continue
    }

    if ('{}[],:'.includes(char)) {
      tokens.push({ kind: 'punct', text: char })
      index += 1
      continue
    }

    let end = index + 1
    while (end < source.length && isSpace(source[end] ?? '')) {
      end += 1
    }
    tokens.push({ kind: 'text', text: source.slice(index, end) })
    index = end
  }

  return tokens
}
