import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, apiGet, apiPost } from "@/lib/api"
import type { EventDetail, EventSummary, Ticket } from "./types"

const notFound = (error: unknown) => error instanceof ApiError && error.status === 404

export function useEvents(when: "upcoming" | "past") {
  return useQuery({
    queryKey: ["events", when],
    queryFn: () => apiGet<EventSummary[]>(`/api/events/?when=${when}`),
    staleTime: 60 * 1000,
  })
}

export function useEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ["events", "detail", slug],
    queryFn: () => apiGet<EventDetail>(`/api/events/${slug}/`),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
    retry: (count, error) => !notFound(error) && count < 2,
  })
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => apiGet<Ticket>(`/api/tickets/${id}/`),
    enabled: Boolean(id),
    retry: (count, error) => !notFound(error) && count < 2,
    // While a payment is being checked, look for the confirmation now and then
    refetchInterval: (query) => (query.state.data?.status === "payment_submitted" ? 60 * 1000 : false),
  })
}

export type RegistrationInput = { name: string; phone: string; email: string; organization: string; website: string }

export function useRegister(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegistrationInput) => apiPost<Ticket>(`/api/events/${slug}/register/`, input),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["ticket", ticket.id], ticket)
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useSubmitPayment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reference: string) => apiPost<Ticket>(`/api/tickets/${id}/payment/`, { reference }),
    onSuccess: (ticket) => queryClient.setQueryData(["ticket", id], ticket),
  })
}
