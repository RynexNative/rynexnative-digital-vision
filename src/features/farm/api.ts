import { useMutation } from "@tanstack/react-query"
import { query, uploadFile, useDashboardQuery, useInvalidate } from "@/features/dashboard/api"
import { dashboardFile, dashboardRequest } from "@/lib/api"
import type { Batch, Customer, CustomerList, CustomerNote, ExpenseList, FarmReport, FarmSummary, HealthEvent, Order, Sale, TrashItem } from "./types"

export type FarmResource = "batches" | "health" | "expenses" | "customers" | "sales" | "orders" | "customer-notes"

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
export const useCustomerList = (params: Record<string, string> = {}, enabled = true) =>
  useDashboardQuery<CustomerList>(key("customers", params), `/farm/customers/${query(params)}`, enabled)
/** All customers (for pickers) */
export function useCustomers(params: Record<string, string> = {}, enabled = true) {
  const result = useCustomerList(params, enabled)
  return { ...result, data: result.data?.results }
}
export const useCustomer = (id: string) => useDashboardQuery<Customer>(key("customers", id), `/farm/customers/${id}/`)
export const useCustomerNotes = (params: Record<string, string>, enabled = true) =>
  useDashboardQuery<CustomerNote[]>(key("customer-notes", params), `/farm/customer-notes/${query(params)}`, enabled)
export const useOrders = (params: Record<string, string>, enabled = true) => useDashboardQuery<Order[]>(key("orders", params), `/farm/orders/${query(params)}`, enabled)
export const useTrash = () => useDashboardQuery<TrashItem[]>(key("trash"), "/farm/trash/")
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

/** Deleting keeps the record (marked deleted, with the reason); it can be restored. */
export function useDeleteFarm(resource: FarmResource) {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => dashboardRequest<void>(`/farm/${resource}/${id}/`, { method: "DELETE", body: { reason } }),
    onSuccess: done,
  })
}

/** Payments and refunds, on a sale or an order */
export type PaidThing = "sales" | "orders"

export function usePayment<T = Sale | Order>(target: PaidThing) {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => dashboardRequest<T>(`/farm/${target}/${id}/payments/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useDeletePayment<T = Sale | Order>(target: PaidThing) {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ id, payment, reason }: { id: number; payment: number; reason: string }) =>
      dashboardRequest<T>(`/farm/${target}/${id}/payments/${payment}/`, { method: "DELETE", body: { reason } }),
    onSuccess: done,
  })
}

export function useOrderAction() {
  const done = useFarmDone()
  return useMutation({
    mutationFn: ({ id, action, data }: { id: number; action: "deliver" | "cancel"; data: Record<string, unknown> }) =>
      dashboardRequest<Order & { sale_balance?: string }>(`/farm/orders/${id}/${action}/`, { method: "POST", body: data }),
    onSuccess: done,
  })
}

export function useRestore() {
  const done = useFarmDone()
  return useMutation({
    mutationFn: (item: { kind: string; id: number }) => dashboardRequest<{ detail: string }>("/farm/trash/restore/", { method: "POST", body: item }),
    onSuccess: done,
  })
}

/** Downloads the (filtered) customer list as a spreadsheet or as phone contacts. */
export async function downloadCustomers(as: "csv" | "vcf", params: Record<string, string>) {
  const blob = await dashboardFile(`/farm/customers/export/${query({ ...params, as })}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const day = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = as === "csv" ? `chicken-point-customers-${day}.csv` : `chicken-point-contacts-${day}.vcf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Receipts (photo or PDF) go straight to Cloudinary, in the farm's own folder. */
export const uploadReceipt = (file: File) => uploadFile(file, "/farm/uploads/signature/")
