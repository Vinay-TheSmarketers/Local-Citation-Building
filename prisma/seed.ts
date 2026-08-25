import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const directories = [
  { name: "Google Business Profile", slug: "google-business", homeUrl: "https://business.google.com/", submissionUrl: "https://business.google.com/create", searchUrl: "https://www.google.com/search?q=", tier: 1, automationMode: "MANUAL" },
  { name: "Bing Places", slug: "bing-places", homeUrl: "https://www.bingplaces.com/", submissionUrl: "https://www.bingplaces.com/DashBoard/Home", searchUrl: "https://www.bing.com/search?q=", tier: 1, automationMode: "ASSISTED" },
  { name: "Apple Business Connect", slug: "apple-business", homeUrl: "https://businessconnect.apple.com/", submissionUrl: "https://businessconnect.apple.com/", searchUrl: "https://www.apple.com/maps/search/?q=", tier: 1, automationMode: "MANUAL" },
  { name: "Yelp", slug: "yelp", homeUrl: "https://www.yelp.com/", submissionUrl: "https://biz.yelp.com/", searchUrl: "https://www.yelp.com/search?find_desc=", tier: 1, automationMode: "ASSISTED" },
  { name: "Foursquare", slug: "foursquare", homeUrl: "https://foursquare.com/", submissionUrl: "https://foursquare.com/products/places/", searchUrl: "https://foursquare.com/explore?mode=url&near=&q=", tier: 2, automationMode: "ASSISTED" },
  { name: "Yellow Pages", slug: "yellow-pages", homeUrl: "https://www.yp.com/", submissionUrl: "https://www.yellowpages.com/advertise", searchUrl: "https://www.yellowpages.com/search?search_terms=", tier: 2, automationMode: "ASSISTED" },
  { name: "MapQuest", slug: "mapquest", homeUrl: "https://www.mapquest.com/", submissionUrl: "https://listings.mapquest.com/", searchUrl: "https://www.mapquest.com/search/results?query=", tier: 2, automationMode: "ASSISTED" },
  { name: "HERE WeGo", slug: "here-wego", homeUrl: "https://wego.here.com/", submissionUrl: "https://mapcreator.here.com/", searchUrl: "https://wego.here.com/search/", tier: 2, automationMode: "MANUAL" },
  { name: "Healthgrades", slug: "healthgrades", homeUrl: "https://www.healthgrades.com/", submissionUrl: "https://update.healthgrades.com/", searchUrl: "https://www.healthgrades.com/usearch?what=", tier: 3, industry: "Healthcare", automationMode: "MANUAL" },
  { name: "Avvo", slug: "avvo", homeUrl: "https://www.avvo.com/", submissionUrl: "https://www.avvo.com/claim-profile", searchUrl: "https://www.avvo.com/search/lawyer_search?query=", tier: 3, industry: "Legal", automationMode: "MANUAL" },
]

async function main() {
  for (const directory of directories) {
    await prisma.directory.upsert({ where: { slug: directory.slug }, update: directory, create: directory })
  }

  let business = await prisma.business.findFirst()
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: "Smarketers Digital Studio",
        address1: "1600 Amphitheatre Parkway",
        city: "Mountain View",
        region: "CA",
        postalCode: "94043",
        country: "US",
        phone: "+1 (650) 555-0198",
        website: "https://www.smarketers.com",
        category: "Digital Marketing Agency",
        description: "B2B digital marketing and demand generation specialists helping ambitious brands build visible, measurable growth.",
      },
    })
  }

  const allDirectories = await prisma.directory.findMany({ orderBy: [{ tier: "asc" }, { name: "asc" }] })
  for (const directory of allDirectories) {
    await prisma.citation.upsert({
      where: { businessId_directoryId: { businessId: business.id, directoryId: directory.id } },
      update: {},
      create: { businessId: business.id, directoryId: directory.id, status: "NOT_STARTED" },
    })
  }

  const google = allDirectories.find((item) => item.slug === "google-business")
  const bing = allDirectories.find((item) => item.slug === "bing-places")
  const yelp = allDirectories.find((item) => item.slug === "yelp")
  if (!google || !bing || !yelp) throw new Error("Core directories failed to seed")

  await prisma.citation.update({
    where: { businessId_directoryId: { businessId: business.id, directoryId: google.id } },
    data: { status: "VERIFIED", listingUrl: "https://business.google.com/", observedName: business.name, observedAddress: `${business.address1}, ${business.city}, ${business.region} ${business.postalCode}`, observedPhone: business.phone, lastCheckedAt: new Date() },
  })
  await prisma.citation.update({
    where: { businessId_directoryId: { businessId: business.id, directoryId: bing.id } },
    data: { status: "SUBMITTED", observedName: business.name, observedAddress: `${business.address1}, ${business.city}, ${business.region} ${business.postalCode}`, observedPhone: business.phone, submittedAt: new Date(), lastCheckedAt: new Date() },
  })
  const yelpCitation = await prisma.citation.update({
    where: { businessId_directoryId: { businessId: business.id, directoryId: yelp.id } },
    data: { status: "NEEDS_FIX", observedName: "Smarketers Digital", observedAddress: `${business.address1}, ${business.city}, ${business.region} 94040`, observedPhone: "+1 (650) 555-0119", lastCheckedAt: new Date() },
  })

  const seededIssues = await prisma.auditIssue.count({ where: { businessId: business.id } })
  if (seededIssues === 0) {
    await prisma.auditIssue.createMany({ data: [
      { businessId: business.id, directoryId: yelp.id, citationId: yelpCitation.id, field: "Business name", expectedValue: business.name, observedValue: "Smarketers Digital", severity: "MEDIUM" },
      { businessId: business.id, directoryId: yelp.id, citationId: yelpCitation.id, field: "Phone", expectedValue: business.phone, observedValue: "+1 (650) 555-0119", severity: "HIGH" },
      { businessId: business.id, directoryId: yelp.id, citationId: yelpCitation.id, field: "Postal code", expectedValue: business.postalCode, observedValue: "94040", severity: "HIGH" },
    ] })
  }

  console.log(`Seeded vLC with ${allDirectories.length} directories and business “${business.name}”.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => prisma.$disconnect())
