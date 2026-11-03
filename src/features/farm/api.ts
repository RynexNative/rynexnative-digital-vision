import { useMutation } from "@tanstack/react-query"
import { query, uploadFile, useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { dashboardRequest } from "@/lib/api"
import type { Batch, Customer, ExpenseList, FarmReport, FarmSummary, HealthEvent, Sale } from "./types"

export type FarmResource = "batches" | "health" | "expenses" | "customers" | "sales"

const key = (...parts: unknown[]) => ["dashboard", "farm", ...parts]

export const useFarmSummary = () => useDashboardQuery<FarmSummary>(key("summary"), "/farm/summary/")
export const useFarmReport = (year: string, enabled = true) => useDashboardQuery<FarmReport>(key("reports", year), `/farm/reports/${query({ year })}`, enabled)
export const useBatches = (params: Record<string, string> = {}, enabled = true) =>
  useDashboardQuery<Batch[]>(key("batches", params), `/farm/batches/${query(params)}`, enabled)
export const useBatch = (id: string) => useDashboardQuery<Batch>(key("batches", id), `/farm/batches/${id}/`)
export const useHealth = (params: Record<string, string>, enabled = true) =>
  useDashboardQuery<HealthEvent[]>(key("health", params), `/farm/health/${query(params)}`, enabled)
export const useExpenses = (params: Record<string, string>, enabled = true) =>
  useDashboardQuery<ExpenseList>(key("expenses", params), `/farm/expenses/${query(params)}`, enabled)
export const useCustomers = (params: Record<string, string> = {}, enabled = true) =>
  useDashboardQuery<Customer[]>(key("customers", params), `/farm/customers/${query(params)}`, enabled)
export const useSales = (params: Record<string, string>, enabled = true) => useDashboardQuery<Sale[]>(key("sales", params), `/farm/sales/${query(params)}`, enabled)

/** Every farm figure depends on the others (alive birds, profit...): refresh them all after a change. */
function useFarmDone() {
  const invalidate = useInvalidate()
  return () => invalidate("farm", "inbox")
}

export function useSaveFarm<T = unknown>(resource: FarmResource) {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      id
        ? dashboardRequest<T>(`/farm/${resource}/${id}/`, { method: "PATCH", body: data })
        : dashboardRequest<T>(`/farm/${resource}/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeleteFarm(resource: FarmResource) {
  const done = useFarmDone()
  return useMutation({ mutationFn: (id: number) => dashboardRequest<void>(`/farm/${resource}/${id}/`, { method: "DELETE" }), onSuccess: done })
}

export function useSalePayment() {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ sale, data }: { sale: number; data: Record<string, unknown> }) => dashboardRequest<Sale>(`/farm/sales/${sale}/payments/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeleteSalePayment() {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ sale, payment }: { sale: number; payment: number }) => dashboardRequest<Sale>(`/farm/sales/${sale}/payments/${payment}/`, { method: "DELETE" }),
    onSuccess: done,
  })
}

/** Receipts (photo or PDF) go straight to Cloudinary, in the farm's own folder. */
export const uploadReceipt = (file: File) => uploadFile(file, "/farm/uploads/signature/")
