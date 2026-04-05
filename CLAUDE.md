# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**משלנו (Meshelanu)** — A business directory and marketplace for the Haredi community in Israel. React SPA with Supabase backend. All user-facing text is in **Hebrew** with RTL layout.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint (quiet mode)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # Type checking via tsc (uses jsconfig.json)
npm run preview      # Preview production build
```

No test framework is configured.

## Architecture

- **Frontend:** React 18 + Vite 6 + Tailwind CSS + shadcn/ui (New York style, Lucide icons)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **State:** React Context (`AuthContext.jsx`) + TanStack Query
- **Routing:** React Router v6, BrowserRouter. Routes auto-generated from `pages.config.js`
- **Path alias:** `@/` maps to `./src/`

### Data Access Layer

`src/api/base44Client.js` is a Supabase compatibility layer that mimics the original Base44 SDK API. All data flows through this layer:

```js
import { base44 } from "@/api/base44Client";

// CRUD operations
base44.entities.BusinessPage.filter({ is_active: true }, "-created_date", 50)
base44.entities.Category.list()
base44.entities.BusinessPage.create(data)
base44.entities.BusinessPage.update(id, data)

// Auth
base44.auth.me()
base44.auth.isAuthenticated()

// Integrations (Edge Functions + Storage)
base44.integrations.Core.InvokeLLM(params)
base44.integrations.Core.UploadFile(file)
```

Entity names map to Supabase tables via `TABLE_MAP` in `base44Client.js` (e.g., `BusinessPage` → `businesses`, `Category` → `categories`).

### Key Directories

- `src/pages/` — Page components, one per route (registered in `pages.config.js`)
- `src/components/ui/` — Auto-generated shadcn/ui components. **Do not manually edit.**
- `src/components/` — Custom components (explore/, business/, wizard/, order/, reviews/, banners/, admin/)
- `src/lib/` — Core utilities (AuthContext, supabaseClient, query-client). Excluded from ESLint.
- `functions/` — Supabase Edge Functions (TypeScript)
- `src/constants/businessThemes.js` — Color theme presets for business pages

### ESLint Scope

ESLint only runs on `src/components/**`, `src/pages/**`, and `src/Layout.jsx`. It ignores `src/lib/` and `src/components/ui/`.

### URL Routing

Routes are defined in `src/pages.config.js` as `{ "PageName": PageComponent }`. The `createPageUrl("PageName")` utility (in `src/utils/index.ts`) generates URLs. Clean business routes use `/business/[slug]`.

### Payment

Sumit (Israeli payment gateway) — integration in `functions/createPaymentPage.ts`. Uses `https://api.sumit.co.il/billing/payments/beginredirect/`.

### Environment Variables

All prefixed with `VITE_`:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase connection
- `VITE_BASE44_APP_ID` — App identifier
