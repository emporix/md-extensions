import { deleteLabel, removeLabelImageFromCloudinary } from '@emporix/api-calls'
import type { Label } from '../models/Label.model'

/**
 * Deletes a label together with its Cloudinary image. Mirrors the MD
 * behaviour: when removing the image fails, the label is still deleted.
 */
export const deleteLabelWithImage = async (label: Label): Promise<void> => {
  try {
    if (label.image) {
      await removeLabelImageFromCloudinary(label.image)
    }
    await deleteLabel(label)
  } catch (error) {
    console.error(error)
    console.warn(
      'there was a problem deleting label or its image from cloudinary: ',
      label.image,
      '  retrying...'
    )
    await deleteLabel(label)
  }
}
