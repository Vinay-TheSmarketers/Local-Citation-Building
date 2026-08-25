import { NextResponse } from "next/server"
import { z } from "zod"
import { lookupBusiness } from "@/lib/business-lookup"

const lookupSchema = z.object({ query: z.string().trim().min(2).max(240) })

export async function POST(request: Request) {
  const parsed = lookupSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid business name or website." }, { status: 400 })
  try {
    return NextResponse.json(await lookupBusiness(parsed.data.query))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The website could not be inspected." }, { status: 422 })
  }
}
