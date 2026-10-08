// Phone photos carry EXIF (GPS of where the photo was taken — often the seller's home,
// plus device model / timestamp). Redrawing through a canvas keeps only the pixels.
// Also downsizes huge camera images so uploads are faster.

const MAX_DIMENSION = 2560
const JPEG_QUALITY = 0.9

export async function stripImageMetadata(file: File): Promise<File> {
  // EXIF orientation is applied while decoding, so the output is upright without the tag
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas not supported")
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    )
    if (!blob) throw new Error("ไม่สามารถประมวลผลรูปได้")

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg" })
  } finally {
    bitmap.close()
  }
}
