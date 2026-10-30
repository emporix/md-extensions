import { describe, expect, it } from 'vitest'
import {
  isBlockedMermaidSource,
  isDroppedSvgTag,
  isUnsafeSvgAttribute,
  isUnsafeSvgStyle,
  prepareMermaidSource,
} from './mermaidGuard'

describe('isBlockedMermaidSource', () => {
  it('accepts a flowchart', () => {
    expect(isBlockedMermaidSource('flowchart LR\n  A-->B')).toBe(false)
  })

  it('rejects script and javascript urls', () => {
    expect(
      isBlockedMermaidSource(
        'flowchart LR\n  A-->B\n  click A javascript:alert(1)'
      )
    ).toBe(true)
    expect(
      isBlockedMermaidSource(
        'flowchart LR\n  A-->B\n  click A "javascript:alert(1)"'
      )
    ).toBe(true)
    expect(isBlockedMermaidSource('flowchart LR\n  A["<script>"]')).toBe(true)
  })

  it('allows a node label that names JavaScript', () => {
    expect(
      isBlockedMermaidSource(
        'flowchart LR\n  H["JavaScript: Interpreted or JIT compiled"]\n  style B fill:#f9f,stroke:#333,stroke-width:2px'
      )
    ).toBe(false)
  })
})

describe('prepareMermaidSource', () => {
  it('quotes rectangle labels that mermaid cannot parse raw', () => {
    expect(
      prepareMermaidSource(
        'flowchart LR\n    A[Assembly] --> B[C/C++]\n    B --> C[Rust]\n    C --> D[Java / C# (JIT)]\n    D --> E[Python / JavaScript (interpreted)]'
      )
    ).toBe(
      'flowchart LR\n    A[Assembly] --> B["C/C++"]\n    B --> C[Rust]\n    C --> D["Java / C# (JIT)"]\n    D --> E["Python / JavaScript (interpreted)"]'
    )
  })

  it('leaves quoted labels and decorated shapes unchanged', () => {
    const source = 'flowchart LR\n  A["C#"]\n  B[/fast/]\n  C[(db)]'
    expect(prepareMermaidSource(source)).toBe(source)
  })
})

describe('isUnsafeSvgAttribute', () => {
  it('drops event handlers and external links', () => {
    expect(isDroppedSvgTag('script')).toBe(true)
    expect(isDroppedSvgTag('foreignObject')).toBe(true)
    expect(isDroppedSvgTag('path')).toBe(false)
    expect(isUnsafeSvgAttribute('onclick', 'alert(1)')).toBe(true)
    expect(isUnsafeSvgAttribute('href', 'https://example.com')).toBe(true)
    expect(isUnsafeSvgAttribute('xlink:href', ' javascript:alert(1)')).toBe(
      true
    )
    expect(isUnsafeSvgAttribute('href', '#node-a')).toBe(false)
    expect(isUnsafeSvgAttribute('style', 'fill:#3b73bb')).toBe(false)
    expect(isUnsafeSvgAttribute('style', 'fill:url(#node-a)')).toBe(false)
    expect(
      isUnsafeSvgAttribute('style', 'fill:url(https://example.com/a.png)')
    ).toBe(true)
  })
})

describe('isUnsafeSvgStyle', () => {
  it('keeps diagram colors and internal fragment urls', () => {
    expect(isUnsafeSvgStyle('.node { fill: #fff; }')).toBe(false)
    expect(isUnsafeSvgStyle('rect { stroke: url(#diagram-1-gradient); }')).toBe(
      false
    )
  })

  it('rejects imports, external urls, and hidden payloads', () => {
    expect(isUnsafeSvgStyle('@import url(https://evil.test/a.css);')).toBe(true)
    expect(isUnsafeSvgStyle("@import 'https://evil.test/a.css';")).toBe(true)
    expect(
      isUnsafeSvgStyle('.x { background: url(https://evil.test/a.png) }')
    ).toBe(true)
    expect(
      isUnsafeSvgStyle('.x { background: url("https://evil.test/a.png") }')
    ).toBe(true)
    expect(
      isUnsafeSvgStyle('.x { background: u\\000072l(https://evil.test/a.png) }')
    ).toBe(true)
    expect(isUnsafeSvgStyle('@\\69mport "https://evil.test/a.css";')).toBe(true)
    expect(
      isUnsafeSvgStyle('.x { background: u/**/rl(https://evil.test/a.png) }')
    ).toBe(true)
    expect(isUnsafeSvgStyle('.x { width: expression(alert(1)) }')).toBe(true)
  })
})
