import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { directorySchema } from "@/lib/validators"

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function POST(request: Request) {
  const parsed = directorySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const slug = slugify(parsed.data.name)
  const exists = await prisma.directory.findFirst({ where: { OR: [{ slug }, { name: parsed.data.name }] } })
  if (exists) return NextResponse.json({ error: "This directory already exists." }, { status: 409 })

  const directory = await prisma.directory.create({
    data: { ...parsed.data, slug, searchUrl: `${parsed.data.homeUrl}?q=`, tier: 3, automationMode: "ASSISTED" },
  })
  const businesses = await prisma.business.findMany({ select: { id: true } })
  await prisma.citation.createMany({ data: businesses.map((business) => ({ businessId: business.id, directoryId: directory.id })) })
  return NextResponse.json({ directory }, { status: 201 })
}
