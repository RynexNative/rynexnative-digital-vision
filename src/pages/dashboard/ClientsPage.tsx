import { useState } from "react"
import { Globe, Mail, MapPin, Pencil, Phone, Plus, Server as ServerIcon, User } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Pill } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { whatsappNumber } from "@/features/dashboard/types"
import { useOpsList } from "@/features/operations/api"
import { CardHead, Due, OpsListPage } from "@/features/operations/OpsListPage"
import { RecordSheet } from "@/features/operations/RecordSheet"
import { toFormValues, type Values } from "@/features/operations/form-values"
import { clientDefaults, clientFields, domainDefaults, domainFields, serviceDefaults, serviceFields } from "@/features/operations/fields"
import {
  CLIENT_KINDS,
  CLIENT_STATUS,
  DOMAIN_STATUS,
  END_REASONS,
  SERVICE_STATUS,
  SERVICE_TYPES,
  formatDate,
  type OpsClient,
  type OpsDomain,
  type OpsServer,
  type OpsService,
} from "@/features/operations/types"

type Editing =
  | { kind: "client"; record: OpsClient }
  | { kind: "service"; record: OpsService | null }
  | { kind: "domain"; record: OpsDomain | null }

function ClientDetail({ client, onClose }: { client: OpsClient; onClose: () => void }) {
  const params = { client: client.id }
  const { data: services = [] } = useOpsList<OpsService>("services", params)
  const { data: domains = [] } = useOpsList<OpsDomain>("domains", params)
  const { data: servers = [] } = useOpsList<OpsServer>("servers", params)
  const [editing, setEditing] = useState<Editing | null>(null)
  const ref = { id: client.id, name: client.name }

  const sheet = () => {
    if (!editing) return null
    const close = () => setEditing(null)
    if (editing.kind === "client")
      return (
        <RecordSheet
          resource="clients"
          open
          onClose={() => {
            close()
          }}
          title={`Edit ${client.name}`}
          fields={clientFields}
          initial={toFormValues(clientFields, editing.record as unknown as Values, clientDefaults)}
          recordId={client.id}
          deleteText="The client and all its services will be deleted. Domains and subscriptions stay, without an owner. To keep the history, mark the client as former instead."
        />
      )
    const isService = editing.kind === "service"
    const fields = isService ? serviceFields : domainFields
    const defaults = { ...(isService ? serviceDefaults : domainDefaults), client: client.id }
    return (
      <RecordSheet
        key={editing.record?.id ?? `new-${editing.kind}`}
        resource={isService ? "services" : "domains"}
        open
        onClose={close}
        title={editing.record ? (isService ? (editing.record as OpsService).title : (editing.record as OpsDomain).name) : isService ? "Add service" : "Add domain"}
        fields={fields}
        initial={editing.record ? toFormValues(fields, editing.record as unknown as Values, defaults) : { ...defaults, client: ref.id }}
        recordId={editing.record?.id}
      />
    )
  }

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-5 text-left">
            <div className="flex items-start justify-between gap-3 pr-6">
              <div>
                <SheetTitle className="text-2xl">{client.name}</SheetTitle>
                <p className="text-sm text-foreground/60">
                  {[CLIENT_KINDS[client.kind], client.sector].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Pill className={CLIENT_STATUS[client.status].className}>{CLIENT_STATUS[client.status].label}</Pill>
            </div>
          </SheetHeader>

          <div className="glass rounded-2xl p-4 mb-6 grid sm:grid-cols-2 gap-2 text-sm">
            {client.contact_name && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {client.contact_name}
              </p>
            )}
            {client.phone && (
              <a href={`https://wa.me/${whatsappNumber(client.phone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4 text-primary" />
                {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-primary truncate">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                {client.email}
              </a>
            )}
            {client.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {client.location}
              </p>
            )}
            {client.notes && <p className="sm:col-span-2 text-foreground/70 whitespace-pre-line border-t border-border pt-2 mt-1">{client.notes}</p>}
            <div className="sm:col-span-2">
              <button type="button" onClick={() => setEditing({ kind: "client", record: client })} className={buttonGhost}>
                <Pencil className="h-4 w-4" />
                Edit client
              </button>
            </div>
          </div>

          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Services & support</h3>
              <button type="button" onClick={() => setEditing({ kind: "service", record: null })} className={buttonGhost}>
                <Plus className="h-4 w-4" />
                Add service
              </button>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-foreground/55">No services recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {services.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setEditing({ kind: "service", record: s })} className="w-full text-left glass rounded-xl p-3 hover:border-primary/40">
                      <CardHead title={s.title} pill={SERVICE_STATUS[s.status]} sub={SERVICE_TYPES[s.service_type]} />
                      {s.status === "ended" ? (
                        <p className="text-sm text-foreground/70">Why: {END_REASONS[s.end_reason] ?? "—"}</p>
                      ) : (
                        s.support_until && <Due label="Support until" date={formatDate(s.support_until)} days={s.days_left} soon={30} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Domains</h3>
              <button type="button" onClick={() => setEditing({ kind: "domain", record: null })} className={buttonGhost}>
                <Plus className="h-4 w-4" />
                Add domain
              </button>
            </div>
            {domains.length === 0 ? (
              <p className="text-sm text-foreground/55">No domains recorded.</p>
            ) : (
              <ul className="space-y-2">
                {domains.map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => setEditing({ kind: "domain", record: d })} className="w-full text-left glass rounded-xl p-3 hover:border-primary/40">
                      <CardHead title={d.name} pill={DOMAIN_STATUS[d.status]} />
                      {d.status === "managed" && <Due label="Expires" date={formatDate(d.expires_on)} days={d.days_left} soon={30} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {servers.length > 0 && (
            <section>
              <h3 className="font-semibold mb-2">Hosted on</h3>
              <ul className="flex flex-wrap gap-2">
                {servers.map((s) => (
                  <li key={s.id} className="glass rounded-full px-3 h-9 inline-flex items-center gap-2 text-sm">
                    <ServerIcon className="h-4 w-4 text-primary" />
                    {s.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </SheetContent>
      </Sheet>
      {sheet()}
    </>
  )
}

export default function ClientsPage() {
  const [open, setOpen] = useState<OpsClient | null>(null)
  const { data: fresh, isFetching } = useOpsList<OpsClient>("clients", {}, open !== null)
  // Show the latest copy after edits made inside the detail view; close it once the client is deleted
  const latest = open && fresh?.find((c) => c.id === open.id)
  const current = open ? latest ?? (fresh && !isFetching ? null : open) : null

  return (
    <>
      <OpsListPage<OpsClient>
        resource="clients"
        title="Clients"
        subtitle="Companies, institutions and organizations we work with, and whether we still support them."
        addLabel="Add client"
        emptyText="No clients here yet"
        tabs={[
          { id: "all", label: "All", params: {} },
          { id: "supported", label: "Supported", params: { support: "supported" } },
          { id: "unsupported", label: "Not supported", params: { support: "unsupported", status: "active" } },
          { id: "prospect", label: "Prospects", params: { status: "prospect" } },
          { id: "former", label: "Former", params: { status: "former" } },
        ]}
        fields={clientFields}
        defaults={clientDefaults}
        recordTitle={(c) => (c ? `Edit ${c.name}` : "Add client")}
        onOpen={setOpen}
        card={(c) => (
          <>
            <CardHead title={c.name} pill={CLIENT_STATUS[c.status]} sub={[CLIENT_KINDS[c.kind], c.sector, c.location].filter(Boolean).join(" · ")} />
            <p className="text-sm flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className={c.supported_services ? "text-emerald-600 font-semibold" : "text-foreground/55"}>
                {c.supported_services}/{c.total_services} services supported
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/55">
                <Globe className="h-3.5 w-3.5" />
                {c.domains_managed} domain{c.domains_managed === 1 ? "" : "s"}
              </span>
            </p>
            {c.contact_name && <p className="text-xs text-foreground/55 mt-1">{c.contact_name}{c.phone ? ` · ${c.phone}` : ""}</p>}
          </>
        )}
      />
      {current && <ClientDetail client={current} onClose={() => setOpen(null)} />}
    </>
  )
}
