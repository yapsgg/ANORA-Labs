import sharp from "sharp";

/**
 * Convert an SVG buffer to PNG. Returns the original buffer unchanged
 * for non-SVG mime types.
 */
export async function ensureRasterImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (mimeType === "image/svg+xml" || mimeType === "image/svg") {
    const pngBuffer = await sharp(buffer).png().toBuffer();
    return { buffer: pngBuffer, mimeType: "image/png" };
  }
  return { buffer, mimeType };
}
