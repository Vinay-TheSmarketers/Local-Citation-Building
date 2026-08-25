import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { inspectDirectory } from "@/lib/automation"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  const { citationId } = (await request.json()) as { citationId?: number }
  if (!Number.isInteger(citationId)) return NextResponse.json({ error: "A valid citation id is required." }, { status: 400 })
  const citation = await prisma.citation.findUnique({ where: { id: citationId }, include: { business: true, directory: true } })
  if (!citation) return NextResponse.json({ error: "Citation not found." }, { status: 404 })

  try {
    const result = await inspectDirectory({ searchUrl: citation.directory.searchUrl, businessName: citation.business.name, city: citation.business.city, phone: citation.business.phone })
    const updated = await prisma.citation.update({
      where: { id: citation.id },
      data: { lastCheckedAt: result.checkedAt, notes: result.note, listingUrl: result.nameFound ? result.url : citation.listingUrl, status: result.nameFound ? "IN_PROGRESS" : citation.status },
    })
    return NextResponse.json({ result, citation: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Browser audit failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
