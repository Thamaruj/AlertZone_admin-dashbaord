# Firestore Data Model — AlertZone Admin Dashboard

> **Shared Database**: Both the mobile app and admin dashboard read/write to the **same Firestore instance**.
>
> **Project ID**: `alertzone-3d2a3`
>
> **⚠️ CRITICAL**: This data model is shared with the mobile app. Any changes here must be coordinated with `../alertzone-mobile-app/docs/FIRESTORE_DATA_MODEL.md`. Never modify field names or types unilaterally.

---

## Collections Overview

```
firestore/
├── users/                    # Citizen & admin profiles
│   └── {userId}/
│       └── (document fields)
├── reports/                  # Infrastructure issue reports
│   └── {reportId}/
│       ├── (document fields)
│       └── upvotes/          # Subcollection: who upvoted
│           └── {userId}/
├── notifications/            # Push notification log
│   └── {notificationId}/
│       └── (document fields)
└── app_config/               # System-level config (categories, badge defs)
    └── {configId}/
```

---

## 1. `users` Collection

**Path**: `users/{userId}` — userId matches Firebase Auth UID.

| Field | Type | Required | Default | Description | Admin Can Modify |
|---|---|---|---|---|---|
| `uid` | `string` | ✅ | — | Firebase Auth UID (matches document ID) | ❌ |
| `fullName` | `string` | ✅ | — | User's display name | ❌ |
| `email` | `string` | ✅ | — | Email address | ❌ |
| `phoneNumber` | `string` | ✅ | — | Phone number | ❌ |
| `address` | `string` | ❌ | `""` | User's address | ❌ |
| `area` | `string` | ❌ | `""` | Registered area/district | ❌ |
| `role` | `string` | ✅ | `"citizen"` | `"citizen"` or `"admin"` | ✅ (carefully) |
| `status` | `string` | ✅ | `"active"` | `"active"` or `"suspended"` | ✅ |
| `isVerified` | `boolean` | ✅ | `false` | Email verification status | ❌ |
| `avatarUrl` | `string` | ❌ | `null` | Profile picture URL | ❌ |
| `contributionPoints` | `number` | ❌ | `0` | Accumulated contribution score | ✅ (increment on resolve) |
| `reportsValidated` | `number` | ❌ | `0` | Count of resolved reports | ✅ (increment on resolve) |
| `level` | `number` | ❌ | `1` | User level (calculated from points) | ✅ (auto-calculate) |
| `badges` | `string[]` | ❌ | `[]` | Earned badge IDs | ❌ |
| `notificationSound` | `boolean` | ❌ | `true` | Notification sound preference | ❌ |
| `alertRadius` | `string` | ❌ | `"10 Km"` | Alert radius preference | ❌ |
| `fcmToken` | `string` | ❌ | `null` | FCM device token (for push notifications) | ❌ |
| `createdAt` | `string` (ISO) | ✅ | — | Account creation timestamp | ❌ |
| `updatedAt` | `timestamp` | ❌ | — | Last profile update | ❌ |

### Admin Dashboard Actions on `users`:
- ✅ **Read** all user profiles (user management page)
- ✅ **Update** `status` field (suspend/activate users)
- ✅ **Increment** `contributionPoints` and `reportsValidated` when resolving reports
- ❌ **Never** modify `uid`, `fullName`, `email`, `phoneNumber` (citizen data)
- ❌ **Never** delete user documents (use `status: 'suspended'`)
- ❌ **Never** change `role` unless explicitly creating admin accounts

---

## 2. `reports` Collection

**Path**: `reports/{reportId}`

| Field | Type | Required | Default | Description | Admin Can Modify |
|---|---|---|---|---|---|
| `uid` | `string` | ✅ | — | Report author's user UID | ❌ |
| `authorName` | `string` | ✅ | — | Author's display name (denormalized) | ❌ |
| `title` | `string` | ✅ | — | Short title | ❌ |
| `category` | `string` | ✅ | — | Category label (e.g., `"Road & Traffic"`) | ❌ |
| `categoryId` | `string` | ✅ | — | Category ID (e.g., `"road_traffic"`) | ❌ |
| `categoryIcon` | `string` | ✅ | — | Ionicons icon name | ❌ |
| `categoryColor` | `string` | ✅ | — | Hex color for category | ❌ |
| `description` | `string` | ✅ | — | Detailed description (max 500 chars) | ❌ |
| `location` | `object` | ✅ | — | See Location sub-object below | ❌ |
| `imageUrls` | `string[]` | ❌ | `[]` | Firebase Storage URLs for evidence photos | ❌ |
| `videoUrl` | `string` | ❌ | `null` | Firebase Storage URL for evidence video | ❌ |
| `status` | `string` | ✅ | `"PENDING"` | Report status (see below) | ✅ |
| `assignedTo` | `string` | ❌ | `null` | Admin/team member assigned | ✅ |
| `resolutionNote` | `string` | ❌ | `null` | Note when resolved or rejected | ✅ |
| `upvoteCount` | `number` | ✅ | `0` | Total upvotes (denormalized) | ❌ |
| `isArchived` | `boolean` | ❌ | `false` | Soft-delete flag | ✅ |
| `createdAt` | `timestamp` | ✅ | — | Report submission time | ❌ |
| `updatedAt` | `timestamp` | ❌ | — | Last status update time | ✅ (auto) |
| `statusHistory` | `array` | ❌ | `[]` | Array of status change events | ✅ (append only) |

### Report Status Values

```typescript
type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';
```

### Location Sub-Object

```typescript
location: {
  address: string;         // Human-readable address
  latitude: number;        // GPS latitude
  longitude: number;       // GPS longitude
  area: string;            // District/area name (for filtering)
}
```

### Status History Entry

```typescript
statusHistory: [
  {
    status: "PENDING",
    changedAt: Timestamp,
    changedBy: "system"       // or admin UID
  },
  {
    status: "ASSIGNED",
    changedAt: Timestamp,
    changedBy: "admin_uid_123",
    note: "Assigned to Western Province maintenance team"
  }
]
```

### Admin Dashboard Actions on `reports`:
- ✅ **Read** all reports (reports management, map, analytics)
- ✅ **Update** `status` (with corresponding `statusHistory` append)
- ✅ **Set** `assignedTo` (assign to a team)
- ✅ **Set** `resolutionNote` (when resolving or rejecting)
- ✅ **Set** `isArchived = true` (soft-delete)
- ✅ **Update** `updatedAt` timestamp on every change
- ❌ **Never** modify `uid`, `authorName`, `description`, `location`, `imageUrls` (citizen data)
- ❌ **Never** hard-delete reports

---

## 3. `reports/{reportId}/upvotes` Subcollection

**Path**: `reports/{reportId}/upvotes/{userId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `uid` | `string` | ✅ | User who upvoted |
| `createdAt` | `timestamp` | ✅ | When the upvote was cast |

### Admin Dashboard: **Read-only**. Use `upvoteCount` on the parent report document for display.

---

## 4. `notifications` Collection

**Path**: `notifications/{notificationId}`

| Field | Type | Required | Description | Admin Can Modify |
|---|---|---|---|---|
| `recipientUid` | `string` | ✅ | User who receives the notification | Set on creation |
| `type` | `string` | ✅ | `"status_change"`, `"upvote"`, `"badge_earned"`, `"system"` | Set on creation |
| `title` | `string` | ✅ | Notification title | Set on creation |
| `body` | `string` | ✅ | Notification body text | Set on creation |
| `reportId` | `string` | ❌ | Associated report ID (for mobile deep-link) | Set on creation |
| `data` | `map` | ❌ | Extra payload (status, badge ID, etc.) | Set on creation |
| `isRead` | `boolean` | ✅ | Whether user has read it | ❌ (citizen toggles) |
| `createdAt` | `timestamp` | ✅ | When notification was created | Set on creation |

### Critical: Creating Notifications on Status Change

When the admin changes a report's status, the dashboard **MUST** create a notification:

```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

await addDoc(collection(db, 'notifications'), {
  recipientUid: report.uid,          // Citizen who submitted the report
  type: 'status_change',
  title: 'Report Status Updated',
  body: `Your report "${report.title}" is now ${newStatus}.`,
  reportId: reportId,
  data: {
    previousStatus: currentStatus,
    newStatus: newStatus,
  },
  isRead: false,
  createdAt: serverTimestamp(),
});
```

The mobile app listens to `notifications` where `recipientUid == currentUser.uid` via `onSnapshot`, so the citizen will see the notification in real-time.

---

## 5. `app_config` Collection (Optional)

**Path**: `app_config/{configId}`

Stores system-level configuration that can be changed without app updates.

### `app_config/categories`
```json
{
  "categories": [
    {
      "id": "road_traffic",
      "label": "Road & Traffic",
      "icon": "car-outline",
      "color": "#4CC2D1",
      "bgColor": "#0D2A35",
      "examples": "Potholes, signals, noise"
    }
  ]
}
```

### `app_config/badges`
```json
{
  "badges": [
    {
      "id": "first_responder",
      "label": "First Responder",
      "icon": "shield",
      "color": "#4CC2D1",
      "criteria": "Submit your first report",
      "pointsAwarded": 50
    }
  ]
}
```

### `app_config/levels`
```json
{
  "levels": [
    { "level": 1, "minPoints": 0, "title": "Newcomer" },
    { "level": 2, "minPoints": 100, "title": "Contributor" },
    { "level": 3, "minPoints": 300, "title": "Active Reporter" },
    { "level": 4, "minPoints": 600, "title": "Community Leader" },
    { "level": 5, "minPoints": 1000, "title": "Safety Champion" }
  ]
}
```

---

## 6. TypeScript Interfaces (for Admin Dashboard)

These should live in `lib/types/`:

```typescript
// lib/types/user.ts
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  area?: string;
  role: 'citizen' | 'admin';
  status: 'active' | 'suspended';
  isVerified: boolean;
  avatarUrl?: string;
  contributionPoints: number;
  reportsValidated: number;
  level: number;
  badges: string[];
  notificationSound: boolean;
  alertRadius: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt?: any; // Firestore Timestamp
}

// lib/types/report.ts
export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

export type ReportCategoryId =
  | 'road_traffic'
  | 'water_drainage'
  | 'waste_environment'
  | 'social_safety'
  | 'bridge_structural'
  | 'other';

export interface ReportLocation {
  address: string;
  latitude: number;
  longitude: number;
  area: string;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  changedAt: any; // Firestore Timestamp
  changedBy: string; // Admin UID or "system"
  note?: string;
}

export interface Report {
  id: string; // Firestore document ID
  uid: string;
  authorName: string;
  title: string;
  category: string;
  categoryId: ReportCategoryId;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  location: ReportLocation;
  imageUrls: string[];
  videoUrl?: string;
  status: ReportStatus;
  assignedTo?: string;
  resolutionNote?: string;
  upvoteCount: number;
  isArchived: boolean;
  createdAt: any;
  updatedAt?: any;
  statusHistory: StatusHistoryEntry[];
}

// lib/types/notification.ts
export type NotificationType = 'status_change' | 'upvote' | 'badge_earned' | 'system';

export interface AppNotification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: any;
}
```

---

## 7. Indexes Required

Firestore composite indexes needed for admin dashboard queries:

| Collection | Fields | Query Purpose |
|---|---|---|
| `reports` | `isArchived` ASC, `createdAt` DESC | Default: non-archived, newest first |
| `reports` | `status` ASC, `createdAt` DESC | Filter by status |
| `reports` | `categoryId` ASC, `createdAt` DESC | Filter by category |
| `reports` | `location.area` ASC, `createdAt` DESC | Filter by area |
| `reports` | `isArchived` ASC, `status` ASC, `createdAt` DESC | Combined filters |
| `notifications` | `recipientUid` ASC, `createdAt` DESC | User's notifications |
| `notifications` | `recipientUid` ASC, `isRead` ASC, `createdAt` DESC | Unread notifications |
| `users` | `role` ASC, `createdAt` DESC | Filter users by role |
| `users` | `status` ASC, `createdAt` DESC | Filter users by status |
| `upvotes` (Collection Group) | `uid` ASC | Fetch user's upvoted reports |

---

## 8. Security Rules (Admin Permissions)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Check if current user is an admin
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── Users ──
    match /users/{userId} {
      // Citizens read their own; admins read all
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId;
      // Citizens can update own (except role, status); admins can update all
      allow update: if request.auth != null && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status']))
        || isAdmin()
      );
    }

    // ── Reports ──
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'PENDING';
      // Only admins can update reports (status, assignment, archive)
      allow update: if isAdmin();

      // ── Upvotes subcollection ──
      match /upvotes/{upvoteUserId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.auth.uid == upvoteUserId;
        allow delete: if request.auth != null && request.auth.uid == upvoteUserId;
      }

      // ── Comments subcollection ──
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
        allow update: if request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvoteCount']);
        allow delete: if isAdmin();
      }
    }

    // ── Upvotes collectionGroup ──
    match /{path=**}/upvotes/{upvoteUserId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == upvoteUserId;
      allow delete: if request.auth != null && request.auth.uid == upvoteUserId;
    }

    // ── Notifications ──
    match /notifications/{notifId} {
      // Citizens read their own; admins read all
      allow read: if request.auth != null && (resource.data.recipientUid == request.auth.uid || isAdmin());
      // Citizens can mark as read; admins can create
      allow update: if request.auth != null && resource.data.recipientUid == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
      allow create: if isAdmin();
    }

    // ── App Config ──
    match /app_config/{configId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only via Firebase Console
    }
  }
}
```
