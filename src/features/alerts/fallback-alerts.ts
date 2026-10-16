// Starter alerts shown when the database is unreachable or not yet migrated.
// Keep in sync with the seed data in
// the backend seed file (rynexnative-backend: apps/alerts/seed_alerts.json)
import type { SecurityAlert } from "./types"

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

export const fallbackAlerts: SecurityAlert[] = [
  {
    id: "fallback-1",
    slug: "ujumbe-wa-tuma-kwa-namba-hii",
    title: "The \"Send that money to this number instead\" SMS",
    summary: "Scammers send an SMS that looks like it came from someone you know, asking you to send money to a different number. Don't send anything before you verify.",
    description: "This is one of the most widespread scams in Tanzania. You receive an ordinary SMS (not one from your mobile network) saying something like \"Don't send the money to my number, send it to this one: 07XX...\" or \"I sent you money by mistake, please send it back\".\n\nScammers send this message to thousands of people, hoping some of them really are waiting to send or receive money. They often use common names like \"Mama\", \"Boss\" or \"Brother\" so you believe them.",
    category: "Mobile Money",
    severity: "high",
    signs: [
      "The message comes from a number you don't know or haven't saved",
      "You are asked to send money to a different number than usual",
      "The message is urgent: \"send it now\", \"I'm in hospital\", \"I'm stuck\"",
      "The \"money sent to you by mistake\" message did not come from M-Pesa, Mixx by Yas or Airtel Money themselves",
    ],
    prevention: [
      "Before sending money, call the person on a number you know and confirm",
      "Check your balance directly in your network's menu (e.g. *150*00# for M-Pesa) before \"returning\" any money",
      "Genuine money-received messages come from the network's name (e.g. M-PESA), not an ordinary number",
      "Teach your parents and older relatives about this scam",
    ],
    if_affected: [
      "Call your network's customer care immediately and ask them to block the transaction",
      "Keep the message and the scammer's number; don't delete anything",
      "Report it at the nearest police station (Cybercrime Unit) and get an RB number",
      "Report the number to TCRA by sending an SMS to 15040",
    ],
    is_published: true,
    published_at: daysAgo(2),
  },
  {
    id: "fallback-2",
    slug: "kazi-feki-za-mtandaoni",
    title: "Fake online jobs on WhatsApp and Telegram",
    summary: "You are added to a group and promised payment for liking videos or writing reviews, then asked to \"invest\" to earn more. It's a scam.",
    description: "This scam starts with a WhatsApp message from a foreign or local number: \"Hello, we are looking for people to do part-time work from home. You can earn TZS 50,000 to 300,000 a day.\"\n\nAt first you are paid a small amount for easy tasks (liking YouTube or TikTok videos) so you trust them. Later you are told to join \"VIP tasks\" or \"paid tasks\" that require you to deposit money first. Once you deposit, the money never comes out and you are asked to add more to \"unlock\" your account.",
    category: "WhatsApp & Telegram",
    severity: "high",
    signs: [
      "You received a job offer you never applied for, from an unknown number",
      "The pay is far too high for very little work",
      "You are asked to pay a fee, \"capital\" or a \"deposit\" to get the job or withdraw your earnings",
      "A \"mentor\" or \"receptionist\" pressures you on Telegram",
    ],
    prevention: [
      "A real company never asks you to pay to get a job",
      "Never deposit money on any platform to \"unlock\" your earnings",
      "Search the company name online together with the word \"scam\" before joining",
      "Block and report the number on WhatsApp",
    ],
    if_affected: [
      "Stop sending money immediately, even if you are promised a refund",
      "Call the customer care of the network you used to send money and report it",
      "Keep screenshots of the chats, numbers and all transactions",
      "Report it to the police (Cybercrime Unit)",
    ],
    is_published: true,
    published_at: daysAgo(6),
  },
  {
    id: "fallback-3",
    slug: "link-za-verify-akaunti",
    title: "\"Verify your account\" links on Instagram and Facebook",
    summary: "You get a message saying your account will be closed, or that you'll get a \"blue tick\" if you click a link. The link steals your password and takes over your account.",
    description: "Scammers send DMs or emails that look like they come from Meta, Instagram or Facebook: \"Your account violated copyright and will be disabled within 24 hours\" or \"You have been selected for a verification badge\".\n\nThe link takes you to a page that looks exactly like Instagram or Facebook. If you enter your username, password or SMS code, the scammers log in to your account, change the password and start scamming your friends in your name.",
    category: "Social Media",
    severity: "medium",
    signs: [
      "The message threatens that your account will be closed very soon",
      "The link does not end with the real instagram.com or facebook.com (e.g. instagram-support-help.com)",
      "You are asked for an SMS or \"2FA\" code you received",
      "The message comes from an unverified or newly created account",
    ],
    prevention: [
      "Turn on Two-Factor Authentication (2FA) using an app like Google Authenticator",
      "Instagram and Facebook don't send messages like this through DMs",
      "Never give anyone a code you received by SMS, even if they say they work for Meta",
      "Check official messages under Settings > Security > Emails from Instagram",
    ],
    if_affected: [
      "Change your password immediately if you can still log in, and log out of all devices",
      "If you are locked out, use instagram.com/hacked or facebook.com/hacked",
      "Tell your friends through another channel not to send money in your name",
      "Contact us and we'll help you recover and secure your account",
    ],
    is_published: true,
    published_at: daysAgo(10),
  },
  {
    id: "fallback-4",
    slug: "zawadi-feki-za-bando",
    title: "\"You've won free data\" links spreading on WhatsApp",
    summary: "A message says a mobile network is giving away free GBs or an anniversary gift if you share it with 10 people. These links collect your details.",
    description: "Friends and family forward this message without knowing it's a scam: \"Vodacom/Yas/Airtel is celebrating 25 years, get 50GB free! Click here.\"\n\nThe link asks you a few questions, then tells you to share the message with 10 people or 5 groups to \"receive your gift\". The gift never arrives, but the link collects your number, may sign you up for paid services, or sends you to ads that carry malware.",
    category: "WhatsApp & Telegram",
    severity: "low",
    signs: [
      "You are told to share with many people to get the prize",
      "The link is not on the network's official website",
      "The message has many spelling mistakes or lots of emoji",
      "The offer looks too good to be true",
    ],
    prevention: [
      "Check the offer on the company's official website or pages",
      "Don't forward unverified prize messages, even if a friend sent them",
      "Never enter your phone number, PIN or personal details on these links",
    ],
    if_affected: [
      "If you entered your number, check whether you were subscribed to paid services and unsubscribe",
      "If you downloaded an app or file, remove it and scan your phone",
      "Tell the people you forwarded it to that the message is a scam",
    ],
    is_published: true,
    published_at: daysAgo(14),
  },
]
