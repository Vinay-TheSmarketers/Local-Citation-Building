import { chromium } from "playwright"
import { normalize } from "@/lib/utils"

export type AuditTarget = {
  searchUrl: string
  businessName: string
  city: string
  phone: string
}

export async function inspectDirectory({ searchUrl, businessName, city, phone }: AuditTarget) {
  const browser = await chromium.launch({ headless: process.env.PLAYWRIGHT_HEADLESS !== "false" })
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36 vLC-Citation-Auditor/1.0",
    viewport: { width: 1365, height: 900 },
  })

  try {
    const query = encodeURIComponent(`${businessName} ${city}`)
    const url = `${searchUrl}${query}`
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 })
    await page.waitForTimeout(1_200)
    const title = await page.title()
    const bodyText = (await page.locator("body").innerText({ timeout: 5_000 })).slice(0, 80_000)
    const normalizedBody = normalize(bodyText)
    const nameFound = normalizedBody.includes(normalize(businessName))
    const phoneDigits = normalize(phone).replace(/[a-z]/g, "")
    const phoneFound = phoneDigits.length >= 7 && normalizedBody.includes(phoneDigits.slice(-7))

    return {
      ok: Boolean(response?.ok()),
      statusCode: response?.status() ?? 0,
      url: page.url(),
      title,
      nameFound,
      phoneFound,
      checkedAt: new Date(),
      note: nameFound ? "Business name detected in directory search results." : "No exact name match detected; manual review is recommended.",
    }
  } finally {
    await browser.close()
  }
}
