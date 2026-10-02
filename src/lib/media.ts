/**
 * Resize/compress Cloudinary images on the fly (f_auto picks WebP/AVIF, q_auto the quality).
 * Other image URLs are returned unchanged.
 */
export function imageUrl(url: string | null | undefined, width: number) {
  if (!url) return ""
  const marker = "/image/upload/"
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url
  const [before, after] = url.split(marker)
  return `${before}${marker}f_auto,q_auto,c_limit,w_${width}/${after}`
}
