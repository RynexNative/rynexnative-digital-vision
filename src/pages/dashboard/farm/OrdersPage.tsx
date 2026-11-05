import { useState } from "react"
import { FilterTabs, PageHeader } from "@/features/dashboard/ui"
import { OrderList } from "@/features/farm/orders"

type Tab = "open" | "done"

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("open")
  return (
    <div>
      <PageHeader title="Orders & deposits" subtitle="Birds booked ahead, what was paid in advance, and what is left to deliver." />
      <div className="mb-5">
        <FilterTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "open", label: "To deliver" },
            { id: "done", label: "Delivered & cancelled" },
          ]}
        />
      </div>
      <OrderList key={tab} params={{ status: tab }} showAdd={tab === "open"} />
    </div>
  )
}
