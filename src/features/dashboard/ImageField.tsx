import { useRef, useState } from "react"
import { ImagePlus, Link2, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api"
import { imageUrl } from "@/lib/media"
import { uploadImage } from "./api"
import { inputClass } from "./styles"

const MAX_MB = 8

/** Cover image picker: upload to Cloudinary, or paste an existing image link. */
export function ImageField({ value, onChange, label = "Picha ya juu (cover)" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pasting, setPasting] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Chagua picha (JPG, PNG au WebP)" })
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ variant: "destructive", title: `Picha ni kubwa sana`, description: `Ukubwa wa juu ni MB ${MAX_MB}.` })
      return
    }
    setUploading(true)
    try {
      onChange(await uploadImage(file))
    } catch (error) {
      const notConfigured = error instanceof ApiError && error.status === 503
      toast({
        variant: "destructive",
        title: "Picha haikupakiwa",
        description: notConfigured ? "Cloudinary bado haijawekwa kwenye server. Bandika link ya picha badala yake." : "Jaribu tena.",
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
              Badilisha
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 w-9 rounded-lg bg-white/90 text-red-600 inline-flex items-center justify-center"
              aria-label="Ondoa picha"
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
          <span className="text-sm font-medium">{uploading ? "Inapakia..." : "Bonyeza au buruta picha hapa"}</span>
          <span className="text-xs text-foreground/40">JPG, PNG, WebP · hadi MB {MAX_MB} · inapunguzwa ukubwa yenyewe</span>
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
          aria-label="Link ya picha"
        />
      ) : (
        <button type="button" onClick={() => setPasting(true)} className="mt-2 text-xs text-foreground/50 hover:text-primary inline-flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5" />
          Au bandika link ya picha
        </button>
      )}
    </div>
  )
}
