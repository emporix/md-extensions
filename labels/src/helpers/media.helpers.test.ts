import { describe, expect, it, vi } from 'vitest'
import { removeReplacedAsset, sumFileSizes } from './media.helpers'

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

describe('removeReplacedAsset', () => {
  it('continues without deleting when there is no current asset', async () => {
    const deleteAsset = vi.fn()

    await expect(
      removeReplacedAsset(undefined, deleteAsset, vi.fn())
    ).resolves.toBe(true)
    expect(deleteAsset).not.toHaveBeenCalled()
  })

  it('deletes the current asset and continues', async () => {
    const deleteAsset = vi.fn().mockResolvedValue(undefined)

    await expect(
      removeReplacedAsset('asset-1', deleteAsset, vi.fn())
    ).resolves.toBe(true)
    expect(deleteAsset).toHaveBeenCalledWith('asset-1')
  })

  it('reports the error and stops when the delete fails', async () => {
    const error = new Error('500')
    const onError = vi.fn()

    await expect(
      removeReplacedAsset('asset-1', vi.fn().mockRejectedValue(error), onError)
    ).resolves.toBe(false)
    expect(onError).toHaveBeenCalledWith(error)
  })
})
