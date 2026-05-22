# AlertZone Admin Dashboard — Project Progress & Milestone Log

This document tracks the end-to-end development journey of the AlertZone admin dashboard, documenting every step, feature, and architectural decision made since the project's inception.

---

## 🛠 Phase 0: Project Scaffolding
**Objective:** Create the Next.js project and establish the basic structure.

- **[2026-05-20] Project Initialized:**
    - Created Next.js 16 project with App Router using `create-next-app`.
    - Configured Tailwind CSS v4 for styling.
    - Added Firebase JS SDK v12 (`firebase` package).
    - Added Leaflet + react-leaflet for map functionality.

- **[2026-05-20] Firebase Configuration:**
    - Created `lib/firebase.ts` — initializes Firebase App, Auth, and Firestore.
    - Created `.env.local` with Firebase project credentials for `alertzone-3d2a3`.
    - Created `test-connection/page.tsx` to verify Firebase connectivity.

---

## 🎨 Phase 1: UI Shell & Mock Dashboard
**Objective:** Build the entire admin dashboard UI with placeholder/mock data to establish the visual foundation.

- **[2026-05-20] Admin Login Page:**
    - Built `Adminlogin.tsx` — dark theme login form matching the mobile app's design system.
    - Features: email, password, username fields, show/hide password, keep-me-logged-in checkbox.
    - Currently uses `setTimeout()` simulation (not wired to Firebase Auth).

- **[2026-05-20] Main Dashboard Shell:**
    - Built `Maindashboard.tsx` — sidebar navigation + topbar + main content area.
    - 7 navigation items: Dashboard, Reports, Map, Users, Analytics, Notifications, Settings.
    - Mobile responsive with hamburger menu and sidebar overlay.
    - Background glow effects matching the mobile app's aesthetic.

- **[2026-05-20] Dashboard Overview:**
    - 5 stat cards (Total Reports, Reported, In Progress, Solved, Closed) — all hardcoded.
    - Custom SVG donut chart for status distribution.
    - Custom SVG bar chart for category breakdown.
    - Custom SVG line chart for monthly trend.
    - Recent reports table with mock data.

- **[2026-05-20] Reports Management:**
    - Built `Reportsmanagement.tsx` — full reports table with search, filters, detail view.
    - Note: Uses incorrect types that don't match the mobile app's Firestore schema.

- **[2026-05-20] Map View:**
    - Built `Mapview.tsx` — Leaflet map with SSR-safe dynamic import.
    - Map renders but has no real report pin data.

- **[2026-05-20] Users Management:**
    - Built `Users.tsx` — user list with search and status filter.
    - Uses mock data types.

- **[2026-05-20] Analytics:**
    - Built `Analytics.tsx` — multiple chart types and data visualizations.
    - All charts use hardcoded or empty data arrays.

- **[2026-05-20] Notifications:**
    - Built `Notifications.tsx` — notification list with read/unread states.
    - Uses `MOCK_NOTIFICATIONS` with 5 hardcoded items.

---

## 📚 Phase 2: Documentation & Planning
**Objective:** Create comprehensive documentation to guide Firebase integration and align with the mobile app.

- **[2026-05-20] Documentation Suite Created:**
    - `docs/MOBILE_APP_INTEGRATION_GUIDE.md`: Detailed guide for how the dashboard interacts with the mobile app's Firebase data.
    - `docs/CURRENT_STATUS.md`: Full tracking of what's built, mock data areas, and missing features.
    - `docs/ARCHITECTURE.md`: Target architecture with layered pattern (Components → Hooks → Services).
    - `docs/IMPLEMENTATION_PLAN.md`: 10-phase roadmap for Firebase integration.
    - `docs/PROJECT_PROGRESS.md`: This file — milestone tracking.
    - `docs/FIRESTORE_DATA_MODEL.md`: Shared Firestore schema documentation.
    - `docs/GUIDELINES.md`: Project-specific coding conventions and design system.
    - `AGENTS.md`: Updated with mandatory reading list and agent rules.

---

### Phase 4: Admin Authentication — Hardcoded Credentials System
- **Status:** ✅ Completed — 2026-05-21

**What was implemented:**
- Replaced fake `setTimeout` login with a real, secure authentication system.
- **Superadmin** credentials stored server-side in `.env.local` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD_HASH`).
- **Additional admins** stored in Firestore `adminUsers` collection with `bcryptjs` password hashing.
- **JWT session cookies** (`jose`) — HttpOnly, SameSite=Lax. 8-hour default, 30-day "keep me logged in".
- **`lib/services/auth.service.ts`** — server-side only service: credential validation, JWT creation/verification, admin CRUD.
- **API routes**:
  - `POST /api/auth/login` — validates credentials, sets cookie
  - `POST /api/auth/logout` — clears cookie
  - `GET /api/auth/session` — restores session on page load
  - `GET/POST /api/admin-users` — list / create admin users (superadmin only)
  - `PATCH/DELETE /api/admin-users/[id]` — update / delete (superadmin only)
- **`lib/context/AuthContext.tsx`** — React context provider exposing `user`, `isSuperAdmin`, `login`, `logout`.
- **`lib/hooks/useAuth.ts`** — convenience re-export.
- **`lib/types/auth.ts`** — `AdminUser`, `AdminSession`, `AdminRole` types.
- **`lib/constants/auth.ts`** — role metadata, cookie name, session durations.
- **Updated `Adminlogin.tsx`** — removed email field and fake auth; real error messages.
- **Updated `Maindashboard.tsx`** — real user display (name + role badge) from context; logout button in sidebar; "Admin Users" tab visible only to superadmin.
- **New `AdminUserManagement.tsx`** — table of Firestore admin accounts; create/deactivate/delete modal; superadmin-only.
- **`scripts/hash-password.mjs`** — utility to generate bcrypt hashes for `.env.local`.
- **Environment Variable Bug Fix**: Resolved a critical issue where Next.js failed to load or incorrectly expanded the `SUPERADMIN_PASSWORD_HASH` because bcrypt hashes contain `$` symbols which Next.js interprets as environment variable expansions. Fixed by escaping all `$` signs with `\$` in `.env.local` and updating `scripts/hash-password.mjs` to automatically escape hashes in its output.
- **Vercel/Production Compatibility Fix**: In production environments (like Vercel), environment variables are injected directly by the platform and do not undergo Next.js's local dotenv parser expansion, meaning they are read literally (retaining backslashes if they were escaped, or standard if unescaped). Updated `lib/services/auth.service.ts` to automatically unescape dollar signs in the password hash at runtime, ensuring the hash works correctly regardless of how it is defined in Vercel or local environments.
- **Logout Confirmation**: Added a premium-styled custom modal prompting for confirmation before logging out, replacing the immediate sign out action.
- **Removed "Keep me logged in"**: Cleaned up the login interface by removing the "keep me logged in" checkbox and defaulting all session lifetimes to the standard 8-hour duration.

- **[2026-05-21] Firebase Admin SDK Integration (Admin Bypass):**
    - Installed `firebase-admin` dependency to perform backend administrative Firestore actions.
    - Created [lib/firebase-admin.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/firebase-admin.ts) to handle administrative authentication (supporting environment variables and local `service-account.json` fallback).
    - Refactored [lib/services/auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to utilize the Firebase Admin SDK instead of the client SDK. This resolves the `"Missing or insufficient permissions"` error when a superadmin creates, updates, or deletes other admin accounts (since server-side operations using service accounts bypass client Firestore security rules).
    - Added `service-account.json` to `.gitignore` to prevent secret key leakage.
    - Verified security boundaries: standard users/mobile app still utilize strict client-side Firestore security rules while admin portal operations are processed securely on the server-side.
    - **Added `@opentelemetry/api` package**: Fixed a login crash/network error caused by the missing open telemetry peer dependency required by `firebase-admin`'s firestore package.
    - **Enhanced User & Admin Management UIs**:
      - Styled inactive admin accounts with a brightened red row background highlight (`bg-red-500/20`) and enhanced status badge for clear visibility.
      - Styled suspended citizen user accounts with a brightened rose row background highlight (`bg-rose-500/20`) and matching text highlights to align with the admin table theme.
      - Replaced generic browser `confirm()` alerts with beautiful, theme-matching interactive custom modals for all status actions (activation, deactivation/suspension, and deletion) on both screen flows.
      - Added a double-layer safety validation checkbox for deleting accounts, requiring confirmation of irreversible action before enabling the button.

**Default superadmin credentials (change before production):**
- Username: `superadmin`
- Password: `admin1234`

- **[2026-05-21] Google Maps Migration, Collapsible Sidebar & Custom Controls:**
    - Replaced the Leaflet map completely to exclusively run Google Maps JavaScript API with custom premium dark mode themes.
    - Uninstalled `leaflet`, `@types/leaflet`, and `react-leaflet` to clean up codebase dependencies.
    - Implemented dynamic cascading Sri Lankan Province and District dropdown filters on the reports list sidebar.
    - Added a collapsible sidebar toggle mechanism (sliding left on desktop, up on mobile) allowing the map to take full width when collapsed.
    - Replaced default Google Maps zoom controls with custom premium glassmorphic zoom buttons.
    - Styled custom rounded teal scrollbars for scrollable lists inside the map sidebar.
    - Removed the "Live from Firebase" sub-text element.
    - Added automatic map centering logic to pan/re-center on filtered items and active marker selections.
    - Applied clean, professional sans-serif typography across all map overlay elements, custom HTML markers, and InfoWindows.
    - Expanded `MOCK_REPORTS` in `app/data/mockData.ts` to include realistic coordinates, provinces, and districts spanning multiple Sri Lankan regions (Western, Central, Southern, Northern, Eastern) to verify cascading filters.
    - Successfully compiled and tested Next.js production build without any linting, TS compiler, or peer-dependency regressions.

---

- **[2026-05-21] Map Boundary Highlighting, Sidebar Fix & Report Category Overhaul:**
    - **Report Categories Renamed**: Updated `ReportCategory` type and all category metadata across `mockData.ts`, `Mapview.tsx`, `Reportsmanagement.tsx`, and `Maindashboard.tsx` to use the final agreed categories: `Road & Traffic`, `Water and Drainage`, `Waste & Environment`, `Social Security`, `Bridge & Structural`, `Other`. Updated mock report entries and `INCIDENT_BY_CATEGORY` data to use new categories.
    - **Exact Province/District Polygon Highlighting**: Replaced the approximate circle overlay with a proper `google.maps.Data` layer that fetches real GeoJSON polygon boundaries from the OpenStreetMap Nominatim API. When a province or district is selected, the exact administrative boundary is drawn on the map with a teal fill/stroke. Map also auto-fits bounds to the polygon via `fitBounds()`.
    - **Sidebar Collapse Layout Fix**: Fixed the sidebar collapse so the Google Maps area (`flex-1`) correctly expands to fill the freed space when the sidebar is collapsed. Removed fixed `w-full md:w-96` from the outer container; width is now fully conditional on the `isSidebarCollapsed` state, allowing the map to take full available width on desktop.

---

- **[2026-05-21] Switch to Local geoBoundaries Land-Clipped GeoJSON for Boundary Highlighting:**
    - **Land-Clipped Boundaries**: Replaced the Nominatim API boundary highlighting with high-quality local GeoJSON files from geoBoundaries (LKA ADM1 for provinces, LKA ADM2 for districts) to avoid highlighting parts of the sea for coastal districts and provinces.
    - **Offline Local Serving**: Saved the GeoJSON files directly into the project at `public/geojson/lka-adm1.geojson` and `public/geojson/lka-adm2.geojson` to solve performance, rate limiting, and CORS issues.
    - **LFS Text Pointer Resolving**: Addressed a bug where loading files from GitHub raw fetched LFS text pointers instead of the actual JSON data, by serving and loading files locally via standard Next.js pathing (`/geojson/lka-adm1.geojson`).
    - **Name & Suffix Normalization**: Updated `matchesRegion` comparison logic to dynamically strip " Province" and " District" suffixes from geoBoundaries features to match dropdown filter names.
    - **Spelling Alias Support**: Implemented a spelling normalization mapping to reconcile spelling discrepancies between the dropdowns and geoBoundaries (e.g., translating "Moneragala" to "Monaragala").

- **[2026-05-22] Live User Management Integration:**
    - Integrated the frontend **User Management** page ([Users.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Users.tsx)) to pull live citizen profiles from the Firestore `users` collection.
    - Implemented Sri Lankan Province, District, and Status cascading filtering. Selecting a Province filters the District options, and the list updates dynamically with a debounced search query.
    - Replaced the mock table columns with the following:
        1. **User Identity**: Avatar/Initial, Full Name, Email, and **NIC** (National Identity Card).
        2. **Contact Details**: Phone, **Province**, **District**, **Local Government Area**, and **Address**.
        3. **Gamification Details**: Level, Points, Reports Validated.
        4. **Join Date**: Formatted date string from Firestore metadata.
        5. **Status Badge & Actions**: Active/Suspended badge and dynamic trigger buttons.
    - Developed a comprehensive **User Detail Modal** showing detailed profile records, a status-wise breakdown of their submitted reports (Pending, Assigned, Fixing, Resolved, Rejected), and a scrollable list of their complete reports history.
    - Integrated live **Suspend/Unsuspend** actions. Confirming in the modal triggers a PATCH request to the Firestore admin API, toggling user active status dynamically.
    - Verified compilation and successfully passed production builds using `npm run build` with zero compiler errors.

- **[2026-05-22] User Management UI/UX Refinement & Navigation Sidebar Overhaul:**
    - **Custom Glassmorphic Dropdowns**: Styled the Province, District, and Status filters on the User Management page to override default native selectors, adding a custom right-aligned SVG chevron, focus glow outlines, border ring accents, and premium dark options list styling.
    - **Text-Based Refresh**: Created a text-based "Refresh" button next to the search input with smooth transitions and status text updates ("Refreshing...") to manually trigger list updates.
    - **Suspended Rows Redesign**: Enhanced visibility of suspended rows by replacing the light pink tint with a high-contrast dark red background (`bg-rose-950/25`), red text highlights, and a solid red left-border accent bar using inset shadows (`shadow-[inset_4px_0_0_0_#ef4444]`).
    - **Immediate Filter Sync**: Implemented client-side filtering logic via a new `filteredLocalUsers` memo to instantly remove users from the paginated table view when they are suspended if the "Active" filter is currently active.
    - **Modal Adjustments & Scrollbars**: Slightly increased the citizen profile modal width to `max-w-5xl` and maximum height to `max-h-[95vh]`, updating column distributions from `md:col-span-5` / `md:col-span-7` to `md:col-span-4` / `md:col-span-8` to maximize horizontal reading space for report lists, and attached custom thin scrollbar hooks.
    - **Filter-Independent Stats Overview**: Refactored the backend `/api/users` endpoint to return global user counters (Total, Active, Elite Contributors) so that top-row statistics remain unaffected by province, district, status, or keyword filters on the list.
    - **Sidebar Header and Badge Refinement**: Refined navigation button visuals, removed the glowing effect from the top-left logo container badge, and updated the subtext label from "Control Center" to "Admin Dashboard".
    - **Premium Custom Scrollbars**: Injected global custom scrollbar rules inside `globals.css` to render thin, modern scroll tracks and teal-glowing handles on hover for all Webkit and Firefox browsers.
    - **Verified Compilation**: Completed local build checks confirming zero TypeScript compile warnings or regressions.

- **[2026-05-22] Suspended Admin Account Login Error Message:**
    - Modified backend validation service (`validateFirestoreAdmin` and `validateAdminCredentials`) in [auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to display a deactivated message when suspended admin accounts try to log in.
    - Verified the password first to maintain security and prevent username/deactivation status probing.
    - Added the custom error message: `"Your account has been deactivated. Kindly contact the administration."`
    - Verified that standard logins, invalid credential handling, and TypeScript compilation still function correctly.

- **[2026-05-22] Real-Time Admin Deactivation Alert & Forced Logout:**
    - **How the Presence System Works**:
      - **Client Heartbeat**: Standard admin clients send a recurring POST request to `/api/auth/heartbeat` every 15 seconds.
      - **Last Active Timestamp**: The backend updates the admin's `lastActiveAt` field in Firestore with the current server timestamp.
      - **Online Detection**: An admin is considered **online/active** if `Date.now() - lastActiveAt` is less than **20 seconds**. If the difference is larger (or `lastActiveAt` is missing), the admin is considered offline.
      - **Deactivation Verification**: The heartbeat response returns `isActive` to the client. If a superadmin deactivates them, the next heartbeat detects `isActive: false`, blocks the screen with a blurred full-screen modal, and starts a 2-minute forced logout countdown.
    - **Types**: Added optional `lastActiveAt?: Date` to `AdminUser` interface in [auth.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/types/auth.ts).
    - **Service & API Endpoints**:
      - Updated `listAdminUsers` mapper in `auth.service.ts` to parse `lastActiveAt` Firestore timestamp fields into JS Dates.
      - Implemented `POST /api/auth/heartbeat` API route to validate the session and update the active admin's `lastActiveAt` field in Firestore with server timestamps.
      - Modified `GET /api/auth/session` to check the database status on page reload and clear session cookies if deactivated.
    - **Real-Time Client Presence Hook & Overlay**:
      - Modified `AuthContext.tsx` to automatically send client heartbeats every 15 seconds.
      - If deactivated, instantly blocks user interactions with a full-screen blurred modal stating: *"Your account has been deactivated. Please contact the administrator to activate."* and launches a 2-minute countdown timer that automatically calls `logout` when it reaches `0:00`.
    - **Superadmin Warnings**:
      - Updated `AdminUserManagement.tsx` to warn the superadmin if they attempt to deactivate an admin currently active (heartbeat within 20 seconds) with: *"(admin name) is currently active on his account. Do you want to continue?"*.
      - Styled the confirmation button as a high-visibility red alert button reading *"Yes, Continue"*.
    - **Active Admin Deletion Block**:
      - Implemented a deletion block in `AdminUserManagement.tsx` that prevents deleting admin accounts that are active or online.
      - If the target admin is active (`isActive === true`) or online (heartbeat within 20 seconds), the delete confirmation modal is replaced with a warning state displaying: *"(admin name) is active. You cannot delete the account when he's active. Please deactivate and once logged out try deleting."*
      - Replaces confirmation inputs and delete actions with a single "OK" close button.
    - **Validation**:
      - Verified type safety across the workspace by successfully passing `npx tsc --noEmit`.

---

- **[2026-05-22] Reports Management Firestore Integration:**
    - Completed Phase 3: Reports Management integration with live Firestore data.
    - Replaced hardcoded mock data in `Reportsmanagement.tsx` with real-time Firestore subscriptions via a custom `useReports` hook.
    - Established strict type definitions mapping to the mobile app's schema in `lib/types/report.ts`.
    - Created shared UI styling constants for categories (`categories.ts`) and statuses (`statuses.ts`) mapping directly to the mobile app design system.
    - Implemented `report.service.ts` using the Firebase v12 client SDK to handle filtered snapshot listeners and status mutation logic.
    - Integrated status mutation functionality with automatic `statusHistory` timeline appending and system-generated citizen notifications within the same transaction/update flow.
    - Implemented a two-step confirmation modal for status changes to prevent accidental state mutations and explicitly inform the admin that a notification will be pushed to the citizen.
    - Refined the UI detail panel to render dynamic storage image arrays and parse timestamp formatting directly from Firestore server timestamps.

- **[2026-05-22] Reports Management UI Polish & Map Integration:**
    - Adjusted the Reports List card hierarchy to prominently display the "Type of Incident" (e.g., Road & Traffic Incident) as the main title, pushing the Incident ID to the bottom of the card information cluster.
    - Expanded the location metadata display to show the full `{Province}, {District}, {Local Government Area}` string instead of just the area, applied across both list views and the minimap overlay.
    - Created a new `MiniMap.tsx` component that dynamically loads the Google Maps API and renders an interactive map view inside the report details modal, perfectly centering on the report's coordinates using the standard native red Google map marker.
    - Upgraded the "Status Timeline & Notes" history view to dynamically pull color styles from `statusStyleMeta`, ensuring that each log entry visually reflects the severity/color of its respective status (e.g., Teal for Resolved, Orange for Reported).
    - Extracted the comprehensive user profile view from `Users.tsx` into a reusable `UserDetailsModal.tsx` component. Integrated it into the Reports view, so clicking a reporter's detail card instantly fetches their profile via a new `/api/users/[id]` GET endpoint and opens their full user statistics and history.
    - Rewrote the geographical location reverse-lookup algorithm to be more highly fault-tolerant. It now aggressively scans both the address string and the local area string to reliably deduce the Province, District, and Local Government Area, drastically reducing empty map labels. It also actively provides a UI fallback instead of silently failing when data is purely GPS coordinates.
    - Added the user's actual profile avatar image directly into the "Reporter Details" card immediately when opening the report detail modal, replacing the previous initials placeholder and giving the view a more personalized feel.

---

*Last Updated: 2026-05-22*
