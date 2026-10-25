export type Reason = { icon: string; title: string; text: string; proof: string }

export type WhyChooseUsContent = {
  eyebrow: string
  title: string
  highlight: string
  subtitle: string
  reasons: Reason[]
  promises: string[]
  show_note: boolean
  note_greeting: string
  note_text: string
  note_name: string
  note_role: string
  note_photo: string
  show_numbers: boolean
}

/** Same wording as the server's defaults; shown until the saved content arrives or if the API is unreachable. */
export const DEFAULT_WHY_CHOOSE_US: WhyChooseUsContent = {
  eyebrow: "Why RynexNative",
  title: "Technology from people who treat you",
  highlight: "like family",
  subtitle:
    "Karibu. We are a Tanzanian team who pick up the phone, speak your language and stay with you long after launch, because your success is personal to us.",
  reasons: [
    {
      icon: "handshake",
      title: "You talk to the people who build it",
      text: "No call centres and no hand-offs. From the first chat to launch you know your team by name, and you can reach us on WhatsApp.",
      proof: "Reply within one working day",
    },
    {
      icon: "shield",
      title: "Your data stays yours",
      text: "We protect your systems as if they were our own, sign confidentiality agreements, and never show your work without your permission.",
      proof: "NDA on request",
    },
    {
      icon: "file",
      title: "No surprises on price or time",
      text: "Before any work starts you get a written quotation and timeline. You pay in stages as the work is delivered.",
      proof: "Agreed in writing",
    },
    {
      icon: "map",
      title: "Close to you",
      text: "We are a Tanzanian team. We can sit with your people, learn how you really work, and train your staff in Kiswahili or English.",
      proof: "Kiswahili & English",
    },
    {
      icon: "lifebuoy",
      title: "We stay after launch",
      text: "Support, updates and hosting come from the same people who built your system, so problems are understood and fixed quickly.",
      proof: "Support plans for every system",
    },
    {
      icon: "key",
      title: "What you pay for is yours",
      text: "Source code, domain, accounts and documentation are handed over to you. You are never locked in with us.",
      proof: "Full handover",
    },
  ],
  promises: ["Written quotation before we start", "Pay in stages: M-Pesa, bank or cash", "Source code handed over to you", "Support in Kiswahili and English"],
  show_note: true,
  note_greeting: "Karibu sana",
  note_text:
    "When you work with us, you are not a ticket number. I want every client to feel at home with us: listened to, told the truth, and looked after long after the launch. If something is not right, call me.",
  note_name: "Casto S. Shirima",
  note_role: "Founder & CEO, RynexNative",
  note_photo: "",
  show_numbers: true,
}
