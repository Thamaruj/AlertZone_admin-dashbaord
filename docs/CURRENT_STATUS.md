# Current Status — AlertZone Admin Dashboard

> **Last Updated:** 2026-05-26
>
> This document tracks what is done, what is broken, and what remains. Agents MUST read this before starting work.

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---|
| Phase 0: Project Scaffolding | 🟢 Done | Next.js 16 project created with Tailwind CSS v4 |
| Phase 1: UI Shell & Mock Dashboard | 🟡 Partially Done | All UI screens built with hardcoded/mock data |
| Phase 2: Firebase Integration | 🟢 Done | Firebase Client & Admin SDKs fully integrated across auth, users, and reports |
| Phase 3: Reports Management (Live) | 🟢 Done | UI wired to real Firestore data, handles status changes and notifications |
| Phase 4: User Management (Live) | 🟢 Done | Live citizen listing, cascading Province/District filters, status toggle, and details modal |
| Phase 5: Notifications System | 🟢 Done | Real-time notifications tab with Firestore logs and megaphone broadcast modal |
| Phase 6: Analytics (Live) | 🟢 Done | Wired to real Firestore via `/api/analytics`; daily activity, category breakdown, province distribution, and KPI cards all use live data |
| Phase 7: Map View (Live) | 🟢 Done | Google Maps integration complete with active report Firestore live data and status/type filters |
| Phase 8: Push Notifications (Expo) | 🟢 Done | Integrated using Expo Push API, successfully sending status mutations and megaphone broadcasts |

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
- [x] Map View Sidebar Card & Overlay Restructuring — updated sidebar cards, map InfoWindows, and selected report details overlay in `Mapview.tsx` to display Report Type (e.g., Road & Traffic Incident) as the main title, and place the monospaced Incident ID directly below it. Configured reported addresses to wrap naturally without using bold/title fonts.
- [x] Reports Redirection & Auto-Open — wired the "Open Management" button in Map View to redirect the admin to Reports Management and automatically trigger the detailed modal popover view.
- [x] Settings page — complete admin settings section with: My Account info card (avatar, display name, username, role), Edit Profile form (display name update via `/api/auth/profile`, JWT re-issued on change), Change Password form (bcrypt verification, strength meter, confirm match), About AlertZone system card (Firebase project, version, GitHub/Firebase links), and Sign Out button with confirmation modal. Superadmins see read-only notices for credentials managed via `.env.local`.
- [x] Settings UI Upgrade — redesigned Settings page layout from a compact grid to a spacious, premium 3-column configuration (`lg:grid-cols-3` split into `col-span-1` left column and `col-span-2` right column). Upgraded card borders (`border-white/10`), inner card body padding (`p-6`), header spacing (`px-6 py-5`), larger avatar layout (`w-20 h-20` with glow ring), form textfield inputs (`rounded-xl px-4 py-3`), InfoRow vertical padding, and standardized button layouts across the entire page for consistent visual breathing room.

### Notifications & Push System
- [x] Real-time notification log — displays broadcast and system notifications directly from Firestore
- [x] Megaphone Broadcast Modal — superadmin and admin users can broadcast site-wide announcements to all citizens
- [x] Bulk & Single Push Delivery — integrated via Expo Push API to push status update notifications and broadcasts to native devices
- [x] Mobile Notification Center — citizen users can view, filter (unread/read), and delete notifications in a dark-mode in-app feed
- [x] Unread badge count — syncs the home screen bell icon badge in real-time with user notifications
- [x] Tap Redirect — clicking on a notification redirects the user to the Map view and centers on the corresponding report coordinate
- [x] Expo Go compatibility — safely bypassed remote push registration side effects in Expo Go via static subpath imports to allow testing in both environments without bundler crashes or startup warnings


### Reports Management (Live)
- [x] Reports fetched via secure server-side API endpoints (`/api/reports`) using the Firebase Admin SDK, resolving Vercel unauthenticated permission errors and bypassing composite index requirements.
- [x] Full UI detail modal with dynamic timeline styles matching report statuses
- [x] Status updates and mutations processed securely via backend PATCH route (`/api/reports/[id]`), appending to `statusHistory` and rewarding contribution points to citizens (+10 pts) for validated fixes.
- [x] Automatic user notification generation within Firestore on the backend when an admin changes a report status
- [x] Robust reverse geographical lookup (`resolveSrilankaRegion`) mapping suburbs and GPS directly to formal Provinces, Districts, and LGAs using the centralized 341-LGA coordinates database.
- [x] Centroid-based fallback: uses coordinates to calculate the nearest LGA center if text matching is sparse or absent.
- [x] Regex-based boundary matching: prevents incorrect subword overlaps (such as `"ella"` matching inside `"avissawella"` or `"pussellawa"`).
- [x] User avatars embedded directly into reporter cards, fetched instantly upon opening the modal
- [x] Reporter ID removed from UI for cleaner layout
- [x] Added premium text-based "Refresh" button next to "Export Data" (matching User Management theme), removing the refresh SVG icon and the "New Report" button.
- [x] Added robust client-side loading and error display states with custom "Retry" buttons if fetching fails
- [x] Separated location details into Province and District (2-column layout) and Local Government Area (LGA) on its own full-width line below them to prevent half-seen/truncation issues inside the details modal, and added a custom Google Maps deep-link
- [x] Renamed the 'Submitted' card to 'Date & Time' and configured it to show date and 12-hour time (with AM/PM) on separate lines for cleaner visual alignment
- [x] Restructured list cards in the incident list view to show `Province:`, `District:`, and `LGA:` on separate lines below the title, with the incident category title on the left and the 12-hour AM/PM date and time (with calendar icon) inline directly to the right of the title.
- [x] Changed all reports helper functions (`resolveLocation`, `getReportDateString`, `formatDate`, `getFormattedDateTime`) to hoisted function declarations to avoid client-side TDZ ReferenceErrors on initialization.
- [x] Added a premium glassmorphic multi-filter panel containing a Date Range filter ("From Date" and "To Date" with custom glassmorphic React-based `CustomCalendar` dropdown popovers matching the dashboard's design system), Category, Province, District, and LGA cascading selectors, along with a dynamic "Clear Filters" reset button.
- [x] Integrated auto-close on click-outside logic and quick-select buttons ("Today", "Clear") directly within the custom calendar popovers.
- [x] Displays a live count showing `{filteredReports.length} Reports found` directly below the filter grid to dynamically update as the admin interacts with the filters.
- [x] Replaced old incident category emojis with modern vector SVG icons across all lists and modals

---

## What Uses MOCK DATA (UI exists, not wired to Firebase) 🟡

### Dashboard Overview (`Maindashboard.tsx`)
- [ ] Stat cards — all values hardcoded (`1,284`, `432`, `215`, `537`, `100`)
- [ ] Donut chart — hardcoded values
- [x] Bar chart — reads from `BAR_DATA` (populated in mockData.ts)
- [x] Line chart — reads from `MONTHLY_DATA` (populated in mockData.ts)
- [x] Recent reports table — reads from `MOCK_REPORTS` (populated in mockData.ts)
- [ ] User profile in topbar — hardcoded "Alex Morgan / Super Admin"
- [x] Desktop topbar removed — content area now gets full vertical space on `md+`; profile card moved to sidebar bottom above Sign Out

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
- [x] Real-time admin account deactivation tracking via Firestore client listener in AuthContext
- [x] Forced logout with 2-minute countdown timer and blur overlay on deactivation
- [x] Superadmin active admin warning popup: alerts superadmin if they attempt to deactivate an admin who has been active in the last 20 seconds
- [x] Superadmin active admin deletion block: prevents deletion of admin accounts that are active or online, requiring deactivation and logout first.
- [ ] "Forgot password" — not implemented (hardcoded credentials don't support reset)

### Map View (`Mapview.tsx`)
- [x] Google Maps renders mock report pins around Colombo and other Sri Lankan regions
- [x] Cascade filtering — selects province to dynamically load districts and center map
- [x] Province/District boundary highlighting via local geoBoundaries land-clipped GeoJSON — exact polygon overlaid on Google Maps Data Layer (no more approximation circles, land-clipped to avoid highlighting portions of the sea, and uses spelling aliases to match database records)
- [x] Map auto-fits bounds to the selected province/district polygon
- [x] Marker categories, InfoWindows, and selection sync fully integrated with dashboard details panel overlay
- [x] Sidebar collapse frees full map width (flex-1 layout fix)
- [x] Firestore data subscription (wired to real data via `useReports()`)
- [x] Category/status filters wired to real data (replaced with Active Status and Report Type select dropdowns)

### Users (`Users.tsx`)
- [x] User list — live data queried from Firestore via `/api/users`
- [x] Suspend/activate functionality — live PATCH request updates `status` in Firestore
- [x] User types match mobile app's `UserProfile` schema (includes `nic`, `province`, `district`, `localGovernmentArea`)

### Analytics (`Analytics.tsx`)
- [x] All charts wired to real Firestore data via `/api/analytics`
- [x] Server-side Firestore aggregation (daily activity, category breakdown, province distribution, KPI stats)
- [x] Date range filtering (7 / 30 / 90 days) triggers live re-fetch
- [x] Loading skeletons and error state with Retry button



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
- [x] Real-time report fetching from Firestore
- [x] Report status updates with `statusHistory` append
- [x] Notification creation on status change (critical for mobile app)
- [x] User management — read users, suspend/activate
- [ ] Report archival (soft-delete with `isArchived`)
- [ ] Report assignment (`assignedTo` field)
- [x] Resolution notes (`resolutionNote` field)

### Analytics & Data
- [x] Real-time stats aggregation from Firestore
- [x] Reports-over-time chart with real data
- [x] Category/status breakdown charts
- [x] Province distribution table with resolution rates
- [x] Resolution rate calculation
- [x] Average resolution time calculation (from statusHistory)
- [x] Date range filtering (7/30/90 days)

### Map
- [x] Integrate Google Maps JavaScript API with a custom premium dark styling configuration
- [x] Support custom marker overlays utilizing categories and selection sync with dashboard details panel
- [x] Cascading Province and District filters targeting Sri Lankan regions
- [x] Center panning on active elements and selection updates
- [ ] Real report pins from Firestore (live subscription)
- [ ] Marker clustering for dense areas
- [ ] Real-time updates on map (live subscription)



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
| **Cloud Messaging** | 🟢 Done | Integrated with Expo Push API for mobile remote notifications |
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
