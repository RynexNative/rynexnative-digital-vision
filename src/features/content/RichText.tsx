type Block = { type: "heading"; text: string } | { type: "list"; items: string[] } | { type: "paragraph"; text: string }

/** Splits the editor text into headings ("## "), bullet lists ("- ") and paragraphs, line by line. */
function parseRichText(text: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join("\n") })
    if (list.length) blocks.push({ type: "list", items: list })
    paragraph = []
    list = []
  }

  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim()
    if (!line) {
      flush()
    } else if (line.startsWith("## ")) {
      flush()
      blocks.push({ type: "heading", text: line.slice(3).trim() })
    } else if (line.startsWith("- ")) {
      if (paragraph.length) flush()
      list.push(line.slice(2).trim())
    } else {
      if (list.length) flush()
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

/**
 * Renders the simple text format used by the dashboard editors:
 * blank line = new paragraph, "## " = heading, "- " = bullet list.
 * Everything is rendered as text (no HTML), so content cannot inject markup.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {parseRichText(text).map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} className="text-xl md:text-2xl font-bold font-poppins text-foreground mt-8 mb-3">
              {block.text}
            </h2>
          )
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="space-y-2 my-4">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="whitespace-pre-line my-4">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
