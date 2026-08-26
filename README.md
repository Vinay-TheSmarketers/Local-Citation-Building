# vLC — Local Citation Building Tool Architecture & Guide

> **Smarketers Off-Page Suite** — Local-first Next.js application that maintains a central Master NAP (Name, Address, Phone) profile, runs Playwright-powered directory audits, surfaces field-level NAP inconsistencies, and provides single-click reconciliation actions.

---

## 🏗️ System Architecture Overview

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

## 🔍 How Audit & Field-Level Reconciliation Works

### 1. Master NAP Single Source of Truth
vLC stores all primary business details (Legal Name, Primary Street Address, Suite/Unit, City, State, ZIP, Primary Phone, Website URL) in local SQLite database tables via Prisma ORM (`app/api/business/route.ts`).

### 2. Playwright Headless Directory Inspection
When an audit is triggered for a specific directory (e.g., Yelp, Yellow Pages, MapQuest):
1. vLC launches a Playwright Chromium session in `app/api/automation/audit/route.ts`.
2. `inspectDirectory()` navigates to the directory's search endpoint with business name, city, and phone parameters.
3. DOM selectors extract listed Business Name, Phone Number, and Address fields.
4. Checks whether the exact name and phone exist on the target directory page.

### 3. Field-Level Mismatch & One-Click Fix
- Compares directory listing fields against Master NAP record.
- Calculates an overall **NAP Consistency Score** (0% – 100%).
- Highlights exact discrepancies (e.g., `"Suite 200"` vs `"Ste 200"`, missing phone extensions).
- **Fix Action**: Reconciles citation status to `IN_PROGRESS` or `RESOLVED`, logging updated timestamps and notes in SQLite.

---

## 📊 Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Automation**: Playwright Chromium (`microsoft/playwright`)
- **Database & ORM**: SQLite via Prisma ORM
- **UI & Toast Notifications**: Tailwind CSS, Radix UI Primitives, Lucide Icons, Sonner Toasts

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
