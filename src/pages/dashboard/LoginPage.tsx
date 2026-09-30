import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { useLogin } from "@/features/dashboard/api"
import { buttonPrimary, inputClass } from "@/features/dashboard/styles"
import { ApiError, validationMessage } from "@/lib/api"

function loginError(error: unknown) {
  if (error instanceof ApiError && error.status === 429) return "Umejaribu mara nyingi sana. Subiri kidogo kisha ujaribu tena."
  if (error instanceof ApiError && error.status === 400) return validationMessage(error) ?? "Username au password si sahihi."
  return "Imeshindikana kuunganisha na server. Angalia internet yako."
}

export default function LoginPage() {
  const login = useLogin()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "var(--gradient-hero)" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate({ username: username.trim(), password })
        }}
        className="glass rounded-3xl p-8 w-full max-w-sm space-y-5 animate-fade-in"
      >
        <div className="text-center">
          <img src="/uploads/0851ce38-9e9d-4f8c-9adc-2b4ebef6b80c.png" alt="" className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-poppins text-white">RynexNative Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Ingia kusimamia maudhui na wateja</p>
        </div>

        {login.isError && (
          <p role="alert" className="text-sm rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3">
            {loginError(login.error)}
          </p>
        )}

        <label className="block">
          <span className="block text-sm font-medium mb-1.5 text-slate-200">Username</span>
          <input
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5 text-slate-200">Password</span>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ficha password" : "Onyesha password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center text-foreground/50 hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <button type="submit" disabled={login.isPending} className={`${buttonPrimary} w-full`}>
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Ingia
        </button>
      </form>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Rudi kwenye website
      </Link>
    </div>
  )
}
