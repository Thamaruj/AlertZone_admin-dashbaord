<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.


<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — AlertZone Admin Dashboard

> **⚠️ MANDATORY**: Every AI agent MUST read the following documents before beginning any work on this project. No exceptions.

## Required Reading (In Order)

1. **`AGENTS.md`** (this file) — Understand the project's purpose, rules, and architecture.
2. **`docs/MOBILE_APP_INTEGRATION_GUIDE.md`** — Understand how the mobile app works, what data it writes, and how the dashboard must interact with it. **This is critical for all Firebase-related work.**
3. **`docs/CURRENT_STATUS.md`** — Know what is done, what is broken, and what is pending.
4. **`docs/IMPLEMENTATION_PLAN.md`** — Find the specific phase/task you are working on.
5. **`docs/FIRESTORE_DATA_MODEL.md`** — Understand the shared data schema before touching any Firebase code.
6. **`docs/ARCHITECTURE.md`** — Understand the target architecture and coding patterns.
7. **`docs/GUIDELINES.md`** — Project-specific coding guidelines and conventions.

---

## 1. What Is AlertZone?

**AlertZone** is a **citizen-driven safety and infrastructure reporting platform** built for Sri Lanka. It empowers everyday citizens to report public safety concerns — potholes, broken streetlights, blocked drains, illegal dumping, etc. — directly to local government authorities.

### Core Mission

> *"Stay Aware. Stay Safe."*

The **Admin Dashboard** is the operations center where local authority admins manage, triage, and resolve citizen-submitted reports.

---

## 2. Project Overview

| Attribute | Detail |
|---|---|
| **Project Type** | University Group Project |
| **Platform** | Web (Next.js 16 / App Router) |
| **Target Region** | Sri Lanka |
| **Backend** | Firebase (Auth + Firestore + Storage + FCM) |
| **Companion App** | React Native / Expo mobile app (`../alertzone-mobile-app/`) |
| **Firebase Project** | `alertzone-3d2a3` (shared with mobile app) |
| **Styling** | Tailwind CSS v4 |
| **Maps** | Leaflet + react-leaflet |
| **Language** | TypeScript |

---

## 3. Core Admin Features

| Feature | Description |
|---|---|
| **Admin Authentication** | Firebase Auth login with Firestore role check (`role === 'admin'`) |
| **Report Management** | View, filter, search, assign, and update status of all citizen reports |
| **Status Updates** | Change report status (PENDING → ASSIGNED → FIXING → RESOLVED / REJECTED), triggering citizen notifications |
| **Report Archival** | Soft-delete (archive) reports that are no longer relevant |
| **Analytics & Trends** | Charts: reports over time, category breakdown, resolution rates, area distribution |
| **Map Overview** | Interactive Leaflet map with color-coded pins by status/category |
| **User Management** | View registered citizens, suspend/activate accounts |
| **Notification Management** | Create notifications for citizens on status changes; send system-wide announcements |

---

## 4. Agent Rules

### Before Starting ANY Work

1. Read ALL documents listed in "Required Reading" above.
2. Understand that this dashboard shares a Firebase backend with the mobile app — **never** modify the data model without checking `MOBILE_APP_INTEGRATION_GUIDE.md`.
3. Check `CURRENT_STATUS.md` to understand what is built, what uses mock data, and what is missing.

### During Work

- **Match the mobile app's data model** — use the exact same Firestore field names and types.
- **Always create notifications** when changing report status — citizens expect to be notified in-app.
- **Never hard-delete** reports or users — use `isArchived: true` or `status: 'suspended'`.
- **Append to `statusHistory`** on every status change — the mobile app's status timeline depends on this.
- **Follow the shared design system** — use the same color tokens as the mobile app (see `GUIDELINES.md`).
- **Use the service layer** — never import Firebase SDK directly in components.
- **Write TypeScript** with proper types from `lib/types/`.

### Before EVERY Commit (MANDATORY)

> **⚠️ Non-negotiable**: Before running `git commit`, you MUST update these two files to reflect what was changed:

1. **Update `docs/CURRENT_STATUS.md`** — mark completed items, update status columns, and add notes about what changed.
2. **Update `docs/PROJECT_PROGRESS.md`** — add a dated entry describing what was done.

These files are the single source of truth for the project's state. Committing without updating them creates confusion for all team members.

### After Completing Work

1. **Verify** the two files above are updated (they should already be from the pre-commit step).
2. **Commit with a descriptive message** — format: `feat: <what was done>` or `fix: <what was fixed>`.
3. **Do not break existing features** — if you change auth flow or navigation, verify the app still loads.

### Commit Message Convention

```
feat: wire reports management to Firestore
fix: resolve admin auth redirect loop
refactor: extract report status updater to service
docs: update CURRENT_STATUS after Firebase integration
chore: add chart library dependency
```

---

## 5. Shared Firebase Project

Both the mobile app and admin dashboard connect to the **same Firebase project** (`alertzone-3d2a3`). This means:

- They share the **same Firestore database** and **same Auth user pool**.
- Changes to Firestore rules, data model, or security rules affect **both apps**.
- Admin users have `role: 'admin'` in their `users` Firestore document.
- The dashboard must **never** modify fields that belong to the citizen (e.g., `uid`, `description`, `location`).

---

## 6. Key Contacts & Roles

This is a university group project. All team members are students collaborating on different parts of the system:

- **Mobile App Team** — Working on the React Native / Expo mobile application.
- **Admin Dashboard Team** — Working on the Next.js admin web panel.
- **Both teams** share a single Firebase backend and must coordinate on data model changes.
