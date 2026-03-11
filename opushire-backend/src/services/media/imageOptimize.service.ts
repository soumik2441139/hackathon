import sharp from "sharp";
import fs from "fs";

/**
 * Optimizes profile pictures/images to a fast-loading WebP format.
 * Automatically cleans up the original local source image once done.
 */
export async function optimizeImage(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/(\.\w+)$/, "-opt.webp");

  await sharp(inputPath)
    .resize({ width: 512 }) // Capping width dramatically drops file size
    .webp({ quality: 80 })  // Visually lossless 80% compression
    .toFile(outputPath);

  fs.unlinkSync(inputPath); // Remove the bulky original
  return outputPath;
}
