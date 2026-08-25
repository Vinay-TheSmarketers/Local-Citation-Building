"use client"

import { AlertTriangle, Check, RefreshCw, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { AuditIssueRecord } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AuditDashboard({ issues, fixingId, onFix, onAudit, auditing }: { issues: AuditIssueRecord[]; fixingId: number | null; onFix: (id: number) => void; onAudit: () => void; auditing: boolean }) {
  const open = issues.filter((issue) => issue.status === "OPEN")
  const consistency = Math.max(0, Math.round(100 - open.length * 7.5))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-soft">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[32px] border-white/5" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">NAP consistency score</p>
            <div className="mt-4 flex items-end gap-2"><span className="text-6xl font-black tracking-[-.07em]">{consistency}</span><span className="mb-2 text-lg text-slate-400">/100</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all" style={{ width: `${consistency}%` }} /></div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">{open.length ? `${open.length} field-level mismatches need attention across your active listings.` : "Every observed listing matches your Master NAP."}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-orange-50/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex rounded-lg bg-white p-2 text-orange-600 shadow-sm"><Sparkles className="h-5 w-5" /></div>
              <h3 className="font-bold text-slate-950">Freshness audit</h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">Re-compare stored directory observations with your canonical profile. Browser scans are also available per directory.</p>
            </div>
            <Button onClick={() => { onAudit(); toast.info("NAP audit queued") }} disabled={auditing} variant="outline">
              <RefreshCw className={`h-4 w-4 ${auditing ? "animate-spin" : ""}`} /> {auditing ? "Auditing…" : "Run audit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h3 className="font-bold text-slate-950">Detected inconsistencies</h3><p className="mt-0.5 text-xs text-slate-500">Fixes update the stored directory observation to match Master NAP.</p></div>
          <Badge variant={open.length ? "warning" : "success"}>{open.length} open</Badge>
        </div>
        {open.length ? (
          <div className="divide-y divide-slate-100">
            {open.map((issue) => (
              <div key={issue.id} className="grid gap-4 p-5 transition-colors hover:bg-slate-50/70 md:grid-cols-[1fr_1.6fr_auto] md:items-center">
                <div>
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="font-semibold text-slate-900">{issue.directory.name}</span></div>
                  <div className="mt-2 flex gap-2"><Badge variant={issue.severity === "HIGH" ? "danger" : "warning"}>{issue.severity}</Badge><Badge variant="outline">{issue.field}</Badge></div>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-red-50 p-3"><span className="block font-bold uppercase tracking-wide text-red-500">Found</span><span className="mt-1 block break-words text-red-900">{issue.observedValue}</span></div>
                  <div className="rounded-lg bg-emerald-50 p-3"><span className="block font-bold uppercase tracking-wide text-emerald-600">Master</span><span className="mt-1 block break-words text-emerald-900">{issue.expectedValue}</span></div>
                </div>
                <Button size="sm" onClick={() => onFix(issue.id)} disabled={fixingId === issue.id}><Sparkles className="h-3.5 w-3.5" />{fixingId === issue.id ? "Fixing…" : "Fix"}</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center"><div className="rounded-full bg-emerald-50 p-3 text-emerald-600"><ShieldCheck className="h-7 w-7" /></div><h3 className="mt-4 font-bold">All clear</h3><p className="mt-1 text-sm text-slate-500">No open NAP mismatches were found.</p><Check className="mt-4 h-5 w-5 text-emerald-500" /></div>
        )}
      </div>
    </div>
  )
}
