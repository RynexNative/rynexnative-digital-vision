// Remember tickets on this device so people can find them again from the event page.
const KEY = "rn-my-tickets"

type Saved = Record<string, string> // event slug -> ticket id

function read(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Saved
  } catch {
    return {}
  }
}

export function savedTicketFor(slug: string): string | null {
  return read()[slug] ?? null
}

export function saveTicket(slug: string, ticketId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [slug]: ticketId }))
  } catch {
    // Storage unavailable (private mode): the ticket link is still shown and emailed
  }
}
