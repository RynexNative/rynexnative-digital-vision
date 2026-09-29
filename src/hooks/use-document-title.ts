import { useEffect } from "react"

const DEFAULT_TITLE = "RynexNative - Empowering Digital Innovation"

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | RynexNative` : DEFAULT_TITLE
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
