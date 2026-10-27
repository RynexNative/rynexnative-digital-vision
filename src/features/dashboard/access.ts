import { useCurrentUser } from "./api"

/**
 * What the signed-in person's role allows, to show only what they can use.
 * This is convenience only: the server checks the role on every request.
 */
export function usePermissions() {
  const { data: user } = useCurrentUser()
  const permissions = new Set(user?.permissions ?? [])
  return {
    user,
    can: (code: string) => permissions.has(code),
    canAny: (...codes: string[]) => codes.some((code) => permissions.has(code)),
  }
}
