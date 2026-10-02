import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Loader2, Search, XCircle } from "lucide-react"
import { useCheckIn } from "@/features/dashboard/api"
import type { CheckInResult } from "@/features/dashboard/types"
import { PageHeader } from "@/features/dashboard/ui"
import { buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Scanner = { start: () => Promise<void>; stop: () => void; destroy: () => void }

const RESULT_STYLE: Record<CheckInResult["result"], { className: string; icon: React.ReactNode; title: string }> = {
  ok: { className: "bg-emerald-500/15 border-emerald-500/40", icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />, title: "Karibu!" },
  already: { className: "bg-amber-500/15 border-amber-500/40", icon: <AlertTriangle className="h-10 w-10 text-amber-500" />, title: "Tayari ameingia" },
  not_confirmed: { className: "bg-red-500/15 border-red-500/40", icon: <XCircle className="h-10 w-10 text-red-500" />, title: "Haijathibitishwa" },
  not_found: { className: "bg-red-500/15 border-red-500/40", icon: <XCircle className="h-10 w-10 text-red-500" />, title: "Tiketi haipo" },
}

function feedback(ok: boolean) {
  try {
    navigator.vibrate?.(ok ? 80 : [80, 60, 80])
  } catch {
    // Vibration not supported
  }
}

export default function CheckInPage() {
  const checkIn = useCheckIn()
  const video = useRef<HTMLVideoElement>(null)
  const scanner = useRef<Scanner | null>(null)
  const lastCode = useRef<{ code: string; at: number }>({ code: "", at: 0 })
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [manual, setManual] = useState("")
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [history, setHistory] = useState<{ name: string; code: string; result: CheckInResult["result"]; at: Date }[]>([])

  const submit = useCallback(
    (raw: string) => {
      const code = raw.trim()
      if (!code) return
      // The camera sees the same QR many times per second; ignore repeats for 3 seconds
      const now = Date.now()
      if (lastCode.current.code === code && now - lastCode.current.at < 3000) return
      lastCode.current = { code, at: now }
      checkIn.mutate(code, {
        onSuccess: (res) => {
          setResult(res)
          feedback(res.result === "ok")
          setHistory((h) =>
            [{ name: res.registration?.name ?? "—", code: res.registration?.ticket_code ?? code, result: res.result, at: new Date() }, ...h].slice(0, 20),
          )
        },
        onError: (error) =>
          setResult({ result: "not_found", detail: errorMessage(error, "Imeshindikana kuunganisha na server.") }),
      })
    },
    [checkIn],
  )

  const startCamera = async () => {
    setCameraError("")
    try {
      const { default: QrScanner } = await import("qr-scanner")
      if (!video.current) return
      scanner.current?.destroy()
      scanner.current = new QrScanner(video.current, (r: { data: string }) => submit(r.data), {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
      }) as unknown as Scanner
      await scanner.current.start()
      setCameraOn(true)
    } catch {
      setCameraError("Kamera haikufunguka. Ruhusu kamera kwenye browser, au andika namba ya tiketi hapa chini.")
      setCameraOn(false)
    }
  }

  const stopCamera = () => {
    scanner.current?.stop()
    setCameraOn(false)
  }

  useEffect(() => () => scanner.current?.destroy(), [])

  const style = result ? RESULT_STYLE[result.result] : null

  return (
    <>
      <PageHeader title="Scan tiketi" subtitle="Elekeza kamera kwenye QR code ya mshiriki, au andika namba ya tiketi." />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative glass rounded-3xl overflow-hidden aspect-square bg-black/40">
            <video ref={video} className={cn("w-full h-full object-cover", !cameraOn && "hidden")} muted playsInline />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Camera className="h-12 w-12 text-foreground/40" />
                <button type="button" onClick={startCamera} className={buttonPrimary}>
                  <Camera className="h-4 w-4" />
                  Washa kamera
                </button>
                {cameraError && <p className="text-sm text-red-400 max-w-xs">{cameraError}</p>}
              </div>
            )}
          </div>
          {cameraOn && (
            <button type="button" onClick={stopCamera} className="w-full h-11 rounded-xl glass inline-flex items-center justify-center gap-2 text-sm">
              <CameraOff className="h-4 w-4" />
              Zima kamera
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lastCode.current = { code: "", at: 0 }
              submit(manual)
              setManual("")
            }}
            className="flex gap-2"
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              placeholder="Namba ya tiketi, mf. K7M2QX9P"
              maxLength={20}
              className={cn(inputClass, "font-mono uppercase")}
              aria-label="Namba ya tiketi"
            />
            <button type="submit" disabled={checkIn.isPending} className={cn(buttonPrimary, "px-4")} aria-label="Hakiki">
              {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div aria-live="assertive">
            {result && style ? (
              <div className={cn("rounded-3xl border-2 p-6 text-center animate-fade-in", style.className)}>
                <div className="flex justify-center mb-3">{style.icon}</div>
                <p className="text-2xl font-bold font-poppins">{style.title}</p>
                {result.registration && (
                  <>
                    <p className="text-xl font-semibold mt-2">{result.registration.name}</p>
                    <p className="text-sm text-foreground/70">{result.registration.event_title}</p>
                    <p className="font-mono text-sm mt-1">{result.registration.ticket_code}</p>
                  </>
                )}
                <p className="text-sm text-foreground/70 mt-3">{result.detail}</p>
              </div>
            ) : (
              <div className="glass rounded-3xl p-10 text-center text-foreground/50">Matokeo ya scan yataonekana hapa</div>
            )}
          </div>

          {history.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Walioscaniwa sasa hivi</h2>
              <ul className="glass rounded-2xl divide-y divide-foreground/10">
                {history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="truncate">{h.name}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs text-foreground/50">{h.code}</span>
                      {h.result === "ok" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : h.result === "already" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
