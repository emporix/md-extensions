import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteLabel, removeLabelImageFromCloudinary } from '@emporix/api-calls'
import { deleteLabelWithImage } from './labels.helpers'
import type { Label } from '../models/Label.model'

vi.mock('@emporix/api-calls', () => ({
  deleteLabel: vi.fn(),
  removeLabelImageFromCloudinary: vi.fn(),
}))

const label: Label = {
  id: 'sale',
  name: 'Sale',
  image: 'https://res.cloudinary.test/sale.png',
}

describe('deleteLabelWithImage', () => {
  beforeEach(() => {
    vi.mocked(deleteLabel).mockResolvedValue(undefined)
    vi.mocked(removeLabelImageFromCloudinary).mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('removes the Cloudinary image before deleting the label', async () => {
    await deleteLabelWithImage(label)

    expect(removeLabelImageFromCloudinary).toHaveBeenCalledWith(label.image)
    expect(deleteLabel).toHaveBeenCalledOnce()
    expect(deleteLabel).toHaveBeenCalledWith(label)
    expect(
      vi.mocked(removeLabelImageFromCloudinary).mock.invocationCallOrder[0]
    ).toBeLessThan(vi.mocked(deleteLabel).mock.invocationCallOrder[0])
  })

  it('only deletes the label when it has no image', async () => {
    await deleteLabelWithImage({ ...label, image: undefined })

    expect(removeLabelImageFromCloudinary).not.toHaveBeenCalled()
    expect(deleteLabel).toHaveBeenCalledOnce()
  })

  it('still deletes the label when removing the image fails', async () => {
    vi.mocked(removeLabelImageFromCloudinary).mockRejectedValue(
      new Error('cloudinary down')
    )

    await deleteLabelWithImage(label)

    expect(deleteLabel).toHaveBeenCalledOnce()
    expect(deleteLabel).toHaveBeenCalledWith(label)
  })

  it('rejects when deleting the label keeps failing', async () => {
    vi.mocked(deleteLabel).mockRejectedValue(new Error('api down'))

    await expect(deleteLabelWithImage(label)).rejects.toThrow('api down')
    expect(deleteLabel).toHaveBeenCalledTimes(2)
  })
})
