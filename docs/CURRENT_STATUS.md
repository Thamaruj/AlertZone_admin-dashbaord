# Current Status — AlertZone Admin Dashboard

> **Last Updated:** 2026-05-21
>
> This document tracks what is done, what is broken, and what remains. Agents MUST read this before starting work.

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---|
| Phase 0: Project Scaffolding | 🟢 Done | Next.js 16 project created with Tailwind CSS v4 |
| Phase 1: UI Shell & Mock Dashboard | 🟡 Partially Done | All UI screens built with hardcoded/mock data |
| Phase 2: Firebase Integration | 🔴 Not Started | Firebase SDK installed, config exists, but NOT wired to any component |
| Phase 3: Reports Management (Live) | 🔴 Not Started | UI exists with mock data |
| Phase 4: User Management (Live) | 🔴 Not Started | UI exists with mock data |
| Phase 5: Notifications System | 🔴 Not Started | UI exists with mock notifications |
| Phase 6: Analytics (Live) | 🔴 Not Started | UI exists with hardcoded chart data |
| Phase 7: Map View (Live) | 🟡 Partially Done | Google Maps integration complete with Sri Lankan Province/District filters |
| Phase 8: Push Notifications (FCM) | 🔴 Not Started | Not implemented |

---

## What IS Working ✅

### Project Infrastructure
- [x] Next.js 16 project with App Router
- [x] Tailwind CSS v4 configured
- [x] Firebase SDK v12 installed
- [x] Firebase config in `lib/firebase.ts` (reads from `.env.local`)
- [x] `.env.local` with correct Firebase project credentials (`alertzone-3d2a3`)
- [x] Firebase `auth` and `db` (Firestore) exports initialized
- [x] Dev server runs with `npm run dev`

### UI Shell (All Mock Data)
- [x] Admin login page — beautiful dark theme, matches mobile app design system
- [x] Main dashboard layout — sidebar nav + topbar + content area
- [x] Dashboard overview — stat cards, donut chart, bar chart, line chart, recent reports table
- [x] Reports management page — table with filters, search, detail view
- [x] Map view — Google Maps API integration with dynamic script loader (SSR-safe)
- [x] Map custom style — premium dark-mode styling configuration for Google Maps
- [x] Interactive filters — Province and District cascading dropdowns with coordinate centering
- [x] Map markers & overlays — custom category markers and popups with selection synchronization
- [x] Users management page — user list with search and filters
- [x] Analytics page — multiple chart types and data visualizations
- [x] Notifications page — notification list with read/unread status
- [x] Mobile responsive sidebar (hamburger menu)
- [x] Custom interactive dialogs/modals for activating, deactivating and deleting admins (replacing browser alerts)
- [x] Custom interactive dialogs/modals for suspending/unsuspending citizen users (replacing browser alerts)
- [x] Double-layer verification (irreversible deletion warning + confirm checkbox) for admin deletion
- [x] Brightened inactive admin row red styling highlights in the admin table
- [x] Brightened suspended citizen user row red styling highlights in the users table
- [x] Inactive StatusBadge styled with red colors to match the table theme
- [x] Suspended citizen user StatusBadge styled with rose/red colors to match the table theme

---

## What Uses MOCK DATA (UI exists, not wired to Firebase) 🟡

### Dashboard Overview (`Maindashboard.tsx`)
- [ ] Stat cards — all values hardcoded (`1,284`, `432`, `215`, `537`, `100`)
- [ ] Donut chart — hardcoded values
- [x] Bar chart — reads from `BAR_DATA` (populated in mockData.ts)
- [x] Line chart — reads from `MONTHLY_DATA` (populated in mockData.ts)
- [x] Recent reports table — reads from `MOCK_REPORTS` (populated in mockData.ts)
- [ ] User profile in topbar — hardcoded "Alex Morgan / Super Admin"

### Admin Login (`Adminlogin.tsx`)
- [x] Login form — real auth via `/api/auth/login` (username + password)
- [x] Server-side credential validation (superadmin from `.env.local`, other admins from Firestore)
- [x] Session persistence via HttpOnly JWT cookie (8-hour standard duration)
- [x] AuthContext provider wraps the app — all components can use `useAuth()`
- [x] Superadmin hardcoded in `.env.local` (SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD_HASH)
- [x] Additional admins stored in Firestore `adminUsers` collection with bcrypt hashes
- [x] Role-based access: `admin` and `superadmin` roles
- [x] Username-only login (email removed — can be added later)
- [x] Real error messages for wrong credentials
- [ ] "Forgot password" — not implemented (hardcoded credentials don't support reset)

### Reports Management (`Reportsmanagement.tsx`)
- [ ] Reports table — uses mock data types that **don't match** the mobile app's Firestore schema
- [ ] Status values are wrong: `"Reported" | "In Progress" | "Solved" | "Closed"` instead of `"PENDING" | "ASSIGNED" | "FIXING" | "RESOLVED" | "REJECTED"`
- [ ] Category values are wrong: `"Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety"` instead of mobile app categories
- [ ] No Firebase queries
- [ ] No status update functionality
- [ ] No notification creation on status change

### Map View (`Mapview.tsx`)
- [x] Google Maps renders mock report pins around Colombo and other Sri Lankan regions
- [x] Cascade filtering — selects province to dynamically load districts and center map
- [x] Marker categories, InfoWindows, and selection sync fully integrated with dashboard details panel overlay
- [ ] No Firestore data subscription
- [ ] No category/status filters wired to real data

### Users (`Users.tsx`)
- [ ] User list — mock data types, no Firestore connection
- [ ] No suspend/activate functionality
- [ ] User types don't match mobile app's `UserProfile` schema

### Analytics (`Analytics.tsx`)
- [ ] All charts use hardcoded/empty data
- [ ] No Firestore aggregation queries
- [ ] No date range filtering with real data

### Notifications (`Notifications.tsx`)
- [ ] Shows `MOCK_NOTIFICATIONS` array (5 hardcoded items)
- [ ] No Firestore connection
- [ ] No ability to create real notifications

---

## What Is NOT Built Yet 🔴

### Firebase Integration
- [x] Admin authentication — hardcoded superadmin + Firestore-backed admin users
- [x] Auth state persistence (HttpOnly JWT cookie session)
- [x] Auth context/provider (`lib/context/AuthContext.tsx`) for the dashboard
- [x] Auth service layer (`lib/services/auth.service.ts`) (migrated to Firebase Admin SDK to resolve Firestore write permissions issues)
- [x] Firebase Admin SDK configuration (`lib/firebase-admin.ts`)
- [ ] TypeScript types matching the mobile app's Firestore schema (reports, users, notifications)

### Core Functionality
- [ ] Real-time report fetching from Firestore
- [ ] Report status updates with `statusHistory` append
- [ ] Notification creation on status change (critical for mobile app)
- [ ] User management — read users, suspend/activate
- [ ] Report archival (soft-delete with `isArchived`)
- [ ] Report assignment (`assignedTo` field)
- [ ] Resolution notes (`resolutionNote` field)

### Analytics & Data
- [ ] Real-time stats aggregation from Firestore
- [ ] Reports-over-time chart with real data
- [ ] Category/status/area distribution charts
- [ ] Resolution rate calculation
- [ ] Average resolution time calculation
- [ ] Date range filtering

### Map
- [x] Integrate Google Maps JavaScript API with a custom premium dark styling configuration
- [x] Support custom marker overlays utilizing categories and selection sync with dashboard details panel
- [x] Cascading Province and District filters targeting Sri Lankan regions
- [x] Center panning on active elements and selection updates
- [ ] Real report pins from Firestore (live subscription)
- [ ] Marker clustering for dense areas
- [ ] Real-time updates on map (live subscription)

### Notifications
- [ ] Create Firestore notifications on status change
- [ ] System-wide announcement creation
- [ ] FCM push notification integration
- [ ] Notification delivery stats

### Missing Infrastructure
- [ ] `lib/types/` directory — shared TypeScript interfaces
- [ ] `lib/services/` directory — Firebase service layer
- [ ] `lib/hooks/` directory — custom React hooks
- [ ] `lib/constants/` directory — shared constants (categories, statuses, colors)
- [ ] Auth context with admin role verification
- [ ] Error handling and loading states with real data
- [ ] Google Maps API key in `.env.local` for map features

---

## Known Issues & Technical Debt 🐛

| Issue | Severity | Location | Notes |
|---|---|---|---|
| Login is fake (setTimeout simulation) | 🟢 Fixed | Adminlogin.tsx | Real credential validation implemented with superadmin and Firestore admin users |
| Mock data types don't match Firestore schema | 🔴 Critical | `app/data/mockData.ts` | Categories, statuses, and types are all wrong |
| Test credentials hardcoded in test page | 🟡 Medium | `test-connection/page.tsx` | Password exposed in source code |
| No auth state persistence | 🟢 Fixed | `app/page.tsx` | Uses HttpOnly JWT cookie via AuthContext |
| User profile hardcoded in topbar | 🟢 Fixed | `Maindashboard.tsx` | Now reads from AuthContext |
| console.log in firebase.ts | 🟢 Low | `lib/firebase.ts` | Remove before production |
| No Firebase Storage import | 🟡 Medium | `lib/firebase.ts` | Needed for report image URLs |
| No `.env.local` in `.gitignore` check | 🟡 Medium | `.gitignore` | Verify Firebase keys aren't committed |

---

## Firebase Services Status

| Service | Status | Notes |
|---|---|---|
| **Authentication** | 🟡 SDK Ready | Firebase Auth initialized but not used in login |
| **Firestore** | 🟡 SDK Ready | Firestore initialized but no queries run |
| **Storage** | 🔴 Not Imported | Needed for report image display |
| **Cloud Messaging** | 🔴 Not Set Up | Needed for push notifications to mobile |
| **Cloud Functions** | 🔴 Not Set Up | May be needed for automated notifications |
| **Security Rules** | 🔴 Not Configured | Must support admin read/write access |

---

## Dependencies Status

| Dependency | Installed | Used | Notes |
|---|---|---|---|
| `firebase` v12 | ✅ | 🟡 Partially | SDK init only, no actual queries |
| `next` v16 | ✅ | ✅ | App Router working |
| `react` v19 | ✅ | ✅ | — |
| `leaflet` | ❌ | ❌ | Removed (replaced with Google Maps) |
| `react-leaflet` | ❌ | ❌ | Removed (replaced with Google Maps) |
| `tailwindcss` v4 | ✅ | ✅ | Styling works |
| Chart library | ❌ | — | Using custom SVG charts currently |
| `firebase-admin` | ✅ | ✅ | Used in server-side authentication service (auth.service.ts) to bypass client security rules |
| `@opentelemetry/api` | ✅ | ✅ | Peer dependency for firebase-admin Firestore to prevent login/import network crashes |
