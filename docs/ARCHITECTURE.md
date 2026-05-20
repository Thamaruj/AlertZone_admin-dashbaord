# Architecture — AlertZone Admin Dashboard

> This document defines the **target architecture** for the AlertZone admin dashboard. All new code must follow these patterns. Existing code that deviates should be gradually refactored to align.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 APP ROUTER                       │
│                    (File-based Routing)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                    │
│  │  Pages    │   │  Pages   │   │  Pages   │                    │
│  │  (auth)   │   │  (main)  │   │ (modals) │                    │
│  └────┬──────┘   └────┬─────┘   └────┬─────┘                    │
│       │               │              │                            │
│       ▼               ▼              ▼                            │
│  ┌──────────────────────────────────────────┐                    │
│  │         COMPONENTS (shared UI)           │                    │
│  └──────────────────┬───────────────────────┘                    │
│                     │                                             │
│  ┌──────────────────┴───────────────────────┐                    │
│  │           HOOKS (business logic)          │                    │
│  └──────────────────┬───────────────────────┘                    │
│                     │                                             │
│  ┌──────────────────┴───────────────────────┐                    │
│  │        SERVICES (Firebase SDK)            │                    │
│  └──────────────────┬───────────────────────┘                    │
│                     │                                             │
│  ┌──────────────────┴───────────────────────┐                    │
│  │           TYPES (interfaces)              │                    │
│  └──────────────────┬───────────────────────┘                    │
│                     │                                             │
│  ┌──────────────────┴───────────────────────┐                    │
│  │       CONSTANTS (app-wide values)         │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│              CONTEXT PROVIDERS (Auth, Dashboard)                  │
├──────────────────────────────────────────────────────────────────┤
│                    FIREBASE BACKEND (Shared)                      │
│           (Auth • Firestore • Storage • FCM)                      │
│                                                                   │
│        ┌────────────────────────────────────┐                     │
│        │     MOBILE APP (Expo / RN)         │                     │
│        │     (Same Firebase Project)        │                     │
│        └────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Target Directory Structure

```
alertzone-admin-dashboard/
├── app/                           # NEXT.JS APP ROUTER — Pages
│   ├── layout.tsx                 # Root layout (providers, fonts, metadata)
│   ├── page.tsx                   # Entry point (auth gate → login or dashboard)
│   ├── globals.css                # Global styles
│   ├── components/                # PAGE-LEVEL COMPONENTS (composed from shared)
│   │   ├── AdminLogin.tsx         # Login page component
│   │   ├── MainDashboard.tsx      # Main dashboard shell (sidebar + content)
│   │   ├── DashboardOverview.tsx  # Dashboard overview tab content
│   │   ├── ReportsManagement.tsx  # Reports management tab
│   │   ├── MapView.tsx            # Leaflet map tab
│   │   ├── Users.tsx              # User management tab
│   │   ├── Analytics.tsx          # Analytics tab
│   │   ├── Notifications.tsx      # Notifications tab
│   │   └── Settings.tsx           # Settings tab
│   └── assets/                    # Static assets (logos, icons)
│
├── lib/                           # SHARED LIBRARY CODE
│   ├── firebase.ts                # Firebase app initialization (Auth + Firestore + Storage)
│   │
│   ├── types/                     # TYPESCRIPT INTERFACES (shared with mobile app model)
│   │   ├── user.ts                # UserProfile, UserStatus
│   │   ├── report.ts              # Report, ReportStatus, ReportCategory, StatusHistoryEntry
│   │   ├── notification.ts        # AppNotification, NotificationType
│   │   └── index.ts               # Re-exports
│   │
│   ├── services/                  # FIREBASE SERVICE LAYER
│   │   ├── auth.service.ts        # Admin login, role check, session management
│   │   ├── report.service.ts      # Report CRUD: fetch, filter, update status, archive
│   │   ├── user.service.ts        # User management: list, suspend, activate
│   │   ├── notification.service.ts # Create notifications, fetch stats
│   │   └── analytics.service.ts   # Aggregation queries for charts/stats
│   │
│   ├── hooks/                     # CUSTOM REACT HOOKS
│   │   ├── useAuth.ts             # Auth state, admin user, login/logout
│   │   ├── useReports.ts          # Real-time reports subscription
│   │   ├── useUsers.ts            # Real-time users subscription
│   │   ├── useNotifications.ts    # Notifications management
│   │   ├── useAnalytics.ts        # Analytics data aggregation
│   │   └── useMapReports.ts       # Map-specific report data
│   │
│   ├── constants/                 # APP-WIDE CONSTANTS
│   │   ├── categories.ts          # Report categories (matching mobile app)
│   │   ├── statuses.ts            # Report statuses with colors/icons
│   │   ├── colors.ts              # Design system color tokens
│   │   └── config.ts              # App-wide configuration
│   │
│   ├── context/                   # REACT CONTEXT PROVIDERS
│   │   └── AuthContext.tsx        # Auth provider with admin role verification
│   │
│   └── utils/                     # PURE UTILITY FUNCTIONS
│       ├── formatDate.ts          # Date/time formatting helpers
│       ├── formatNumber.ts        # Number formatting (1234 → "1,234")
│       └── geo.ts                 # Geo calculations (distance, bounds)
│
├── docs/                          # PROJECT DOCUMENTATION
│   ├── MOBILE_APP_INTEGRATION_GUIDE.md
│   ├── CURRENT_STATUS.md
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PROJECT_PROGRESS.md
│   ├── FIRESTORE_DATA_MODEL.md
│   └── GUIDELINES.md
│
├── public/                        # Static public assets
├── .env.local                     # Firebase keys (NEVER commit)
├── AGENTS.md                      # Agent rules
├── next.config.ts                 # Next.js config
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind config
└── package.json                   # Dependencies
```

---

## 3. Architectural Principles

### 3.1 Components Are Presentation-Only

Page components in `app/components/` should be **presentation-focused**. They:
- Render UI with data from hooks
- Handle user interactions by calling hook methods
- Manage local UI state (modals, dropdowns, selections)

❌ **Bad — Firebase logic in component:**
```tsx
// app/components/ReportsManagement.tsx
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const [reports, setReports] = useState([]);
useEffect(() => {
  const q = query(collection(db, 'reports'));
  onSnapshot(q, snap => setReports(snap.docs.map(d => d.data())));
}, []);
```

✅ **Good — logic in hook:**
```tsx
// app/components/ReportsManagement.tsx
import { useReports } from '@/lib/hooks/useReports';
const { reports, loading, error, updateStatus, archiveReport } = useReports();
```

### 3.2 Service Layer Abstracts Firebase

Never import Firebase SDK directly in components or hooks. Always go through the service layer.

❌ **Bad:**
```tsx
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
await updateDoc(doc(db, 'reports', id), { status: 'FIXING' });
```

✅ **Good:**
```tsx
import { updateReportStatus } from '@/lib/services/report.service';
await updateReportStatus(id, 'FIXING', adminUid, 'Assigned to maintenance team');
```

### 3.3 Types Match the Mobile App

All TypeScript interfaces must match the mobile app's Firestore data model exactly. Never define inline types for Firestore documents.

```tsx
// lib/types/report.ts — must match mobile app's types
export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

export interface Report {
  id: string;
  uid: string;
  authorName: string;
  title: string;
  category: string;
  categoryId: ReportCategoryId;
  // ... (matches FIRESTORE_DATA_MODEL.md exactly)
}
```

### 3.4 Constants Are Centralized

Categories, statuses, colors, and configuration values belong in `lib/constants/` — not scattered across components.

### 3.5 Auth Is Context-Based

Admin authentication state flows through a React Context provider, not local component state.

```tsx
// Wrap app in AuthProvider
<AuthProvider>
  {user ? <MainDashboard /> : <AdminLogin />}
</AuthProvider>

// Any component can access auth
const { user, profile, isAdmin, logout } = useAuth();
```

---

## 4. Data Flow

```
┌───────────┐      ┌───────────┐      ┌────────────┐      ┌──────────────┐
│ Component  │ ──►  │   Hook    │ ──►  │  Service   │ ──►  │  Firestore   │
│ (render)   │ ◄──  │  (logic)  │ ◄──  │  (CRUD)    │ ◄──  │  (database)  │
└───────────┘      └───────────┘      └────────────┘      └──────────────┘
```

### Example: Updating Report Status

1. **Component** — Admin clicks "Mark as Fixing" button
2. **Hook** (`useReports`) — calls `handleStatusUpdate(reportId, 'FIXING')`
3. **Service** (`report.service.ts`) — performs batch operation:
   a. Updates report `status`, `updatedAt`, appends to `statusHistory`
   b. Creates notification in `notifications` collection for citizen
   c. (If resolving) Increments citizen's `reportsValidated` and `contributionPoints`
4. **Firestore** — data updates
5. **Mobile app** — citizen sees status change in real-time + receives push notification

---

## 5. State Management Strategy

| State Type | Solution | Example |
|---|---|---|
| **Auth state** | React Context (`AuthContext`) | Admin user, profile, role, logout |
| **Server data** | Custom hooks with `onSnapshot` | Reports, users, notifications |
| **UI state** | Component-local `useState` | Modal visibility, active tab, search query |
| **Dashboard state** | URL params or `useState` | Active nav, filters, date range |

> **No Redux, Zustand, or other state libraries** needed. Context + hooks is sufficient for this scale.

---

## 6. Firebase Architecture

### 6.1 Initialization

Firebase is initialized once in `lib/firebase.ts` and exports `app`, `auth`, `db`, and `storage`. All service files import from here.

### 6.2 Real-time Subscriptions

Use `onSnapshot` for data that needs real-time updates (reports list, dashboard stats). Use `getDocs` for one-time reads (analytics aggregation).

### 6.3 Admin Auth Flow

```
Login Form
    │
    ▼
Firebase Auth (signInWithEmailAndPassword)
    │
    ▼
Fetch user doc from Firestore (users/{uid})
    │
    ▼
Check: role === 'admin' && status === 'active'
    │
    ├── ✅ Allow access → load dashboard
    │
    └── ❌ Deny → signOut + show error
```

### 6.4 Shared Data Responsibility

| Data | Written By | Read By |
|---|---|---|
| `users` docs | Mobile App (signup) | Both (dashboard reads for user management) |
| `reports` docs | Mobile App (submit) | Both (dashboard reads + updates status) |
| `reports.status` | Admin Dashboard | Mobile App (real-time tracking) |
| `reports.statusHistory` | Admin Dashboard | Mobile App (status timeline) |
| `reports.assignedTo` | Admin Dashboard | Both |
| `notifications` | Admin Dashboard / Cloud Functions | Mobile App |
| `upvotes` subcollection | Mobile App | Dashboard (read-only, use `upvoteCount`) |

---

## 7. Current vs. Target Architecture Gap

| Area | Current State | Target State |
|---|---|---|
| **Auth** | Fake `setTimeout` simulation | Firebase Auth + Firestore role check |
| **Data** | Hardcoded mock data + empty arrays | Real-time Firestore subscriptions |
| **Types** | Wrong types in `mockData.ts` | Correct types matching mobile app |
| **Services** | None | `lib/services/` with CRUD operations |
| **Hooks** | None | `lib/hooks/` with business logic |
| **Constants** | Hardcoded in components | `lib/constants/` centralized |
| **Auth Context** | `useState` in `page.tsx` | `AuthContext` with role verification |
| **Notifications** | Static mock list | Create real Firestore notifications on status change |
| **Map** | Empty Leaflet map | Pins from Firestore with filters |

---

## 8. Error Handling Strategy

```tsx
// lib/services/report.service.ts
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminUid: string,
  note?: string
): Promise<void> {
  try {
    // ... batch write logic
  } catch (error) {
    console.error('❌ updateReportStatus failed:', error);
    throw new Error('Could not update report status. Please try again.');
  }
}

// lib/hooks/useReports.ts
// The hook catches errors and exposes them for UI components to display
const { reports, loading, error, updateStatus } = useReports();
```

Components should display errors using toast notifications or inline error messages — never let errors silently fail.

---

## 9. Notification Architecture

When an admin changes a report status, the dashboard must create a notification for the citizen:

```
Admin Action → report.service.ts → Batch Write:
  1. Update report document
  2. Append to statusHistory
  3. Create notification document in notifications/ collection
                                        │
                                        ▼
                            Mobile App reads notifications/
                            via onSnapshot → shows in-app
                                        │
                                        ▼
                            (Future) Cloud Function listens
                            to notifications/ → sends FCM push
```

This ensures citizens are notified even without FCM push notifications — the in-app notification center will pick up new entries via real-time subscription.
