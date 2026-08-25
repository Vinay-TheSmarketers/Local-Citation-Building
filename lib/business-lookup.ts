type JsonRecord = Record<string, unknown>

function collectRecords(value: unknown, records: JsonRecord[] = []): JsonRecord[] {
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, records)
  } else if (value && typeof value === "object") {
    const record = value as JsonRecord
    records.push(record)
    if (record["@graph"]) collectRecords(record["@graph"], records)
  }
  return records
}

function hasBusinessType(record: JsonRecord) {
  const type = record["@type"]
  const types = Array.isArray(type) ? type : [type]
  return types.some((item) => typeof item === "string" && (item.includes("LocalBusiness") || item === "Organization" || item === "ProfessionalService"))
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function meta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const first = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i").exec(html)?.[1]
  const second = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i").exec(html)?.[1]
  return first ?? second ?? ""
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}

export async function lookupBusiness(input: string) {
  const trimmed = input.trim()
  const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /^[\w-]+(?:\.[\w-]+)+/.test(trimmed)
  if (!looksLikeUrl) return { inputType: "name" as const, business: { name: trimmed } }

  const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS websites can be inspected.")
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname.toLowerCase())) throw new Error("Local network addresses cannot be inspected.")

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; vLC-Business-Lookup/1.0)" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`The website returned HTTP ${response.status}.`)
  const html = (await response.text()).slice(0, 1_500_000)
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const records: JsonRecord[] = []
  for (const match of html.matchAll(scriptPattern)) {
    try { collectRecords(JSON.parse(match[1].trim()), records) } catch { continue }
  }
  const entity = records.find(hasBusinessType) ?? {}
  const address = entity.address && typeof entity.address === "object" ? entity.address as JsonRecord : {}
  const title = decodeHtml(meta(html, "og:site_name") || meta(html, "og:title") || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || url.hostname.replace(/^www\./, ""))

  return {
    inputType: "website" as const,
    business: {
      website: response.url,
      name: text(entity.name) || title.split(/\s+[|–—-]\s+/)[0],
      phone: text(entity.telephone),
      address1: text(address.streetAddress),
      city: text(address.addressLocality),
      region: text(address.addressRegion),
      postalCode: text(address.postalCode),
      country: text(address.addressCountry),
      description: text(entity.description) || decodeHtml(meta(html, "description") || meta(html, "og:description")),
    },
  }
}
