"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ArrowRight, BarChart3, Building2, CheckCircle2, ChevronRight, CircleDot, ExternalLink, Globe2, LayoutDashboard, ListChecks, MapPin, Menu, Plus, Radar, Search, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { DashboardData, CitationRecord } from "@/lib/types"
import { AuditDashboard } from "@/components/audit-dashboard"
import { BrandLogo } from "@/components/brand-logo"
import { MasterNapForm } from "@/components/master-nap-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type View = "overview" | "profile" | "citations" | "audit"

const statusMap: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "danger" }> = {
  NOT_STARTED: { label: "Not started", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  SUBMITTED: { label: "Submitted", variant: "warning" },
  VERIFIED: { label: "Verified", variant: "success" },
  NEEDS_FIX: { label: "Needs fix", variant: "danger" },
}

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Master NAP", icon: Building2 },
  { id: "citations", label: "Citations", icon: ListChecks },
  { id: "audit", label: "NAP audit", icon: Radar },
]

export function CitationDashboard({ initialData }: { initialData: DashboardData }) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [view, setView] = useState<View>("overview")
  const [lookup, setLookup] = useState(initialData.business.website)
  const [mobileNav, setMobileNav] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [busyCitation, setBusyCitation] = useState<number | null>(null)
  const [fixingId, setFixingId] = useState<number | null>(null)
  const [auditing, setAuditing] = useState(false)
  const [lookupBusy, setLookupBusy] = useState(false)

  const metrics = useMemo(() => {
    const verified = data.citations.filter((item) => item.status === "VERIFIED").length
    const active = data.citations.filter((item) => ["VERIFIED", "SUBMITTED", "IN_PROGRESS"].includes(item.status)).length
    const openIssues = data.issues.filter((item) => item.status === "OPEN").length
    return { verified, active, openIssues, coverage: Math.round((active / Math.max(data.citations.length, 1)) * 100) }
  }, [data])

  async function getStarted(event: React.FormEvent) {
    event.preventDefault()
    if (lookup.trim().length < 2) return toast.error("Enter a business name or website")
    setLookupBusy(true)
    const toastId = toast.loading("Inspecting business details…")
    try {
      const response = await fetch("/api/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: lookup }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Lookup failed")
      setData((current) => ({ ...current, business: { ...current.business, ...Object.fromEntries(Object.entries(payload.business).filter(([, value]) => typeof value === "string" && value.length > 0)) } }))
      toast.success("Business details loaded", { id: toastId, description: "Confirm your Master NAP to begin building citations." })
    } catch (error) {
      toast.warning("Profile opened without website data", { id: toastId, description: error instanceof Error ? error.message : "Enter the profile manually." })
    } finally {
      setLookupBusy(false)
      setView("profile")
      setTimeout(() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
    }
  }

  function changeView(next: View) {
    setView(next)
    setMobileNav(false)
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function updateCitation(citation: CitationRecord, status: string) {
    setBusyCitation(citation.id)
    const toastId = toast.loading(`${status === "SUBMITTED" ? "Recording submission" : "Updating citation"}…`, { description: citation.directory.name })
    try {
      const response = await fetch(`/api/citations/${citation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Update failed")
      setData((current) => ({ ...current, citations: current.citations.map((item) => item.id === citation.id ? { ...item, ...payload.citation, directory: item.directory } : item) }))
      toast.success(status === "SUBMITTED" ? "Submission tracked" : "Citation updated", { id: toastId, description: `${citation.directory.name} is now ${status.toLowerCase().replace("_", " ")}.` })
    } catch (error) {
      toast.error("Couldn’t update citation", { id: toastId, description: error instanceof Error ? error.message : "Try again." })
    } finally { setBusyCitation(null) }
  }

  async function browserAudit(citation: CitationRecord) {
    setBusyCitation(citation.id)
    const toastId = toast.loading("Launching headless directory audit…", { description: citation.directory.name })
    try {
      const response = await fetch("/api/automation/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ citationId: citation.id }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Browser audit failed")
      setData((current) => ({ ...current, citations: current.citations.map((item) => item.id === citation.id ? { ...item, ...payload.citation, directory: item.directory } : item) }))
      toast.success(payload.result.nameFound ? "Possible listing found" : "Scan complete — manual review advised", { id: toastId, description: payload.result.note })
    } catch (error) {
      toast.error("Directory scan couldn’t finish", { id: toastId, description: error instanceof Error ? error.message : "Try again." })
    } finally { setBusyCitation(null) }
  }

  async function runAudit() {
    setAuditing(true)
    try {
      const response = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: data.business.id }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Audit failed")
      setData((current) => ({ ...current, issues: payload.issues }))
      toast.success("NAP audit complete", { description: `${payload.audited} citation records checked; ${payload.issues.length} mismatches found.` })
      router.refresh()
    } catch (error) { toast.error("Audit failed", { description: error instanceof Error ? error.message : "Try again." }) }
    finally { setAuditing(false) }
  }

  async function fixIssue(id: number) {
    setFixingId(id)
    try {
      const response = await fetch(`/api/audit/${id}/fix`, { method: "POST" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Fix failed")
      setData((current) => ({ ...current, issues: current.issues.map((item) => item.id === id ? { ...item, status: "FIXED" } : item) }))
      toast.success("Mismatch resolved", { description: "The citation record now matches Master NAP." })
    } catch (error) { toast.error("Couldn’t apply the fix", { description: error instanceof Error ? error.message : "Try again." }) }
    finally { setFixingId(null) }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-7"><BrandLogo /><div className="hidden h-6 w-px bg-slate-200 md:block" /><div className="hidden items-center gap-2 md:flex"><span className="text-lg font-black tracking-[-.04em]">vLC</span><Badge variant="secondary">Local citations</Badge></div></div>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Top navigation"><button onClick={() => changeView("overview")} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">Dashboard</button><button onClick={() => changeView("citations")} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">Directories</button><button onClick={() => changeView("audit")} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">Audit</button></nav>
          <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />Local engine online</div><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav((current) => !current)} aria-label="Toggle navigation"><Menu className="h-5 w-5" /></Button></div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-100 bg-white px-5 pb-24 pt-20 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,111,61,.09),transparent_36%)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-orange-700"><Sparkles className="h-3.5 w-3.5" />Smarketers Off Page Suite</div>
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-black leading-[1.02] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-7xl">Local visibility, built <span className="text-orange-500">with precision.</span></h1>
            <p className="mx-auto mt-7 max-w-3xl text-balance text-base leading-7 text-slate-600 sm:text-lg">Meet the Smarketers Family Off Page Suite. The only unified ecosystem your brand needs for scaled, off-page visibility and outreach automation.</p>
            <form onSubmit={getStarted} className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-soft sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input aria-label="Business name or website" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Enter your business name or website" className="h-[52px] border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0" /></div>
              <Button type="submit" size="lg" disabled={lookupBusy} className="h-[52px] rounded-xl bg-orange-500 px-8 hover:bg-orange-600">{lookupBusy ? "Looking up…" : "Get Started"} <ArrowRight className="h-4 w-4" /></Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Free & open source</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Local-first data</span><span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />No vendor lock-in</span></div>
          </div>
        </section>

        <section id="workspace" className="scroll-mt-16 bg-slate-50/70 px-4 py-12 pb-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-orange-600"><CircleDot className="h-3.5 w-3.5" />Live workspace</div><h2 className="text-2xl font-black tracking-[-.035em] text-slate-950 sm:text-3xl">Welcome back, {data.business.name}</h2><p className="mt-1 text-sm text-slate-500">Keep every business listing accurate, active, and visible.</p></div><Button onClick={() => { setView("citations"); setAddOpen(true) }}><Plus className="h-4 w-4" />Add directory</Button></div>
            <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
              <aside className={`${mobileNav ? "block" : "hidden"} rounded-2xl border border-slate-200 bg-white p-3 shadow-card lg:sticky lg:top-24 lg:block`}>
                <div className="mb-2 px-3 pb-3 pt-2"><div className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">Workspace</div></div>
                <nav className="space-y-1" aria-label="Workspace navigation">{navItems.map((item) => <button key={item.id} onClick={() => changeView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${view === item.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><item.icon className="h-4 w-4" />{item.label}{view === item.id ? <ChevronRight className="ml-auto h-4 w-4" /> : null}</button>)}</nav>
                <div className="mt-5 rounded-xl bg-orange-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Activity className="h-4 w-4 text-orange-500" />Listing health</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(8, 100 - metrics.openIssues * 8)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{metrics.openIssues ? `${metrics.openIssues} corrections recommended` : "Everything looks consistent"}</p></div>
              </aside>
              <div className="min-w-0">{view === "overview" ? <Overview metrics={metrics} citations={data.citations} onView={changeView} onUpdate={updateCitation} busyCitation={busyCitation} /> : null}{view === "profile" ? <Panel title="Master NAP" description="One canonical profile powers every citation and consistency check."><MasterNapForm business={data.business} onSaved={(business) => setData((current) => ({ ...current, business }))} /></Panel> : null}{view === "citations" ? <CitationsView citations={data.citations} busyCitation={busyCitation} onUpdate={updateCitation} onAudit={browserAudit} onAdd={() => setAddOpen(true)} /> : null}{view === "audit" ? <AuditDashboard issues={data.issues} fixingId={fixingId} onFix={fixIssue} onAudit={runAudit} auditing={auditing} /> : null}</div>
            </div>
          </div>
        </section>
      </main>
      {addOpen ? <AddDirectoryModal onClose={() => setAddOpen(false)} onCreated={() => { setAddOpen(false); router.refresh(); window.location.reload() }} /> : null}
    </>
  )
}

function Overview({ metrics, citations, onView, onUpdate, busyCitation }: { metrics: { verified: number; active: number; openIssues: number; coverage: number }; citations: CitationRecord[]; onView: (view: View) => void; onUpdate: (citation: CitationRecord, status: string) => void; busyCitation: number | null }) {
  const cards = [{ label: "Active citations", value: metrics.active, detail: `${citations.length} target directories`, icon: Globe2, color: "text-blue-600 bg-blue-50" }, { label: "Verified listings", value: metrics.verified, detail: `${metrics.coverage}% directory coverage`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" }, { label: "NAP issues", value: metrics.openIssues, detail: metrics.openIssues ? "Ready for one-click fixes" : "No action needed", icon: Radar, color: "text-orange-600 bg-orange-50" }, { label: "Visibility", value: `${Math.min(99, 44 + metrics.active * 5)}%`, detail: "+8% this cycle", icon: BarChart3, color: "text-violet-600 bg-violet-50" }]
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card.label}><CardContent className="p-5"><div className={`mb-5 inline-flex rounded-lg p-2 ${card.color}`}><card.icon className="h-5 w-5" /></div><div className="text-3xl font-black tracking-[-.05em] text-slate-950">{card.value}</div><div className="mt-1 text-sm font-semibold text-slate-700">{card.label}</div><div className="mt-1 text-xs text-slate-400">{card.detail}</div></CardContent></Card>)}</div><div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]"><Panel title="Priority directories" description="Your most important local profiles, in one place." action={<Button variant="ghost" size="sm" onClick={() => onView("citations")}>View all <ArrowRight className="h-3.5 w-3.5" /></Button>}><div className="divide-y divide-slate-100">{citations.filter((item) => item.directory.tier === 1).slice(0, 5).map((citation) => <DirectoryRow key={citation.id} citation={citation} busy={busyCitation === citation.id} onUpdate={onUpdate} compact />)}</div></Panel><Panel title="Next best action" description="A focused path to higher coverage."><div className="rounded-xl bg-slate-950 p-5 text-white"><div className="mb-4 inline-flex rounded-lg bg-white/10 p-2"><MapPin className="h-5 w-5 text-orange-400" /></div><div className="text-lg font-bold">Complete Apple Maps</div><p className="mt-2 text-sm leading-6 text-slate-300">Claim Apple Business Connect and reuse your verified Master NAP.</p><Button size="sm" className="mt-5 bg-white text-slate-950 hover:bg-slate-100" onClick={() => onView("citations")}>Open workflow <ArrowRight className="h-3.5 w-3.5" /></Button></div></Panel></div></div>
}

function CitationsView({ citations, busyCitation, onUpdate, onAudit, onAdd }: { citations: CitationRecord[]; busyCitation: number | null; onUpdate: (citation: CitationRecord, status: string) => void; onAudit: (citation: CitationRecord) => void; onAdd: () => void }) {
  const [filter, setFilter] = useState("")
  const filtered = citations.filter((item) => `${item.directory.name} ${item.directory.industry ?? ""}`.toLowerCase().includes(filter.toLowerCase()))
  return <Panel title="Citation network" description="Track core maps, general directories, and industry-specific listings." action={<Button size="sm" onClick={onAdd}><Plus className="h-3.5 w-3.5" />Add custom</Button>}><div className="relative mb-4"><Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Filter directories" value={filter} onChange={(event) => setFilter(event.target.value)} className="border-0 bg-slate-50 pl-11 shadow-none focus-visible:ring-slate-900/10" placeholder="Filter directories or industries…" /></div><div className="divide-y divide-slate-100">{filtered.map((citation) => <DirectoryRow key={citation.id} citation={citation} busy={busyCitation === citation.id} onUpdate={onUpdate} onAudit={onAudit} />)}</div>{!filtered.length ? <div className="py-12 text-center text-sm text-slate-500">No directories match that filter.</div> : null}</Panel>
}

function DirectoryRow({ citation, busy, onUpdate, onAudit, compact = false }: { citation: CitationRecord; busy: boolean; onUpdate: (citation: CitationRecord, status: string) => void; onAudit?: (citation: CitationRecord) => void; compact?: boolean }) {
  const meta = statusMap[citation.status] ?? statusMap.NOT_STARTED
  const initial = citation.directory.name.charAt(0)
  return <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700">{initial}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-bold text-slate-900">{citation.directory.name}</span>{citation.directory.industry ? <Badge variant="outline">{citation.directory.industry}</Badge> : null}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-400"><span>Tier {citation.directory.tier}</span><span>•</span><span>{citation.directory.automationMode === "ASSISTED" ? "Playwright assisted" : "Manual verification"}</span></div></div></div><Badge variant={meta.variant}>{meta.label}</Badge><div className="flex shrink-0 items-center gap-2">{!compact && onAudit ? <Button variant="ghost" size="sm" disabled={busy} onClick={() => onAudit(citation)}><Radar className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />Scan</Button> : null}<Button variant="outline" size="sm" disabled={busy} asChild><a href={citation.directory.submissionUrl} target="_blank" rel="noreferrer">Open <ExternalLink className="h-3.5 w-3.5" /></a></Button>{citation.status !== "VERIFIED" ? <Button size="sm" disabled={busy} onClick={() => onUpdate(citation, citation.status === "SUBMITTED" ? "VERIFIED" : "SUBMITTED")}>{citation.status === "SUBMITTED" ? "Verify" : "Track"}</Button> : null}</div></div>
}

function Panel({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <Card><CardHeader className="flex-row items-start justify-between space-y-0 border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{action}</CardHeader><CardContent className="p-5">{children}</CardContent></Card>
}

function AddDirectoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true)
    const form = new FormData(event.currentTarget)
    const payload = { name: form.get("name"), homeUrl: form.get("homeUrl"), submissionUrl: form.get("submissionUrl"), industry: form.get("industry") }
    try { const response = await fetch("/api/directories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Couldn’t add directory"); toast.success("Directory added", { description: `${payload.name} is now in your citation network.` }); onCreated() } catch (error) { toast.error("Couldn’t add directory", { description: error instanceof Error ? error.message : "Try again." }) } finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-directory-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id="add-directory-title" className="text-xl font-black tracking-tight">Add industry directory</h2><p className="mt-1 text-sm text-slate-500">Extend your citation plan with any free listing source.</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button></div><form onSubmit={submit} className="mt-6 space-y-4"><ModalField label="Directory name" name="name" placeholder="e.g. FindLaw" /><ModalField label="Industry" name="industry" placeholder="e.g. Legal" /><ModalField label="Directory home URL" name="homeUrl" type="url" placeholder="https://example.com" /><ModalField label="Submission URL" name="submissionUrl" type="url" placeholder="https://example.com/add-business" /><div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add directory"}</Button></div></form></div></div>
}

function ModalField({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder: string }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} placeholder={placeholder} required /></div> }
