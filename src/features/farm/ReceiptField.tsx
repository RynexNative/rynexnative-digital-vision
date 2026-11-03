import { useRef, useState } from "react"
import { ExternalLink, FileText, Loader2, Paperclip, Trash2 } from "lucide-react"
import { uploadErrorText } from "@/features/dashboard/upload-errors"
import { useToast } from "@/hooks/use-toast"
import { ApiError } from "@/lib/api"
import { uploadReceipt } from "./api"
import { isPdf } from "./types"

const MAX_MB = 10

/** Attach a receipt: a photo taken with the phone, or a PDF. */
export function ReceiptField({ value, name, onChange }: { value: string; name: string; onChange: (url: string, name: string) => void }) {
  const { toast } = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Choose a photo or a PDF" })
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ variant: "destructive", title: "The file is too large", description: `The maximum size is ${MAX_MB} MB.` })
      return
    }
    setUploading(true)
    try {
      onChange(await uploadReceipt(file), file.name.slice(0, 150))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Receipt not uploaded",
        description: error instanceof ApiError && error.status === 503 ? "Cloudinary is not set up on the server yet (CLOUDINARY_URL on Render)." : uploadErrorText(error),
      })
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-foreground/15 p-2 pr-3">
          {isPdf(value) ? (
            <span className="h-14 w-14 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6" />
            </span>
          ) : (
            <img src={value} alt="Receipt" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{name || "Receipt"}</p>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button type="button" onClick={() => onChange("", "")} className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-500/10 inline-flex items-center justify-center" aria-label="Remove receipt">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files?.[0])
          }}
          className="w-full h-20 rounded-xl border-2 border-dashed border-foreground/20 hover:border-amber-500/60 hover:bg-amber-500/5 transition-colors flex items-center justify-center gap-2 text-sm text-foreground/60"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : <Paperclip className="h-5 w-5" />}
          {uploading ? "Uploading..." : "Attach a photo or PDF of the receipt"}
        </button>
      )}
      <input ref={input} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label="Receipt file" />
    </div>
  )
}
