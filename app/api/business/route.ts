import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validators"

export async function GET() {
  const business = await prisma.business.findFirst({ orderBy: { id: "asc" } })
  return NextResponse.json({ business })
}

export async function PUT(request: Request) {
  const parsed = businessSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id, ...data } = parsed.data
  const existing = id ? await prisma.business.findUnique({ where: { id } }) : await prisma.business.findFirst()
  const business = existing
    ? await prisma.business.update({ where: { id: existing.id }, data })
    : await prisma.business.create({ data })

  if (!existing) {
    const directories = await prisma.directory.findMany({ select: { id: true } })
    await prisma.citation.createMany({ data: directories.map((directory) => ({ businessId: business.id, directoryId: directory.id })) })
  }

  return NextResponse.json({ business })
}
