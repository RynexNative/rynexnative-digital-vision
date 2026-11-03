import { ApiError } from "@/lib/api"

/** Explains why Cloudinary refused the upload (shown to the admin, so it can be technical) */
export function uploadErrorText(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.data as { detail?: string } | null)?.detail
    return detail ?? `The server answered ${error.status}. Please try again.`
  }
  const message = error instanceof Error ? error.message : ""
  if (/invalid signature/i.test(message)) return "Cloudinary: the API Secret is wrong. Copy the API Secret again into CLOUDINARY_URL."
  if (/unknown api key|invalid api_key/i.test(message)) return "Cloudinary: the API Key in CLOUDINARY_URL is wrong."
  if (/cloud_name|invalid cloud/i.test(message)) return "Cloudinary: the cloud name in CLOUDINARY_URL is wrong."
  if (message === "Failed to fetch") return "Could not reach Cloudinary. Check your internet connection."
  return message ? `Cloudinary: ${message}` : "Please try again."
}
