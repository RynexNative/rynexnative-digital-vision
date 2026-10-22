// Runs after `vite build`. Gives every public page its own HTML file with the
// real content, title, description, social preview and structured data, so
// Google (Search, News, Discover) and link previews can read it without
// running JavaScript. Also writes sitemap.xml, news-sitemap.xml, rss.xml,
// robots.txt and 404.html (the app shell GitHub Pages serves for other paths).
//
// The browser still loads the normal React app on top of each page.
// Set PRERENDER_STRICT=1 (CI does) to fail the build when the API cannot be reached,
// so a deploy never ships without its news pages.

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const SITE = "https://rynexnative.com"
const DIST = path.resolve("dist")
const STRICT = process.env.PRERENDER_STRICT === "1"
const ORG = "RynexNative"
const LOGO = `${SITE}/logo.png`
const DEFAULT_IMAGE = `${SITE}/preview.png`

async function apiBase() {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL.replace(/\/+$/, "")
  try {
    const env = await readFile(".env.production", "utf8")
    const match = env.match(/^VITE_API_URL=(.+)$/m)
    if (match) return match[1].trim().replace(/\/+$/, "")
  } catch {
    // no .env.production
  }
  return "https://api.rynexnative.com"
}

const API = await apiBase()
let apiFailed = false

async function getJson(pathname, fallback) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${API}${pathname}`, { signal: AbortSignal.timeout(20000), headers: { Accept: "application/json" } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      if (attempt === 3) {
        apiFailed = true
        console.warn(`prerender: could not load ${pathname} (${error.message})`)
        return fallback
      }
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const escapeHtml = (text = "") =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

const truncate = (text = "", max = 160) => {
  const clean = String(text).replace(/\s+/g, " ").trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`
}

/** Same transform as src/lib/media.ts: resize Cloudinary images on the fly */
function imageUrl(url, width) {
  if (!url) return ""
  const marker = "/image/upload/"
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url
  const [before, after] = url.split(marker)
  return `${before}${marker}f_auto,q_auto,c_limit,w_${width}/${after}`
}

/** Same format as src/features/content/RichText.tsx: blank line = paragraph, "## " = heading, "- " = list */
function richText(text = "") {
  const out = []
  let paragraph = []
  let list = []
  const flush = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(escapeHtml).join("<br>")}</p>`)
    if (list.length) out.push(`<ul>${list.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`)
    paragraph = []
    list = []
  }
  for (const raw of String(text).replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim()
    if (!line) flush()
    else if (line.startsWith("## ")) {
      flush()
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith("- ")) {
      if (paragraph.length) flush()
      list.push(line.slice(2).trim())
    } else {
      if (list.length) flush()
      paragraph.push(line)
    }
  }
  flush()
  return out.join("\n")
}

const listHtml = (items) => (items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "")
const date = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dar_es_Salaam" }) : "")
const xmlDate = (iso) => new Date(iso || Date.now()).toISOString()

const publisher = { "@type": "Organization", name: ORG, url: SITE, logo: { "@type": "ImageObject", url: LOGO } }

function breadcrumbs(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
  }
}

/* ------------------------------------------------------------------ */
/* Page writer                                                         */
/* ------------------------------------------------------------------ */

const template = await readFile(path.join(DIST, "index.html"), "utf8")
if (template.includes('class="prerendered"') || !template.includes('<div id="root"></div>')) {
  console.error("prerender: dist/index.html is already prerendered; run `vite build` first (npm run build does both)")
  process.exit(1)
}

// Tags each page sets for itself are removed from the shared template first
function stripPageTags(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?>/, "")
    .replace(/<meta\s+name="robots"[\s\S]*?>/, "")
    .replace(/<link\s+rel="canonical"[\s\S]*?>/, "")
    .replace(/<meta\s+property="og:[^"]*"[\s\S]*?>/g, "")
    .replace(/<meta\s+name="twitter:[^"]*"[\s\S]*?>/g, "")
}

const sitemap = []

async function writePage(urlPath, { title, description, image = DEFAULT_IMAGE, type = "website", body, jsonLd = [], extraMeta = "", lastmod, sitemapPriority }) {
  const url = `${SITE}${urlPath}`
  const head = `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="${ORG}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">${extraMeta}
${jsonLd.map((data) => `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>`
  const html = stripPageTags(template)
    .replace("</head>", head)
    .replace('<div id="root"></div>', `<div id="root"><div class="prerendered max-w-3xl mx-auto px-4 pt-32 pb-16">${body}</div></div>`)
  const file = urlPath === "/" ? path.join(DIST, "index.html") : path.join(DIST, urlPath, "index.html")
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
  sitemap.push({ url, lastmod, priority: sitemapPriority })
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const newsList = await getJson("/api/news/", [])
const news = (await Promise.all(newsList.map((p) => getJson(`/api/news/${p.slug}/`, null)))).filter(Boolean)
const upcoming = await getJson("/api/events/?when=upcoming", [])
const past = await getJson("/api/events/?when=past", [])
const events = (await Promise.all([...upcoming, ...past].map((e) => getJson(`/api/events/${e.slug}/`, null)))).filter(Boolean)
const alerts = await getJson("/api/alerts/", [])
const packages = await getJson("/api/packages/", [])

if (apiFailed && STRICT) {
  console.error("prerender: the API could not be reached; failing so an incomplete site is not deployed")
  process.exit(1)
}

const NEWS_CATEGORY = { announcement: "Announcement", project: "New project", article: "Article", "event-recap": "Event recap" }
const EVENT_TYPE = { training: "Training", workshop: "Workshop", webinar: "Webinar", meetup: "Meetup" }

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

const newsLinks = (posts) =>
  `<ul>${posts.map((p) => `<li><a href="/news/${p.slug}/">${escapeHtml(p.title)}</a> <small>${date(p.published_at)}</small><br>${escapeHtml(p.excerpt)}</li>`).join("")}</ul>`

// Home: keep the site-wide title and description from index.html
await writePage("/", {
  title: "RynexNative - Empowering Digital Innovation",
  description:
    "RynexNative designs and builds websites, apps and secure systems in Tanzania: software development, mobile apps, cybersecurity and training.",
  body: `<h1>Technology your business can trust</h1>
<p>We design and build websites, apps and secure systems with care, so your clients feel the quality from the very first click.</p>
<p><a href="/packages/">Service packages</a> · <a href="/estimate/">Get an estimate</a> · <a href="/events/">Events</a> · <a href="/news/">News</a> · <a href="/alerts/">Security alerts</a></p>
${news.length ? `<h2>Latest news</h2>${newsLinks(news.slice(0, 6))}` : ""}`,
  lastmod: news[0]?.updated_at,
  sitemapPriority: "1.0",
})

await writePage("/news/", {
  title: "News & Announcements | RynexNative",
  description: "Projects we have launched, company announcements and articles about technology in Tanzania from RynexNative.",
  body: `<h1>News &amp; Announcements</h1>${news.length ? newsLinks(news) : "<p>News is coming soon.</p>"}`,
  lastmod: news[0]?.updated_at,
  sitemapPriority: "0.9",
  jsonLd: [breadcrumbs([["Home", `${SITE}/`], ["News", `${SITE}/news/`]])],
})

for (const post of news) {
  const url = `${SITE}/news/${post.slug}/`
  const image = imageUrl(post.cover_image, 1200) || DEFAULT_IMAGE
  await writePage(`/news/${post.slug}/`, {
    title: `${post.title} | RynexNative News`,
    description: truncate(post.excerpt),
    image,
    type: "article",
    lastmod: post.updated_at || post.published_at,
    sitemapPriority: "0.8",
    extraMeta: `
  <meta property="article:published_time" content="${post.published_at}">
  <meta property="article:modified_time" content="${post.updated_at || post.published_at}">
  <meta property="article:section" content="${escapeHtml(NEWS_CATEGORY[post.category] || "News")}">`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: truncate(post.title, 110),
        description: truncate(post.excerpt),
        image: [image],
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        articleSection: NEWS_CATEGORY[post.category] || "News",
        author: { "@type": "Organization", name: ORG, url: SITE },
        publisher,
      },
      breadcrumbs([["Home", `${SITE}/`], ["News", `${SITE}/news/`], [post.title, url]]),
    ],
    body: `<article>
<p><a href="/news/">News</a> · ${escapeHtml(NEWS_CATEGORY[post.category] || "News")} · <time datetime="${post.published_at}">${date(post.published_at)}</time></p>
<h1>${escapeHtml(post.title)}</h1>
<p><strong>${escapeHtml(post.excerpt)}</strong></p>
${post.cover_image ? `<img src="${escapeHtml(imageUrl(post.cover_image, 1200))}" alt="${escapeHtml(post.title)}" width="1200" style="max-width:100%;height:auto;border-radius:1rem">` : ""}
${richText(post.body)}
</article>`,
  })
}

const eventLinks = (list) =>
  `<ul>${list.map((e) => `<li><a href="/events/${e.slug}/">${escapeHtml(e.title)}</a> <small>${date(e.starts_at)}</small><br>${escapeHtml(e.summary)}</li>`).join("")}</ul>`

await writePage("/events/", {
  title: "Training, Workshops & Webinars | RynexNative Events",
  description: "Learn ethical hacking, full-stack development and cybersecurity from practitioners. Register online and get your ticket instantly.",
  body: `<h1>Events by RynexNative</h1>${upcoming.length ? `<h2>Upcoming</h2>${eventLinks(upcoming)}` : "<p>No events scheduled right now.</p>"}${past.length ? `<h2>Past events</h2>${eventLinks(past)}` : ""}`,
  sitemapPriority: "0.7",
  jsonLd: [breadcrumbs([["Home", `${SITE}/`], ["Events", `${SITE}/events/`]])],
})

for (const event of events) {
  const url = `${SITE}/events/${event.slug}/`
  const image = imageUrl(event.cover_image, 1200) || DEFAULT_IMAGE
  const online = event.mode !== "physical"
  const physical = event.mode !== "online"
  const place = { "@type": "Place", name: event.venue, address: { "@type": "PostalAddress", streetAddress: event.venue, addressCountry: "TZ" } }
  const virtual = { "@type": "VirtualLocation", url }
  await writePage(`/events/${event.slug}/`, {
    title: `${event.title} | RynexNative Events`,
    description: truncate(`${event.summary} ${date(event.starts_at)}.`),
    image,
    sitemapPriority: "0.7",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: truncate(event.summary, 300),
        image: [image],
        startDate: event.starts_at,
        ...(event.ends_at ? { endDate: event.ends_at } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: `https://schema.org/${online && physical ? "Mixed" : online ? "Online" : "Offline"}EventAttendanceMode`,
        location: online && physical ? [place, virtual] : online ? virtual : place,
        organizer: { "@type": "Organization", name: ORG, url: SITE },
        offers: {
          "@type": "Offer",
          url,
          price: event.price,
          priceCurrency: "TZS",
          availability: event.registration_open ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        },
      },
      breadcrumbs([["Home", `${SITE}/`], ["Events", `${SITE}/events/`], [event.title, url]]),
    ],
    body: `<article>
<p><a href="/events/">Events</a> · ${escapeHtml(EVENT_TYPE[event.event_type] || "Event")} · ${event.price ? `TZS ${Number(event.price).toLocaleString("en-US")}` : "Free"}</p>
<h1>${escapeHtml(event.title)}</h1>
<p><strong>${escapeHtml(event.summary)}</strong></p>
<p>${date(event.starts_at)}${physical && event.venue ? ` · ${escapeHtml(event.venue)}` : ""}${online ? " · Online" : ""}</p>
${richText(event.description)}
</article>`,
  })
}

await writePage("/alerts/", {
  title: "Online Safety Alerts | RynexNative",
  description: "New scams spreading in Tanzania, how to spot them, and what to do if you are affected. From the RynexNative cybersecurity team.",
  body: `<h1>Online Safety Alerts</h1><ul>${alerts.map((a) => `<li><a href="/alerts/${a.slug}/">${escapeHtml(a.title)}</a><br>${escapeHtml(a.summary)}</li>`).join("")}</ul>`,
  lastmod: alerts[0]?.published_at,
  sitemapPriority: "0.7",
  jsonLd: [breadcrumbs([["Home", `${SITE}/`], ["Alerts", `${SITE}/alerts/`]])],
})

for (const alert of alerts) {
  const url = `${SITE}/alerts/${alert.slug}/`
  await writePage(`/alerts/${alert.slug}/`, {
    title: `${alert.title} | RynexNative Security Alert`,
    description: truncate(alert.summary),
    type: "article",
    lastmod: alert.published_at,
    sitemapPriority: "0.6",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: truncate(alert.title, 110),
        description: truncate(alert.summary),
        image: [DEFAULT_IMAGE],
        datePublished: alert.published_at,
        author: { "@type": "Organization", name: ORG, url: SITE },
        publisher,
      },
      breadcrumbs([["Home", `${SITE}/`], ["Alerts", `${SITE}/alerts/`], [alert.title, url]]),
    ],
    body: `<article>
<p><a href="/alerts/">Security alerts</a> · ${escapeHtml(alert.category)}</p>
<h1>${escapeHtml(alert.title)}</h1>
<p><strong>${escapeHtml(alert.summary)}</strong></p>
${richText(alert.description)}
${alert.signs?.length ? `<h2>Warning signs</h2>${listHtml(alert.signs)}` : ""}
${alert.prevention?.length ? `<h2>How to protect yourself</h2>${listHtml(alert.prevention)}` : ""}
${alert.if_affected?.length ? `<h2>If you are affected</h2>${listHtml(alert.if_affected)}` : ""}
</article>`,
  })
}

await writePage("/packages/", {
  title: "Service Packages | RynexNative",
  description: "Websites, apps, cybersecurity and care plans at the level that fits your business, with the same care, honesty and attention to quality.",
  body: `<h1>Service packages</h1><ul>${packages.map((p) => `<li><a href="/packages/${p.slug}/">${escapeHtml(p.name)}</a><br>${escapeHtml(p.tagline || p.audience)}</li>`).join("")}</ul>`,
  sitemapPriority: "0.8",
  jsonLd: [breadcrumbs([["Home", `${SITE}/`], ["Packages", `${SITE}/packages/`]])],
})

for (const pkg of packages) {
  const url = `${SITE}/packages/${pkg.slug}/`
  await writePage(`/packages/${pkg.slug}/`, {
    title: `${pkg.name} | RynexNative`,
    description: truncate(pkg.tagline || pkg.audience || pkg.description),
    image: imageUrl(pkg.cover_image, 1200) || DEFAULT_IMAGE,
    sitemapPriority: "0.7",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: pkg.name,
        description: truncate(pkg.tagline || pkg.description, 300),
        provider: { "@type": "Organization", name: ORG, url: SITE },
        areaServed: { "@type": "Country", name: "Tanzania" },
        ...(pkg.price ? { offers: { "@type": "Offer", url, price: pkg.price, priceCurrency: "TZS" } } : {}),
      },
      breadcrumbs([["Home", `${SITE}/`], ["Packages", `${SITE}/packages/`], [pkg.name, url]]),
    ],
    body: `<article>
<p><a href="/packages/">Packages</a>${pkg.tier ? ` · ${escapeHtml(pkg.tier)}` : ""}</p>
<h1>${escapeHtml(pkg.name)}</h1>
${pkg.tagline ? `<p><strong>${escapeHtml(pkg.tagline)}</strong></p>` : ""}
${pkg.audience ? `<p>Made for: ${escapeHtml(pkg.audience)}</p>` : ""}
${pkg.features?.length ? `<h2>What's included</h2>${listHtml(pkg.features)}` : ""}
${pkg.experience?.length ? `<h2>What you'll experience</h2>${listHtml(pkg.experience)}` : ""}
${richText(pkg.description)}
</article>`,
  })
}

await writePage("/estimate/", {
  title: "Estimate Your Project | RynexNative",
  description: "Get an instant price range for your website, app or system in under 2 minutes. No sign-up, no obligation.",
  body: `<h1>Estimate your project</h1><p>Get an instant price range in under 2 minutes. No sign-up, no obligation.</p>`,
  sitemapPriority: "0.6",
})

/* ------------------------------------------------------------------ */
/* Sitemaps, feed, robots, 404                                         */
/* ------------------------------------------------------------------ */

await writeFile(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map((s) => `  <url><loc>${s.url}</loc>${s.lastmod ? `<lastmod>${xmlDate(s.lastmod)}</lastmod>` : ""}${s.priority ? `<priority>${s.priority}</priority>` : ""}</url>`)
  .join("\n")}
</urlset>
`,
)

// Google News sitemap: articles from the last two days belong in it. On quiet days
// that would leave it empty, which Search Console reports as an error ("missing
// url tag"), so it then lists the latest posts instead; Google simply skips old ones.
const twoDaysAgo = Date.now() - 2 * 24 * 3600 * 1000
const published = news.filter((p) => p.published_at)
const lastTwoDays = published.filter((p) => new Date(p.published_at).getTime() >= twoDaysAgo)
const recent = lastTwoDays.length ? lastTwoDays : published.slice(0, 5)
if (!recent.length) console.warn("prerender: no published news yet, news-sitemap.xml is empty")
await writeFile(
  path.join(DIST, "news-sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recent
  .map(
    (p) => `  <url>
    <loc>${SITE}/news/${p.slug}/</loc>
    <news:news>
      <news:publication><news:name>${ORG}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${xmlDate(p.published_at)}</news:publication_date>
      <news:title>${escapeHtml(p.title)}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
)

await writeFile(
  path.join(DIST, "rss.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>RynexNative News</title>
  <link>${SITE}/news/</link>
  <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>Projects, announcements and articles about technology in Tanzania from RynexNative.</description>
  <language>en</language>
  ${news[0] ? `<lastBuildDate>${new Date(news[0].updated_at || news[0].published_at).toUTCString()}</lastBuildDate>` : ""}
${news
  .slice(0, 30)
  .map(
    (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${SITE}/news/${p.slug}/</link>
    <guid isPermaLink="true">${SITE}/news/${p.slug}/</guid>
    <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    <category>${escapeHtml(NEWS_CATEGORY[p.category] || "News")}</category>
    <description>${escapeHtml(p.excerpt)}</description>${p.cover_image ? `\n    <media:content url="${escapeHtml(imageUrl(p.cover_image, 1200))}" medium="image"/>` : ""}
  </item>`,
  )
  .join("\n")}
</channel>
</rss>
`,
)

await writeFile(
  path.join(DIST, "robots.txt"),
  `User-agent: *
Allow: /
Disallow: /admin
Disallow: /ticket/

Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/news-sitemap.xml
`,
)

// GitHub Pages serves this for any other path (/admin, /ticket/...): the app opens there,
// but search engines are told not to index it
await writeFile(
  path.join(DIST, "404.html"),
  stripPageTags(template).replace("</head>", `  <title>${ORG}</title>\n  <meta name="robots" content="noindex">\n</head>`),
)

console.log(
  `prerender: ${sitemap.length} pages (${news.length} news, ${events.length} events, ${alerts.length} alerts, ${packages.length} packages), ` +
    `${recent.length} in the news sitemap${apiFailed ? " — some data could not be loaded" : ""}`,
)
