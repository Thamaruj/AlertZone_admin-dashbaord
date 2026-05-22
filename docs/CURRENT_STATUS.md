# Current Status — AlertZone Admin Dashboard

> **Last Updated:** 2026-05-22
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
| Phase 4: User Management (Live) | 🟢 Done | Live citizen listing, cascading Province/District filters, status toggle, and details modal |
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
- [x] Collapsible sidebar — slide collapse on desktop and mobile
- [x] Custom zoom controls — premium glassmorphic "+" and "-" buttons overriding API defaults
- [x] Premium scrollbars — styled custom scrollbars for reports navigation
- [x] Users management page — user list with search, cascading province/district filters, status badges, and action confirmations
- [x] Live citizen data integration — fetches registered user profiles (`role: 'citizen'`) from Firestore
- [x] Citizen profile detailed modal — shows NIC, Province, District, LGA, address, badges, gamification level, and points
- [x] User-submitted reports breakdown — displays live statistics (Pending, Assigned, Fixing, Resolved, Rejected) of citizen-submitted reports
- [x] Scrollable report submissions timeline — lists all reports submitted by a citizen dynamically
- [x] Citizen status updates — live suspend/unsuspend toggling in Firestore via server API routes
- [x] Glassmorphic Filter Dropdowns — customized design replacing native chevrons and adding custom focus/hover border glow rings
- [x] Refresh Button — premium text-based button ("Refresh") to manually trigger user list updates
- [x] Suspended Row Contrast — clearly calls out suspended users with a dark red background (`bg-rose-950/25`) and a solid red left-border accent (`shadow-[inset_4px_0_0_0_#ef4444]`)
- [x] Immediate Filter Sync — client-side filter computation removes suspended users instantly from the view when filtered by active status
- [x] Modal Size & Layout Adjustments — increased width to `max-w-5xl` and height to `max-h-[95vh]`, with optimized column distribution (`md:col-span-4` / `md:col-span-8`) and custom scrollbars
- [x] Filter-Independent Overview Stats — Total, Active, and Elite stats card counters remain unaffected by province, district, status, or keyword filters
- [x] Sidebar Navigation Refinements — styled vertical nav tabs, removed glowing effect from left-top brand badge, and updated label to "Admin Dashboard"
- [x] Premium Custom Scrollbars — added smooth custom scrollbars globally for Webkit and Firefox browsers

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
- [x] Clear error message when deactivated/suspended admin accounts attempt to log in ("Your account has been deactivated. Kindly contact the administration.")
- [ ] "Forgot password" — not implemented (hardcoded credentials don't support reset)

### Reports Management (`Reportsmanagement.tsx`)
- [ ] Reports table — uses mock data types that **don't match** the mobile app's Firestore schema
- [ ] Status values are wrong: `"Reported" | "In Progress" | "Solved" | "Closed"` instead of `"PENDING" | "ASSIGNED" | "FIXING" | "RESOLVED" | "REJECTED"`
- [ ] Category values are updated to match planned integration: `"Road & Traffic" | "Water and Drainage" | "Waste & Environment" | "Social Security" | "Bridge & Structural" | "Other"` (still mock, not Firestore-wired)
- [ ] No Firebase queries
- [ ] No status update functionality
- [ ] No notification creation on status change

### Map View (`Mapview.tsx`)
- [x] Google Maps renders mock report pins around Colombo and other Sri Lankan regions
- [x] Cascade filtering — selects province to dynamically load districts and center map
- [x] Province/District boundary highlighting via local geoBoundaries land-clipped GeoJSON — exact polygon overlaid on Google Maps Data Layer (no more approximation circles, land-clipped to avoid highlighting portions of the sea, and uses spelling aliases to match database records)
- [x] Map auto-fits bounds to the selected province/district polygon
- [x] Marker categories, InfoWindows, and selection sync fully integrated with dashboard details panel overlay
- [x] Sidebar collapse frees full map width (flex-1 layout fix)
- [ ] No Firestore data subscription
- [ ] No category/status filters wired to real data

### Users (`Users.tsx`)
- [x] User list — live data queried from Firestore via `/api/users`
- [x] Suspend/activate functionality — live PATCH request updates `status` in Firestore
- [x] User types match mobile app's `UserProfile` schema (includes `nic`, `province`, `district`, `localGovernmentArea`)

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
- [x] User management — read users, suspend/activate
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
- [x] `lib/types/` directory — shared TypeScript interfaces (`user.ts`, `report.ts`)
- [x] `lib/services/` directory — Firebase service layer (`users.service.ts`)
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
