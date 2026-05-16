# AlertZone — Mobile App Integration Guide for Admin Dashboard

> **Purpose**: This file provides the admin dashboard development team with everything they need to understand how the mobile app works, what data it writes to Firestore, and how the admin dashboard should interact with it.
>
> **⚠️ MANDATORY**: Read this entire document before writing any admin dashboard code that touches Firebase.

---

## 1. System Overview

AlertZone is a **citizen-driven safety and infrastructure reporting platform** for Sri Lanka. The system has two client applications:

```
┌──────────────────────┐          ┌──────────────────────────┐
│   MOBILE APP         │          │   ADMIN DASHBOARD        │
│   (React Native/Expo)│          │   (Next.js 16)           │
│                      │          │                          │
│   Citizens use this  │          │   Local authority admins │
│   to submit reports, │          │   use this to manage     │
│   track progress,    │◄────────►│   reports, assign teams, │
│   upvote, earn badges│  SHARED  │   view analytics, and    │
│                      │ FIREBASE │   manage users.          │
└──────────────────────┘          └──────────────────────────┘
                    │                        │
                    ▼                        ▼
           ┌──────────────────────────────────────┐
           │         FIREBASE (Shared Backend)      │
           │                                        │
           │   Auth  •  Firestore  •  Storage  •  FCM │
           │                                        │
           │   Project ID: alertzone-3d2a3          │
           └──────────────────────────────────────────┘
```

**Both apps share the SAME Firebase project.** Any change you make to Firestore data or security rules affects the mobile app too.

---

## 2. What the Mobile App Does (Feature Summary)

| Feature | Mobile App Action | Firestore Effect |
|---|---|---|
| **User Registration** | Citizen signs up with email/password | Creates doc in `users/{uid}` with role `"citizen"` |
| **Login** | Email/password (Google planned) | Reads `users/{uid}` for profile |
| **Submit Report** | Fills form: category, description, location, photos | Creates doc in `reports/{reportId}` with status `"PENDING"` |
| **View Reports** | Lists own reports with status filters | Reads `reports` where `uid == currentUser.uid` |
| **Map View** | Shows nearby reports on Google Maps | Reads `reports` filtered by location area |
| **Upvote** | Citizens upvote reports from same area | Creates doc in `reports/{reportId}/upvotes/{userId}`, increments `upvoteCount` |
| **Track Status** | Views status timeline on report detail | Reads `reports/{reportId}.statusHistory` |
| **Profile** | Views/edits personal info, sees badges/stats | Reads/writes `users/{uid}` |
| **Notifications** | Receives push on status changes | Reads `notifications` where `recipientUid == currentUser.uid` |

---

## 3. Firestore Data Model (What You Need to Know)

### 3.1 `users` Collection

**Path**: `users/{userId}` — userId = Firebase Auth UID

```typescript
interface UserProfile {
  uid: string;              // Firebase Auth UID
  fullName: string;         // Display name
  email: string;            // Email
  phoneNumber: string;      // Phone
  address?: string;         // Home address
  area?: string;            // Registered district/area
  role: 'citizen' | 'admin'; // 🔑 KEY FIELD: Admin dashboard users should have 'admin'
  status: 'active' | 'suspended'; // Admins can suspend users
  isVerified: boolean;      // Email verification status
  avatarUrl?: string;       // Profile pic (Firebase Storage URL)
  contributionPoints: number; // Gamification points
  reportsValidated: number; // Count of resolved reports
  level: number;            // User level (1-5)
  badges: string[];         // Earned badge IDs
  notificationSound: boolean;
  alertRadius: string;
  fcmToken?: string;        // For push notifications
  createdAt: string;        // ISO timestamp
  updatedAt?: Timestamp;
}
```

**Admin Dashboard Actions on `users`:**
- ✅ Read all user profiles (for user management page)
- ✅ Update `status` field (suspend/activate users)
- ✅ View user statistics and activity
- ❌ Do NOT modify `role` unless creating admin accounts
- ❌ Do NOT delete user documents (use `status: 'suspended'`)

### 3.2 `reports` Collection

**Path**: `reports/{reportId}`

```typescript
type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

interface Report {
  // Identity
  id: string;               // Firestore doc ID
  uid: string;              // Author's user UID
  authorName: string;       // Denormalized author name

  // Content
  title: string;            // Report title
  category: string;         // "Road & Traffic", "Water & Drainage", etc.
  categoryId: string;       // "road_traffic", "water_drainage", etc.
  categoryIcon: string;     // Ionicons name
  categoryColor: string;    // Hex color
  description: string;      // Detailed description

  // Location
  location: {
    address: string;        // Human-readable
    latitude: number;       // GPS lat
    longitude: number;      // GPS lng
    area: string;           // District name (for filtering)
  };

  // Media
  imageUrls: string[];      // Firebase Storage URLs (up to 3)
  videoUrl?: string;

  // Status
  status: ReportStatus;     // 🔑 Admin changes this
  assignedTo?: string;      // Admin/team UID
  resolutionNote?: string;  // Note when resolved/rejected
  upvoteCount: number;      // Community upvotes
  isArchived: boolean;      // 🔑 Soft-delete by admin

  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  // History
  statusHistory: Array<{
    status: ReportStatus;
    changedAt: Timestamp;
    changedBy: string;      // Admin UID or "system"
    note?: string;
  }>;
}
```

**Admin Dashboard Actions on `reports`:**
- ✅ Read all reports (for reports management page)
- ✅ Filter by status, category, area, date range
- ✅ Update `status` (PENDING → ASSIGNED → FIXING → RESOLVED / REJECTED)
- ✅ Set `assignedTo` (assign to a team/member)
- ✅ Set `resolutionNote` (when resolving or rejecting)
- ✅ Set `isArchived = true` (soft-delete / archive irrelevant reports)
- ✅ Append to `statusHistory` on every status change
- ✅ Update `updatedAt` timestamp on every change
- ❌ Do NOT modify `uid`, `authorName`, `description`, `location` (citizen data)
- ❌ Do NOT hard-delete reports (use `isArchived`)

### 3.3 `reports/{reportId}/upvotes` Subcollection

**Path**: `reports/{reportId}/upvotes/{userId}`

```typescript
interface Upvote {
  uid: string;          // User who upvoted
  createdAt: Timestamp;
}
```

**Admin Dashboard**: Read-only. Use `upvoteCount` on the parent report document for display.

### 3.4 `notifications` Collection

**Path**: `notifications/{notificationId}`

```typescript
type NotificationType = 'status_change' | 'upvote' | 'badge_earned' | 'system';

interface AppNotification {
  recipientUid: string;    // User to notify
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;       // For navigation deeplink
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Timestamp;
}
```

**Admin Dashboard Actions on `notifications`:**
- ✅ Create notifications (e.g., when changing report status)
- ✅ Create system-wide notifications
- ✅ Read notification statistics

**Important**: When the admin changes a report status, the dashboard should create a notification for the report author:
```typescript
await addDoc(collection(db, 'notifications'), {
  recipientUid: report.uid,
  type: 'status_change',
  title: 'Report Status Updated',
  body: `Your report "${report.title}" is now ${newStatus}.`,
  reportId: reportId,
  data: { previousStatus, newStatus },
  isRead: false,
  createdAt: serverTimestamp(),
});
```

---

## 4. Report Lifecycle (Admin's Perspective)

```
 CITIZEN submits          ADMIN reviews           ADMIN assigns          FIELD TEAM works
┌───────────┐          ┌───────────┐          ┌───────────┐          ┌───────────┐
│  PENDING  │ ────────►│  Review   │ ────────►│ ASSIGNED  │ ────────►│  FIXING   │
└───────────┘          └─────┬─────┘          └───────────┘          └─────┬─────┘
                             │                                              │
                             │ Invalid                                      │ Fixed
                             ▼                                              ▼
                       ┌───────────┐                                  ┌───────────┐
                       │ REJECTED  │                                  │ RESOLVED  │
                       └───────────┘                                  └───────────┘
```

### Admin Actions at Each Stage:

1. **PENDING → ASSIGNED**:
   - Review the report (description, photos, location)
   - Set `assignedTo` to a team member
   - Append status history entry
   - Create notification for citizen

2. **ASSIGNED → FIXING**:
   - Field team confirms they're working on it
   - Append status history entry
   - Create notification for citizen

3. **FIXING → RESOLVED**:
   - Issue is fixed
   - Set `resolutionNote` with details
   - Increment citizen's `reportsValidated` count
   - Add contribution points to citizen
   - Append status history entry
   - Create notification for citizen

4. **PENDING → REJECTED**:
   - Report is invalid or irrelevant
   - Set `resolutionNote` with rejection reason
   - Append status history entry
   - Create notification for citizen

5. **Any → ARCHIVED**:
   - Set `isArchived = true`
   - Report won't appear in citizen's active feed

### Status Change Code Template:
```typescript
import { doc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminUid: string,
  note?: string
) {
  const reportRef = doc(db, 'reports', reportId);

  // 1. Update report
  await updateDoc(reportRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(note && { resolutionNote: note }),
    statusHistory: arrayUnion({
      status: newStatus,
      changedAt: new Date(), // Note: arrayUnion doesn't support serverTimestamp()
      changedBy: adminUid,
      ...(note && { note }),
    }),
  });

  // 2. Get report data for notification
  const reportSnap = await getDoc(reportRef);
  const report = reportSnap.data();

  // 3. Create notification for citizen
  await addDoc(collection(db, 'notifications'), {
    recipientUid: report.uid,
    type: 'status_change',
    title: 'Report Status Updated',
    body: `Your report "${report.title}" status changed to ${newStatus}.`,
    reportId: reportId,
    data: { newStatus },
    isRead: false,
    createdAt: serverTimestamp(),
  });
}
```

---

## 5. Admin Dashboard Required Features

Based on the mobile app's data model, the admin dashboard should implement:

### 5.1 Dashboard Overview
- Total reports count (by status)
- Reports submitted today/this week/this month
- Area-wise distribution chart
- Category-wise distribution chart
- Recent reports list

### 5.2 Reports Management
- Table/list of all reports with columns: Title, Category, Area, Status, Date, Upvotes
- Filter by: Status, Category, Area, Date Range
- Search by: Title, Reference ID, Author name
- Sort by: Date, Upvotes, Status
- Bulk actions: Assign, Archive
- Detail view: Full report with images, map pin, status timeline
- Actions: Change status, Assign, Add note, Archive

### 5.3 Analytics & Trends
- Line chart: Reports over time (daily/weekly/monthly)
- Bar chart: Reports by category
- Pie chart: Reports by status
- Heatmap: Reports by area (on Leaflet map)
- Resolution rate: % of reports resolved vs. total
- Average resolution time
- Filter all charts by date range, category, area

### 5.4 Map View
- Interactive Leaflet map showing all report locations
- Color-coded pins by status
- Cluster markers for dense areas
- Click pin → report detail popup

### 5.5 User Management
- List of all registered users
- Columns: Name, Email, Area, Reports Count, Points, Level, Status
- Actions: View profile, Suspend/Activate
- Filter by: Role, Status, Area

### 5.6 Notifications
- Send system-wide announcements
- View notification delivery stats

---

## 6. Report Categories (Shared Reference)

The mobile app uses these categories. The admin dashboard should display the same labels and colors:

| ID | Label | Icon | Color | BG Color |
|---|---|---|---|---|
| `road_traffic` | Road & Traffic | `car-outline` | `#4CC2D1` | `#0D2A35` |
| `water_drainage` | Water & Drainage | `water-outline` | `#60A5FA` | `#0D1A3D` |
| `waste_environment` | Waste & Env. | `trash-outline` | `#34D399` | `#0D3D25` |
| `social_safety` | Social Safety | `shield-outline` | `#A78BFA` | `#2D1F4A` |
| `bridge_structural` | Bridge & Structural | `git-network-outline` | `#F59E0B` | `#3D2E0A` |

---

## 7. Status Display (Shared Reference)

| Status | Label | Color | BG Color | Icon |
|---|---|---|---|---|
| `PENDING` | Pending | `#F59E0B` | `#3D2E0A` | `time-outline` |
| `ASSIGNED` | Assigned | `#60A5FA` | `#0D1A3D` | `person-add-outline` |
| `FIXING` | Fixing | `#4CC2D1` | `#0D2A35` | `construct-outline` |
| `RESOLVED` | Resolved | `#30A89C` | `#0D3D35` | `checkmark-circle-outline` |
| `REJECTED` | Rejected | `#E05C5C` | `#3D1515` | `close-circle-outline` |

---

## 8. Firebase Configuration

Both apps use the same Firebase project. The admin dashboard `.env.local` should have:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<same as mobile>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alertzone-3da3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alertzone-3d2a3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alertzone-3d2a3.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<same as mobile>
NEXT_PUBLIC_FIREBASE_APP_ID=<web app ID from Firebase Console>
```

> **Note**: The admin dashboard should use a **separate Firebase web app** registration (different `appId`) but the same project. Create a new web app in Firebase Console if not already done.

---

## 9. Admin Authentication

- Admin users have `role: 'admin'` in their `users` Firestore document.
- The admin dashboard login should verify:
  1. Firebase Auth login succeeds
  2. The user's Firestore document has `role === 'admin'`
  3. The user's `status === 'active'`
- If any check fails, deny access.

```typescript
// Example admin auth check
const userDoc = await getDoc(doc(db, 'users', uid));
const userData = userDoc.data();
if (userData?.role !== 'admin' || userData?.status !== 'active') {
  // Deny access — not an admin or suspended
  await signOut(auth);
  throw new Error('Unauthorized');
}
```

### Creating Admin Accounts
Admin accounts are created manually:
1. Register a regular account via the mobile app (or Firebase Console)
2. In Firebase Console → Firestore → `users/{uid}`, change `role` from `"citizen"` to `"admin"`

---

## 10. Design System (Shared Theme)

The mobile app uses a dark theme. The admin dashboard should use a complementary dark theme:

| Token | Mobile App | Suggested for Admin |
|---|---|---|
| Background | `#0D1F2D` → `#071318` | `#0D1F2D` (or similar dark) |
| Primary | `#4CC2D1` | `#4CC2D1` (keep consistent) |
| Secondary | `#30A89C` | `#30A89C` |
| Surface | `#111E27` | `#111E27` |
| Border | `#1E3347` | `#1E3347` |
| Text Primary | `#FFFFFF` | `#FFFFFF` |
| Text Secondary | `#5A7D8A` | `#5A7D8A` |
| Danger | `#E05C5C` | `#E05C5C` |
| Warning | `#F59E0B` | `#F59E0B` |
| Success | `#30A89C` | `#30A89C` |

---

## 11. Current Mobile App Status (What the Admin Should Expect)

| Data | Current State | Expected After Mobile Phase 1 |
|---|---|---|
| `users` collection | ✅ Real data from registrations | Same + more fields |
| `reports` collection | 🔴 Empty (mock data in app) | ✅ Real reports from citizens |
| `notifications` collection | 🔴 Does not exist | Created by admin actions + Cloud Functions |
| Firebase Storage | 🔴 No files | Report images + avatars |
| FCM | 🔴 Not set up | Tokens stored in user docs |

> The admin dashboard can be developed in parallel using test data written directly to Firestore. Once the mobile app starts creating real reports, the admin will see them automatically.

---

## 12. Firestore Queries the Admin Will Need

```typescript
// All reports, newest first
query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50))

// Reports by status
query(collection(db, 'reports'), where('status', '==', 'PENDING'), orderBy('createdAt', 'desc'))

// Reports by category
query(collection(db, 'reports'), where('categoryId', '==', 'road_traffic'), orderBy('createdAt', 'desc'))

// Reports by area
query(collection(db, 'reports'), where('location.area', '==', 'Rajagiriya'), orderBy('createdAt', 'desc'))

// Non-archived reports
query(collection(db, 'reports'), where('isArchived', '==', false), orderBy('createdAt', 'desc'))

// Reports in date range
query(collection(db, 'reports'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate))

// All users
query(collection(db, 'users'), orderBy('createdAt', 'desc'))

// Admin users only
query(collection(db, 'users'), where('role', '==', 'admin'))

// User count by area (for analytics — read all and aggregate client-side, or use Cloud Functions)
```

---

## 13. Agent Instructions (For Admin Dashboard Development)

1. **Read this file** before starting any Firebase-related work.
2. **Do NOT modify** the data model without coordinating with the mobile app team.
3. **Use the same Firestore field names** as documented here — the mobile app depends on them.
4. **Always create notifications** when changing report status — citizens expect to be notified.
5. **Never hard-delete** reports or users — always use soft-delete (`isArchived`, `status: 'suspended'`).
6. **Append to `statusHistory`** on every status change — this powers the citizen's status timeline.
7. **Test with real Firebase** — use the same project ID. Create test data if the mobile app hasn't populated real data yet.
