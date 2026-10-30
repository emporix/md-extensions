import { describe, expect, it } from 'vitest'
import {
  chartDownloadName,
  diagramDownloadName,
  pngFilename,
} from './downloadPng'

describe('pngFilename', () => {
  it('uses the diagram name and drops characters a file name cannot have', () => {
    expect(pngFilename('Payment / flow?', 'diagram')).toBe('Payment flow.png')
  })

  it('falls back when the name is empty', () => {
    expect(pngFilename('   ', 'chart')).toBe('chart.png')
    expect(pngFilename(undefined, 'diagram')).toBe('diagram.png')
  })
})

describe('chartDownloadName', () => {
  it('prefers the fence title, then the spec title', () => {
    expect(chartDownloadName('Revenue', { title: 'Ignored' })).toBe('Revenue')
    expect(chartDownloadName(undefined, { title: 'Orders by day' })).toBe(
      'Orders by day'
    )
    expect(
      chartDownloadName(undefined, { title: { text: 'Stacked sales' } })
    ).toBe('Stacked sales')
  })
})

describe('diagramDownloadName', () => {
  it('reads a mermaid title when the fence has none', () => {
    expect(
      diagramDownloadName(
        undefined,
        '---\ntitle: Checkout\n---\nflowchart LR\n  A-->B'
      )
    ).toBe('Checkout')
    expect(
      diagramDownloadName(
        undefined,
        'title Payment flow\nflowchart LR\n  A-->B'
      )
    ).toBe('Payment flow')
    expect(diagramDownloadName('Handoff', 'title Other')).toBe('Handoff')
  })
})
