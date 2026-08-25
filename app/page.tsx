import { CitationDashboard } from "@/components/citation-dashboard"
import { prisma } from "@/lib/prisma"
import { DashboardData } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const business = await prisma.business.findFirst({
    orderBy: { id: "asc" },
    include: {
      citations: { include: { directory: true }, orderBy: [{ directory: { tier: "asc" } }, { directory: { name: "asc" } }] },
      auditIssues: { include: { directory: { select: { id: true, name: true, slug: true } } }, orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }] },
    },
  })

  if (!business) {
    return <DatabaseSetup />
  }

  const data: DashboardData = {
    business: {
      id: business.id, name: business.name, address1: business.address1, address2: business.address2, city: business.city,
      region: business.region, postalCode: business.postalCode, country: business.country, phone: business.phone,
      website: business.website, category: business.category, description: business.description,
    },
    citations: business.citations.map((citation) => ({
      id: citation.id, status: citation.status, listingUrl: citation.listingUrl, notes: citation.notes,
      lastCheckedAt: citation.lastCheckedAt?.toISOString() ?? null,
      directory: {
        id: citation.directory.id, name: citation.directory.name, slug: citation.directory.slug, homeUrl: citation.directory.homeUrl,
        submissionUrl: citation.directory.submissionUrl, searchUrl: citation.directory.searchUrl, tier: citation.directory.tier,
        industry: citation.directory.industry, automationMode: citation.directory.automationMode,
      },
    })),
    issues: business.auditIssues.map((issue) => ({ id: issue.id, field: issue.field, expectedValue: issue.expectedValue, observedValue: issue.observedValue, severity: issue.severity, status: issue.status, directory: issue.directory })),
  }

  return <CitationDashboard initialData={data} />
}

function DatabaseSetup() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-xl font-black text-orange-600">v</div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">Initialize your vLC workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">The app is installed, but the local database has no Master NAP yet. Run the setup command once, then refresh.</p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-left text-sm text-slate-100"><code>pnpm setup</code></pre>
      </div>
    </main>
  )
}
