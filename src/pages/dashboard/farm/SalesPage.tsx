import { useState } from "react"
import { FilterTabs, PageHeader } from "@/features/dashboard/ui"
import { SaleList } from "@/features/farm/lists"

type Tab = "sales" | "unpaid"

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>("sales")
  return (
    <div>
      <PageHeader title="Sales" subtitle="Chicken sold to hotels and other customers, and the money still to come in." />
      <div className="mb-5">
        <FilterTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "sales", label: "All sales" },
            { id: "unpaid", label: "Not fully paid" },
          ]}
        />
      </div>
      {tab === "sales" && <SaleList />}
      {tab === "unpaid" && <SaleList params={{ unpaid: "1" }} showAdd={false} />}
    </div>
  )
}
