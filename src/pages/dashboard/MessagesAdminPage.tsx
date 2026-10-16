import { useState } from "react"
import { Archive, Building2, Check, Clock, Mail, RotateCcw } from "lucide-react"
import { useMessagesAdmin, useSetMessageStatus } from "@/features/dashboard/api"
import { MESSAGE_STATUS, formatWhen, type DashboardMessage, type MessageStatus } from "@/features/dashboard/types"
import { EmptyState, ErrorState, FilterTabs, ListSkeleton, PageHeader, Pill, SearchInput } from "@/features/dashboard/ui"
import { buttonGhost } from "@/features/dashboard/styles"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { errorMessage } from "@/lib/api"

type Filter = MessageStatus | "all"

function MessageCard({ message }: { message: DashboardMessage }) {
  const { toast } = useToast()
  const setStatus = useSetMessageStatus()

  const change = (status: MessageStatus) =>
    setStatus.mutate(
      { id: message.id, status },
      {
        onSuccess: () => toast({ title: MESSAGE_STATUS[status].label }),
        onError: (error) => toast({ variant: "destructive", title: "Something went wrong", description: errorMessage(error, "Please try again.") }),
      },
    )

  const reply = `mailto:${message.email}?subject=${encodeURIComponent("Re: Your message to RynexNative")}&body=${encodeURIComponent(
    `Hi ${message.name.split(" ")[0]},\n\nThank you for contacting RynexNative.\n\n\n\n---\nYour message:\n${message.message}`,
  )}`

  return (
    <li className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{message.name}</p>
          <p className="text-sm text-foreground/60 truncate">{message.email}</p>
          {message.company && (
            <p className="text-xs text-foreground/50 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {message.company}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <Pill className={MESSAGE_STATUS[message.status].className}>{MESSAGE_STATUS[message.status].label}</Pill>
          <p className="text-[11px] text-foreground/50 mt-1 flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3" />
            {formatWhen(message.created_at)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-foreground/85 whitespace-pre-line leading-relaxed">{message.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={reply} onClick={() => message.status === "new" && change("replied")} className="h-9 px-3 rounded-lg bg-gradient-primary text-white inline-flex items-center gap-1.5 text-sm font-semibold">
          <Mail className="h-4 w-4" />
          Reply by email
        </a>
        {message.status !== "replied" && (
          <button type="button" onClick={() => change("replied")} disabled={setStatus.isPending} className={buttonGhost}>
            <Check className="h-4 w-4" />
            Mark replied
          </button>
        )}
        {message.status !== "archived" ? (
          <button type="button" onClick={() => change("archived")} disabled={setStatus.isPending} className={buttonGhost}>
            <Archive className="h-4 w-4" />
            Archive
          </button>
        ) : (
          <button type="button" onClick={() => change("new")} disabled={setStatus.isPending} className={buttonGhost}>
            <RotateCcw className="h-4 w-4" />
            Restore
          </button>
        )}
      </div>
    </li>
  )
}

export default function MessagesAdminPage() {
  const [filter, setFilter] = useState<Filter>("new")
  const [q, setQ] = useState("")
  const search = useDebouncedValue(q, 300)
  const { data = [], isLoading, isError, refetch } = useMessagesAdmin(filter === "all" ? "" : filter, search)

  return (
    <>
      <PageHeader title="Messages" subtitle="Messages from the contact form on the website." />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { id: "new", label: "New" },
            { id: "replied", label: "Replied" },
            { id: "archived", label: "Archived" },
            { id: "all", label: "All" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, message..." />
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title={filter === "new" && !search ? "No new messages 🎉" : "No messages here"} />
      ) : (
        <ul className="space-y-3">
          {data.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </ul>
      )}
    </>
  )
}
