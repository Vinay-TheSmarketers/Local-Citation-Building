export type BusinessRecord = {
  id: number
  name: string
  address1: string
  address2: string | null
  city: string
  region: string
  postalCode: string
  country: string
  phone: string
  website: string
  category: string
  description: string
}

export type DirectoryRecord = {
  id: number
  name: string
  slug: string
  homeUrl: string
  submissionUrl: string
  searchUrl: string
  tier: number
  industry: string | null
  automationMode: string
}

export type CitationRecord = {
  id: number
  status: string
  listingUrl: string | null
  notes: string | null
  lastCheckedAt: string | null
  directory: DirectoryRecord
}

export type AuditIssueRecord = {
  id: number
  field: string
  expectedValue: string
  observedValue: string
  severity: string
  status: string
  directory: { id: number; name: string; slug: string }
}

export type DashboardData = {
  business: BusinessRecord
  citations: CitationRecord[]
  issues: AuditIssueRecord[]
}
