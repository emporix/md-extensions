import { describe, expect, it } from 'vitest'
import { sumFileSizes } from './media.helpers'

const file = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' })

describe('sumFileSizes', () => {
  it('sums an array of files', () => {
    expect(sumFileSizes([file('a.png', 3), file('b.png', 5)])).toBe(8)
  })

  it('sums an array-like FileList without array methods', () => {
    // CL FileUpload passes the native FileList, which has no reduce().
    const fileList = {
      0: file('a.png', 4),
      1: file('b.png', 6),
      length: 2,
    } as ArrayLike<File>

    expect(sumFileSizes(fileList)).toBe(10)
  })

  it('returns 0 for an empty selection', () => {
    expect(sumFileSizes([])).toBe(0)
  })
})
