import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatAddress, normalize } from "@/lib/utils"

type FieldCheck = { field: string; expected: string; observed: string | null; severity: string }

export async function POST(request: Request) {
  const body = (await request.json()) as { businessId?: number }
  const business = await prisma.business.findUnique({ where: { id: body.businessId }, include: { citations: { include: { directory: true } } } })
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 })

  await prisma.auditIssue.deleteMany({ where: { businessId: business.id, status: "OPEN" } })
  const expectedAddress = formatAddress([business.address1, business.address2, business.city, `${business.region} ${business.postalCode}`, business.country])
  const created = []

  for (const citation of business.citations) {
    if (!citation.observedName && !citation.observedAddress && !citation.observedPhone) continue
    const fields: FieldCheck[] = [
      { field: "Business name", expected: business.name, observed: citation.observedName, severity: "MEDIUM" },
      { field: "Address", expected: expectedAddress, observed: citation.observedAddress, severity: "HIGH" },
      { field: "Phone", expected: business.phone, observed: citation.observedPhone, severity: "HIGH" },
    ]
    for (const field of fields) {
      if (field.observed && normalize(field.expected) !== normalize(field.observed)) {
        created.push(await prisma.auditIssue.create({ data: { businessId: business.id, directoryId: citation.directoryId, citationId: citation.id, field: field.field, expectedValue: field.expected, observedValue: field.observed, severity: field.severity } }))
      }
    }
    await prisma.citation.update({ where: { id: citation.id }, data: { status: fields.some((field) => field.observed && normalize(field.expected) !== normalize(field.observed)) ? "NEEDS_FIX" : citation.status, lastCheckedAt: new Date() } })
  }

  return NextResponse.json({ issues: created, audited: business.citations.length })
}
