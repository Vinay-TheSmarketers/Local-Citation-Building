import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const issueId = Number(id)
  const issue = await prisma.auditIssue.findUnique({ where: { id: issueId }, include: { citation: true } })
  if (!issue) return NextResponse.json({ error: "Audit issue not found." }, { status: 404 })

  if (issue.citation) {
    const fieldUpdate = issue.field === "Business name" ? { observedName: issue.expectedValue }
      : issue.field === "Phone" ? { observedPhone: issue.expectedValue }
      : { observedAddress: issue.expectedValue }
    await prisma.citation.update({ where: { id: issue.citation.id }, data: { ...fieldUpdate, lastCheckedAt: new Date() } })
  }
  const fixed = await prisma.auditIssue.update({ where: { id: issue.id }, data: { status: "FIXED", fixedAt: new Date() } })
  const remaining = issue.citationId ? await prisma.auditIssue.count({ where: { citationId: issue.citationId, status: "OPEN" } }) : 1
  if (issue.citationId && remaining === 0) await prisma.citation.update({ where: { id: issue.citationId }, data: { status: "VERIFIED" } })
  return NextResponse.json({ issue: fixed })
}
