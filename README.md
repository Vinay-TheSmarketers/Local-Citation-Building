# vLC — Automated Local Citation Building Tool

vLC is the local-first citation workspace in the Smarketers Family Off Page Suite. It keeps one Master NAP (name, address, phone) profile, tracks listing workflows, runs Playwright-powered directory audits, surfaces field-level inconsistencies, and resolves stored mismatches with one click.

The application is entirely free and open-source. Business data stays in a local SQLite file; no SaaS account, paid API, hosted database, or telemetry service is required.

## What works

- Editable Master NAP profile backed by SQLite
- Free website metadata and structured-data lookup from the unified hero input
- Dedicated Google Business Profile, Bing Places, and Apple Business Connect workflows
- Assisted submission tracking for Yelp, Foursquare, Yellow Pages, MapQuest, and more
- Headless Playwright search audits with persisted findings and timestamps
- Custom, industry-specific directory creation
- NAP consistency score and field-level mismatch dashboard
- Working **Fix** actions that reconcile a citation record to Master NAP
- Live Sonner progress toasts and an infinite directory trust bar
- Responsive, strict light-only Smarketers interface

## Open-source foundations

The structure follows the exact [shadcn-ui/next-template](https://github.com/shadcn-ui/next-template) foundation: Next.js App Router, locally owned UI components, Tailwind tokens, Radix primitives, Lucide icons, `components.json`, and the `cn()` utility. That repository is archived and its original Next.js 13 dependencies are deprecated, so vLC preserves its architecture while upgrading the runtime to a patched Next.js 15 release and React 19.

Automation uses the official [microsoft/playwright](https://github.com/microsoft/playwright) engine through its published `playwright` package. The implementation is in `lib/automation.ts` and `app/api/automation/audit/route.ts`.

To inspect both exact upstream repositories beside this project without changing vLC:

```powershell
New-Item -ItemType Directory -Force .upstream | Out-Null
git clone --depth 1 https://github.com/shadcn-ui/next-template.git .upstream/shadcn-next-template
git clone --depth 1 https://github.com/microsoft/playwright.git .upstream/playwright
```

On macOS or Linux:

```bash
mkdir -p .upstream
git clone --depth 1 https://github.com/shadcn-ui/next-template.git .upstream/shadcn-next-template
git clone --depth 1 https://github.com/microsoft/playwright.git .upstream/playwright
```

The `.upstream` clones are reference sources only. vLC integrates the template as maintained application code and Playwright as a package, which avoids shipping either upstream repository’s development toolchain in the production bundle.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- Windows, macOS, or Linux
- Internet access during dependency and Chromium installation

## Install and run

From the vLC project directory:

```bash
pnpm install
pnpm setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm setup` performs every required initialization step in order:

1. Generates the Prisma client.
2. Creates or updates `prisma/dev.db` from `prisma/schema.prisma`.
3. Seeds the directory catalog, demo Master NAP, citation statuses, and audit issues.
4. Downloads the open-source Chromium binary used by Playwright.

The seed is idempotent, so running `pnpm setup` again does not duplicate directories, citations, or sample issues.

### Production build

```bash
pnpm typecheck
pnpm build
pnpm start
```

The production build can be packaged into a self-hosted Node container without a paid platform. vLC is intentionally a single-user/local-first application. If it is exposed beyond localhost, place it behind authentication and TLS because the API is designed for a trusted local operator.

## Start from the original template and integrate vLC

These commands reproduce the upstream starting point in a clean sibling directory:

```bash
git clone https://github.com/shadcn-ui/next-template.git vlc-from-template
cd vlc-from-template
git remote rename origin shadcn-template
git switch -c vlc/local-citation-builder
```

Copy these complete vLC paths over the template checkout:

```text
app/
components/
lib/
prisma/
.env.example
.gitignore
components.json
next.config.mjs
package.json
pnpm-workspace.yaml
postcss.config.mjs
tailwind.config.ts
tsconfig.json
README.md
```

Then initialize the upgraded dependencies and database:

```bash
pnpm install
pnpm setup
pnpm typecheck
pnpm build
pnpm dev
```

Playwright is integrated from the exact Microsoft project through `playwright@1.55.0`. To compare or develop against its source checkout:

```bash
git clone --depth 1 https://github.com/microsoft/playwright.git .upstream/playwright
git -C .upstream/playwright remote -v
pnpm browser:install
```

## Citation workflow

1. Enter a business name or website in the hero bar and choose **Get Started**.
2. Confirm and save the Master NAP. It becomes the canonical source for all fixes.
3. Open **Citations** to launch official directory workflows.
4. Choose **Track** after completing a directory’s sign-in or verification step.
5. Choose **Scan** to let Chromium inspect that directory’s public search results.
6. Open **NAP audit**, run a consistency audit, and use **Fix** on any mismatch.

Major directories protect changes with authentication, phone/postcard verification, CAPTCHA, and platform policies. vLC never attempts to bypass those controls. It automates public result inspection and workflow tracking, then opens the official submission page for the operator to complete protected steps. This is the reliable, policy-compatible form of submission automation for Google, Apple, Yelp, and similar services.

## Project map

```text
app/
  api/
    audit/                 consistency calculation and Fix API
    automation/audit/      Playwright headless inspection API
    business/              Master NAP API
    citations/             submission status API
    directories/           custom directory API
    lookup/                website structured-data lookup API
  globals.css              strict white theme and motion styles
  layout.tsx               metadata, toasts, and trust bar
  page.tsx                 server-side dashboard data loader
components/
  audit-dashboard.tsx      NAP score and mismatch resolution UI
  citation-dashboard.tsx   hero, navigation, listings, workflows
  master-nap-form.tsx      canonical business form
  brand-logo.tsx           inline Smarketers trend-line SVG
  trust-bar.tsx             infinite-scrolling directory bar
  ui/                       locally owned shadcn-style primitives
lib/
  automation.ts            isolated Playwright browser engine
  business-lookup.ts       JSON-LD and metadata business discovery
  prisma.ts                development-safe Prisma singleton
  validators.ts            Zod request validation
prisma/
  schema.prisma            SQLite relational schema
  seed.ts                  idempotent working dataset
```

## Environment

Copy `.env.example` to `.env` if `.env` is not present:

```bash
cp .env.example .env
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file relative to `prisma/schema.prisma` |
| `PLAYWRIGHT_HEADLESS` | `true` | Set to `false` to watch local directory scans during development |

## Useful commands

```bash
pnpm db:generate       # Regenerate Prisma client
pnpm db:push           # Synchronize the local schema
pnpm db:seed           # Seed or repair the default dataset
pnpm browser:install   # Install Playwright Chromium
pnpm typecheck         # Strict TypeScript verification
pnpm lint              # ESLint, React, and Next.js checks
pnpm build             # Production Next.js build
```

## Local data and reset

The database is `prisma/dev.db` and is intentionally ignored by Git. To start over, stop the app, delete only that file, and run `pnpm setup`. This permanently removes the local business and citation history, so back up the file first if the data matters.

## License

vLC application code is available under the MIT License. The upstream shadcn template and Playwright project retain their respective licenses.
