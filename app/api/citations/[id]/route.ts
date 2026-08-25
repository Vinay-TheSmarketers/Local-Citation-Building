import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "VERIFIED", "NEEDS_FIX"]).optional(),
  listingUrl: z.string().url().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const citationId = Number(id)
  if (!Number.isInteger(citationId)) return NextResponse.json({ error: "Invalid citation id." }, { status: 400 })
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = {
    ...parsed.data,
    submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : undefined,
    lastCheckedAt: parsed.data.status === "VERIFIED" ? new Date() : undefined,
  }
  const citation = await prisma.citation.update({ where: { id: citationId }, data })
  return NextResponse.json({ citation })
}
