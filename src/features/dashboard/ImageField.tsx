import { useRef, useState } from "react"
import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api"
import { imageUrl } from "@/lib/media"
import { uploadImage } from "./api"
import { inputClass } from "./styles"

const MAX_MB = 8

/** Explains why Cloudinary refused the upload (shown to the admin, so it can be technical) */
function uploadErrorText(error: unknown) {
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

/** Cover image picker: upload to Cloudinary, or paste an existing image link. */
export function ImageField({ value, onChange, label = "Cover image" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pasting, setPasting] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Choose an image (JPG, PNG or WebP)" })
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ variant: "destructive", title: "The image is too large", description: `The maximum size is ${MAX_MB} MB.` })
      return
    }
    setUploading(true)
    try {
      onChange(await uploadImage(file))
    } catch (error) {
      const notConfigured = error instanceof ApiError && error.status === 503
      toast({
        variant: "destructive",
        title: "Image not uploaded",
        description: notConfigured
          ? "The server could not read CLOUDINARY_URL. On Render, the value must be only cloudinary://API_KEY:API_SECRET@CLOUD_NAME, then redeploy."
          : uploadErrorText(error),
      })
      if (notConfigured) setPasting(true)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-foreground/10 group">
          <img src={imageUrl(value, 800)} alt="" className="w-full aspect-[16/9] object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-2 flex justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="h-9 px-3 rounded-lg bg-white/90 text-slate-900 text-sm font-medium inline-flex items-center gap-1.5"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 w-9 rounded-lg bg-white/90 text-red-600 inline-flex items-center justify-center"
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files?.[0])
          }}
          className="w-full aspect-[16/9] max-h-56 rounded-xl border-2 border-dashed border-foreground/20 hover:border-primary/60 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-foreground/60"
        >
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImagePlus className="h-8 w-8" />}
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Click or drag an image here"}</span>
          <span className="text-xs text-foreground/40">JPG, PNG, WebP · up to {MAX_MB} MB · resized automatically</span>
        </button>
      )}
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {pasting ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="https://..."
          className={`${inputClass} mt-2 text-sm`}
          aria-label="Image link"
        />
      ) : (
        <button type="button" onClick={() => setPasting(true)} className="mt-2 text-xs text-foreground/50 hover:text-primary inline-flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5" />
          Or paste an image link
        </button>
      )}
    </div>
  )
}
