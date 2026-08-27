# vLC — Local Citation Building Tool Architecture & Strategy Guide

> **Smarketers Off-Page Suite** — Local-first Next.js application that maintains a central Master NAP (Name, Address, Phone) profile, runs Playwright-powered directory audits, surfaces field-level NAP inconsistencies, and provides single-click reconciliation actions.

---

## 🤖 Automation Matrix: Automated vs. Human Operator Boundaries

To respect local directory terms, avoid PIN verification failures, and ensure local Map Pack ranking integrity, vLC delineates automation and operator checkpoints:

```
┌─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐
│ ⚡ 100% AUTOMATED BY vLC ENGINE                        │ 👤 HUMAN OPERATOR GATEWAY & DIRECTORY CLAIMING          │
├─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ • Centralized Master NAP storage in SQLite via Prisma   │ • Entering standardized Master NAP business details     │
│ • Directory search URL assembly                         │ • Completing phone / postcard PIN verification on GBP   │
│ • Headless Playwright Chromium listing audit            │ • Uploading official business logos & photos            │
│ • DOM scraping of listed Name, Phone, and Address       │ • Triggering single-click Fix actions to resolve notes  │
│ • Field-level mismatch detection & NAP Score (0–100%)   │ • Monitoring local Map Pack rankings on Google Maps     │
└─────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 🎯 Intricate Local SEO Strategy Playbook

### 1. Master NAP Standardization Standard
Local search engines (Google Maps, Apple Maps, Bing Local) penalize inconsistent business listings. vLC enforces strict Master NAP formatting:
- **Name Standard**: Exact legal business name without keyword stuffing (e.g. *"Acme Plumbing"*, NOT *"Acme Plumbing Best Cheap Plumber"*).
- **Address Standard**: Standardize street abbreviations across all listings (e.g., use `"Suite 100"` uniformly instead of mixing `"Ste 100"` or `"#100"`).
- **Phone Standard**: Use a local area code primary phone number `(XXX) XXX-XXXX`. Avoid toll-free `800` numbers on local citations as they weaken local proximity signals.

### 2. Strategic Citation Tiering
- **Core Entity Platforms (Tier 1)**: Google Business Profile (GBP), Apple Business Connect, Bing Places. These 3 listings account for 80% of local Map Pack ranking weight.
- **Major Directories (Tier 2)**: Yelp, YellowPages, MapQuest, Foursquare, BBB.
- **Industry Niche Citations**: Industry-specific platforms (e.g. Avvo for lawyers, Houzz for contractors, TripAdvisor for hospitality).

---

## 🏗️ End-to-End System Architecture

```mermaid
flowchart TD
    User([User: Business & Citation Operator]) --> UI[Next.js Dashboard UI]
    
    subgraph Master Profile Management
        UI -->|API: /api/business| MasterNAP[(Master NAP Profile - SQLite)]
    end
    
    subgraph Playwright Directory Audit Pipeline
        UI -->|POST /api/automation/audit| AuditRoute[Audit API Handler]
        AuditRoute -->|Fetch Target Listing| Playwright[Playwright Headless Chromium]
        Playwright -->|Search & Extract Listing| Inspection[inspectDirectory in automation.ts]
        Inspection -->|Scrape NAP Fields| TargetData[Extracted Directory NAP Data]
    end
    
    subgraph Reconciliation & Fix Engine
        TargetData --> CompareEngine[NAP Consistency Scoring Engine]
        MasterNAP --> CompareEngine
        CompareEngine --> FieldDiff[Field-Level Mismatch Dashboard]
        FieldDiff -->|User Triggers Fix| FixAPI[POST /api/audit/[id]/fix]
        FixAPI -->|Update Status & Notes| DBUpdate[(Update Citation Record)]
        DBUpdate --> UI
    end
```

---

## 💻 Code Internals & Technical Deep Dive

### 1. Playwright Audit Engine (`app/api/automation/audit/route.ts`)
- Launches Playwright Chromium to audit target directory URLs.
- Scrapes listed Business Name, Address, and Phone details.
- Updates database status to `IN_PROGRESS` or flags mismatches.

### 2. Single-Click Fix API (`app/api/audit/[id]/fix/route.ts`)
- Updates citation records to `RESOLVED`, logging updated timestamps and notes in SQLite via Prisma ORM.

---

## 📊 Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Automation**: Playwright Chromium (`microsoft/playwright`)
- **Database & ORM**: SQLite via Prisma ORM
- **UI**: Tailwind CSS, Radix UI, Lucide Icons, Sonner Toasts

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 🌐 Part of Smarketers Off-Page Suite
vLC is part of the Smarketers Off-Page Suite — open-source, local-first marketing applications designed for privacy, speed, and reliability without SaaS dependencies.
