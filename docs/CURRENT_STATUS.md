# Current Status — AlertZone Admin Dashboard

> **Last Updated:** 2026-05-20
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
| Phase 7: Map View (Live) | 🔴 Not Started | Leaflet map renders but no real data |
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
- [x] Map view — Leaflet integration with dynamic import (SSR-safe)
- [x] Users management page — user list with search and filters
- [x] Analytics page — multiple chart types and data visualizations
- [x] Notifications page — notification list with read/unread status
- [x] Mobile responsive sidebar (hamburger menu)

---

## What Uses MOCK DATA (UI exists, not wired to Firebase) 🟡

### Dashboard Overview (`Maindashboard.tsx`)
- [ ] Stat cards — all values hardcoded (`1,284`, `432`, `215`, `537`, `100`)
- [ ] Donut chart — hardcoded values
- [ ] Bar chart — reads from `BAR_DATA` (empty array in mockData.ts)
- [ ] Line chart — reads from `MONTHLY_DATA` (empty array in mockData.ts)
- [ ] Recent reports table — reads from `MOCK_REPORTS` (empty array)
- [ ] User profile in topbar — hardcoded "Alex Morgan / Super Admin"

### Admin Login (`Adminlogin.tsx`)
- [ ] Login form — simulates auth with `setTimeout(1500ms)`, no real Firebase Auth
- [ ] No role verification (`role === 'admin'` check missing)
- [ ] No session persistence
- [ ] Username field exists but Firebase Auth uses email/password only
- [ ] "Forgot password" button is a no-op

### Reports Management (`Reportsmanagement.tsx`)
- [ ] Reports table — uses mock data types that **don't match** the mobile app's Firestore schema
- [ ] Status values are wrong: `"Reported" | "In Progress" | "Solved" | "Closed"` instead of `"PENDING" | "ASSIGNED" | "FIXING" | "RESOLVED" | "REJECTED"`
- [ ] Category values are wrong: `"Hazard" | "Lighting" | "Waste" | "Roads" | "Water" | "Safety"` instead of mobile app categories
- [ ] No Firebase queries
- [ ] No status update functionality
- [ ] No notification creation on status change

### Map View (`Mapview.tsx`)
- [ ] Leaflet map renders but with no real report pins
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
- [ ] Admin authentication with role verification
- [ ] Auth state persistence (session management)
- [ ] Auth context/provider for the dashboard
- [ ] Service layer (`lib/services/`) for Firebase operations
- [ ] TypeScript types matching the mobile app's Firestore schema

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
- [ ] Real report pins from Firestore
- [ ] Color-coded pins by status/category
- [ ] Pin click → report detail popup
- [ ] Marker clustering for dense areas
- [ ] Real-time updates on map

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
| Login is fake (setTimeout simulation) | 🔴 Critical | `Adminlogin.tsx` | Must wire to Firebase Auth + admin role check |
| Mock data types don't match Firestore schema | 🔴 Critical | `app/data/mockData.ts` | Categories, statuses, and types are all wrong |
| Test credentials hardcoded in test page | 🟡 Medium | `test-connection/page.tsx` | Password exposed in source code |
| No auth state persistence | 🔴 Critical | `app/page.tsx` | Uses local `useState` — reloading loses session |
| User profile hardcoded in topbar | 🟡 Medium | `Maindashboard.tsx:569-570` | Should read from auth context |
| console.log in firebase.ts | 🟢 Low | `lib/firebase.ts:20` | Remove before production |
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
| `leaflet` | ✅ | ✅ | Map renders (no real data) |
| `react-leaflet` | ✅ | ✅ | — |
| `tailwindcss` v4 | ✅ | ✅ | Styling works |
| Chart library | ❌ | — | Using custom SVG charts currently |
| `firebase-admin` | ❌ | — | May be needed for Cloud Functions |
