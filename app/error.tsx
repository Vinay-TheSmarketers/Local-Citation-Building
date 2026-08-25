"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card"><div className="text-sm font-bold uppercase tracking-widest text-orange-600">vLC recovery</div><h1 className="mt-3 text-2xl font-black">The workspace hit a snag</h1><p className="mt-2 text-sm leading-6 text-slate-500">{error.message || "An unexpected local error occurred."}</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>
}
