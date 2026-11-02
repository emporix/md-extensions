import { describe, expect, it } from 'vitest'
import { splitVegaLiteSegments } from './vegaLiteSegments'

const barBody = '{"mark":"bar","encoding":{}}'
const barSpec = { mark: 'bar', encoding: {} }

describe('splitVegaLiteSegments', () => {
  it('parses a closed vega-lite fence and ignores a trailing title', () => {
    const segments = splitVegaLiteSegments(
      `\`\`\`vega-lite Revenue\n${barBody}\n\`\`\``
    )

    expect(segments).toHaveLength(1)
    expect(segments[0]?.kind).toBe('vega-lite')
    expect(segments[0]?.spec).toEqual(barSpec)
    expect(segments[0]?.error).toBeUndefined()
  })

  it('parses a fence split across two concatenated token strings', () => {
    const head = '```vega-lite\n{"mark":"bar","enc'
    const tail = 'oding":{}}\n```'
    const segments = splitVegaLiteSegments(head + tail)

    expect(segments).toEqual([
      {
        kind: 'vega-lite',
        text: `${barBody}\n`,
        spec: barSpec,
      },
    ])
  })

  it('keeps an unclosed fence pending and does not parse it', () => {
    const segments = splitVegaLiteSegments('```vega-lite\n{"mark":"bar"')

    expect(segments).toEqual([
      { kind: 'vega-lite-pending', text: '{"mark":"bar"' },
    ])
    expect(segments[0]?.spec).toBeUndefined()
  })

  it('keeps invalid json as text with an error', () => {
    const segments = splitVegaLiteSegments('```vega-lite\n{nope}\n```')

    expect(segments).toEqual([
      { kind: 'text', text: '{nope}\n', error: 'invalid-json' },
    ])
  })

  it('keeps prose around a fence', () => {
    const segments = splitVegaLiteSegments(
      `Before\n\`\`\`vega-lite\n${barBody}\n\`\`\`\nAfter`
    )

    expect(segments.map((segment) => segment.kind)).toEqual([
      'text',
      'vega-lite',
      'text',
    ])
    expect(segments[0]?.text).toBe('Before\n')
    expect(segments[1]?.spec).toEqual(barSpec)
    expect(segments[2]?.text).toBe('\nAfter')
  })

  it('parses csv, json and note fences, including a note title', () => {
    const segments = splitVegaLiteSegments(
      '```csv Orders\nname,amount\nA,1\n```\n```json\n{"a":1}\n```\n```note Check\nLook here\n```'
    )

    expect(segments.map((segment) => segment.kind)).toEqual([
      'csv',
      'text',
      'json',
      'text',
      'note',
    ])
    expect(segments[0]?.title).toBe('Orders')
    expect(segments[4]?.title).toBe('Check')
    expect(segments[4]?.text).toBe('Look here\n')
  })

  it('keeps an open csv fence pending', () => {
    expect(splitVegaLiteSegments('```csv\nname,amount')).toEqual([
      { kind: 'csv-pending', text: 'name,amount' },
    ])
  })

  it('parses a closed mermaid fence and keeps an open one pending', () => {
    const closed = splitVegaLiteSegments(
      '```mermaid\nflowchart LR\n  A-->B\n```'
    )
    const pending = splitVegaLiteSegments('```mermaid\nflowchart LR\n  A-->B')

    expect(closed).toEqual([
      { kind: 'mermaid', text: 'flowchart LR\n  A-->B\n' },
    ])
    expect(pending).toEqual([
      { kind: 'mermaid-pending', text: 'flowchart LR\n  A-->B' },
    ])
  })

  it('parses a java fence and the language# form as code', () => {
    const plain = splitVegaLiteSegments('```java\nclass A {}\n```')
    const hashed = splitVegaLiteSegments('```language#java\nclass A {}\n```')
    const spaced = splitVegaLiteSegments('```language python\nprint(1)\n```')
    const pending = splitVegaLiteSegments('```java\nclass A {')
    const unsafe = splitVegaLiteSegments('```http://evil\nnope\n```')

    expect(plain).toEqual([
      { kind: 'code', language: 'java', text: 'class A {}\n' },
    ])
    expect(hashed[0]?.language).toBe('java')
    expect(spaced[0]?.language).toBe('python')
    expect(pending).toEqual([
      { kind: 'code-pending', language: 'java', text: 'class A {' },
    ])
    expect(unsafe[0]?.kind).toBe('text')
  })

  it('ignores fence markers that do not start a line', () => {
    const inline = splitVegaLiteSegments(
      'Use ``` in a sentence and {"raw":"```json"}\nStill text'
    )
    const indented = splitVegaLiteSegments('    ```json\n{"a":1}\n    ```\n')

    expect(inline).toEqual([
      {
        kind: 'text',
        text: 'Use ``` in a sentence and {"raw":"```json"}\nStill text',
      },
    ])
    expect(indented).toEqual([
      { kind: 'text', text: '    ```json\n{"a":1}\n    ```\n' },
    ])
  })

  it('parses a line fence after inline backticks and keeps body backticks', () => {
    const segments = splitVegaLiteSegments(
      'Use ``` inline.\n```json\n{"a":1}\n```\nDone'
    )
    const code = splitVegaLiteSegments('```java\nString s = "```";\n```')

    expect(segments.map((segment) => segment.kind)).toEqual([
      'text',
      'json',
      'text',
    ])
    expect(segments[0]?.text).toBe('Use ``` inline.\n')
    expect(segments[1]?.text).toBe('{"a":1}\n')
    expect(segments[2]?.text).toBe('\nDone')
    expect(code).toEqual([
      { kind: 'code', language: 'java', text: 'String s = "```";\n' },
    ])
  })

  it('does not treat a fenced line with trailing text as a close', () => {
    const segments = splitVegaLiteSegments(
      '```mermaid Diagram\nflowchart LR\n```not-a-close\n  A-->B\n```\nAfter'
    )
    const pending = splitVegaLiteSegments(
      '```vega-lite Sales\n{"mark":"bar"}\n```still-open'
    )

    expect(segments).toEqual([
      {
        kind: 'mermaid',
        title: 'Diagram',
        text: 'flowchart LR\n```not-a-close\n  A-->B\n',
      },
      { kind: 'text', text: '\nAfter' },
    ])
    expect(pending[0]?.kind).toBe('vega-lite-pending')
    expect(pending[0]?.text).toContain('```still-open')
  })

  it('accepts a closing fence that has only trailing spaces', () => {
    const segments = splitVegaLiteSegments('```java\nclass A {}\n```   \n')

    expect(segments[0]).toEqual({
      kind: 'code',
      language: 'java',
      text: 'class A {}\n',
    })
    expect(segments[1]?.text?.trim()).toBe('')
  })

  it('keeps a rich fence when the tag is not lowercase', () => {
    const diagram = splitVegaLiteSegments(
      '```Mermaid\nflowchart LR\n  A-->B\n```'
    )
    const data = splitVegaLiteSegments('```JSON\n{"a":1}\n```')

    expect(diagram[0]?.kind).toBe('mermaid')
    expect(data[0]?.kind).toBe('json')
  })

  it('keeps prose after a raw spec that is not the whole message', () => {
    const raw = '{"$schema":"vega-lite","mark":"point","encoding":{}}'
    const segments = splitVegaLiteSegments(`${raw}\n\nSummary`)

    expect(segments).toEqual([{ kind: 'text', text: `${raw}\n\nSummary` }])
  })

  it('treats a whole-message spec as one vega-lite segment', () => {
    const raw = '{"$schema":"vega-lite","mark":"point","encoding":{}}'
    const segments = splitVegaLiteSegments(`\n${raw}\n`)

    expect(segments).toEqual([
      {
        kind: 'vega-lite',
        text: raw,
        spec: { $schema: 'vega-lite', mark: 'point', encoding: {} },
      },
    ])
  })
})
