# Guidelines — AlertZone Admin Dashboard

> Project-specific coding guidelines, design system, and conventions that all agents and developers must follow.

---

## 1. Design System (Shared with Mobile App)

The admin dashboard uses a **dark theme** that matches the mobile app. Use these exact color tokens — do NOT introduce ad-hoc colors.

### Core Colors

| Token | Hex Value | CSS Variable | Usage |
|---|---|---|---|
| Background Primary | `#0D1F2D` | `--bg-primary` | Main background |
| Background Secondary | `#0A1820` | `--bg-secondary` | Gradient background |
| Background Tertiary | `#071318` | `--bg-tertiary` | Deep background |
| Primary Accent | `#4CC2D1` | `--accent-primary` | Buttons, active states, links |
| Secondary Accent | `#30A89C` | `--accent-secondary` | Brand green, badges, success |
| Surface | `#0F2233` | `--surface` | Cards, containers, sidebar |
| Surface Elevated | `#1E3A44` | `--surface-elevated` | Input fields, modals |
| Border Default | `#1E3347` | `--border` | Card outlines, dividers |
| Border Strong | `#2D4F5C` | `--border-strong` | Active borders |
| Text Primary | `#FFFFFF` | `--text-primary` | Headings, primary text |
| Text Secondary | `#5A7D8A` | `--text-secondary` | Labels, descriptions |
| Text Muted | `#3A6070` | `--text-muted` | Disabled text, placeholders |
| Danger | `#E05C5C` | `--danger` | Errors, rejected status |
| Warning | `#F59E0B` | `--warning` | Pending status, warnings |
| Success | `#30A89C` | `--success` | Resolved, success states |
| Purple Accent | `#A78BFA` | `--purple` | Social safety category |

### Status Colors (MUST match mobile app)

| Status | Text Color | Background | Dot Color |
|---|---|---|---|
| `PENDING` | `#F59E0B` | `#F59E0B/10` | `#F59E0B` |
| `ASSIGNED` | `#60A5FA` | `#60A5FA/10` | `#60A5FA` |
| `FIXING` | `#4CC2D1` | `#4CC2D1/10` | `#4CC2D1` |
| `RESOLVED` | `#30A89C` | `#30A89C/10` | `#30A89C` |
| `REJECTED` | `#E05C5C` | `#E05C5C/10` | `#E05C5C` |

### Category Colors (MUST match mobile app)

| Category ID | Label | Color | Background |
|---|---|---|---|
| `road_traffic` | Road & Traffic | `#4CC2D1` | `#0D2A35` |
| `water_drainage` | Water & Drainage | `#60A5FA` | `#0D1A3D` |
| `waste_environment` | Waste & Env. | `#34D399` | `#0D3D25` |
| `social_safety` | Social Safety | `#A78BFA` | `#2D1F4A` |
| `bridge_structural` | Bridge & Structural | `#F59E0B` | `#3D2E0A` |

---

## 2. Tailwind CSS Conventions

### Do's
- ✅ Use Tailwind utility classes for all styling
- ✅ Use `bg-[#0F2233]/80` syntax for custom colors with opacity
- ✅ Use `backdrop-blur-xl` for glassmorphism effects
- ✅ Use `transition-all duration-200` for smooth interactions
- ✅ Use `hover:` and `group-hover:` for interactive states
- ✅ Use responsive prefixes: `sm:`, `md:`, `lg:` for responsive layouts

### Don'ts
- ❌ Don't use inline `style={{}}` except for dynamic values (chart sizes, positions)
- ❌ Don't create custom CSS classes when Tailwind utilities exist
- ❌ Don't hardcode colors — always use the design system tokens above
- ❌ Don't use generic Tailwind colors (e.g., `bg-blue-500`) — use the specific hex values

---

## 3. Component Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `ReportsManagement.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useReports.ts`)
- Services: `camelCase.service.ts` (e.g., `report.service.ts`)
- Types: `camelCase.ts` (e.g., `report.ts`)
- Constants: `camelCase.ts` (e.g., `categories.ts`)

### Component Structure
```tsx
"use client";

import { useState, useEffect } from "react";
// 1. React imports
// 2. Hook imports
// 3. Type imports
// 4. Component imports
// 5. Constant imports

// Types (if component-specific)
type ComponentProps = {
  // ...
};

// Sub-components (if small and used only here)
function SubComponent() {
  // ...
}

// Main component
export default function ComponentName({ ...props }: ComponentProps) {
  // 1. Hooks
  // 2. State
  // 3. Derived state / computations
  // 4. Effects
  // 5. Event handlers
  // 6. Render
  return (
    // JSX
  );
}
```

### "use client" Directive
- All components using React hooks, browser APIs, or event handlers must have `"use client"` at the top.
- Layout and pure server components can omit it.

---

## 4. Firebase Conventions

### Service Layer Rules
1. **All Firebase imports** go in `lib/services/*.service.ts` — never in components or hooks.
2. **Services return plain objects** — never return Firestore `DocumentReference` or `QuerySnapshot` to components.
3. **Services handle errors** — wrap all Firestore calls in try/catch, log errors, throw user-friendly messages.
4. **Services use `serverTimestamp()`** — never `new Date()` for Firestore timestamps (except inside `arrayUnion`).

### Status Change Protocol
When changing a report's status, the admin dashboard MUST:
1. Update the report's `status` field
2. Update `updatedAt` with `serverTimestamp()`
3. Append to `statusHistory` array
4. Create a notification document in `notifications/` collection
5. If resolving: increment citizen's `reportsValidated` and `contributionPoints`

```typescript
// MANDATORY pattern for status changes
async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminUid: string,
  note?: string
) {
  const reportRef = doc(db, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);
  const report = reportSnap.data();

  // 1. Update report
  await updateDoc(reportRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(note && { resolutionNote: note }),
    statusHistory: arrayUnion({
      status: newStatus,
      changedAt: new Date(),
      changedBy: adminUid,
      ...(note && { note }),
    }),
  });

  // 2. Create notification for citizen
  await addDoc(collection(db, 'notifications'), {
    recipientUid: report.uid,
    type: 'status_change',
    title: 'Report Status Updated',
    body: `Your report "${report.title}" status changed to ${newStatus}.`,
    reportId: reportId,
    data: { previousStatus: report.status, newStatus },
    isRead: false,
    createdAt: serverTimestamp(),
  });

  // 3. If resolving, reward citizen
  if (newStatus === 'RESOLVED') {
    const userRef = doc(db, 'users', report.uid);
    await updateDoc(userRef, {
      reportsValidated: increment(1),
      contributionPoints: increment(25),
    });
  }
}
```

### Soft Deletion Only
- **Reports**: Set `isArchived = true` — never delete documents
- **Users**: Set `status = 'suspended'` — never delete documents
- **Notifications**: Never delete — citizens may need the history

---

## 5. TypeScript Conventions

### Strict Typing
- Always use TypeScript interfaces from `lib/types/`
- Never use `any` for Firestore document data — cast to proper types
- Use type narrowing for nullable fields

```typescript
// ✅ Good
const report = doc.data() as Report;

// ❌ Bad
const report: any = doc.data();
```

### Import Paths
- Use `@/` alias for all imports from the project root
- Example: `import { Report } from '@/lib/types'`

---

## 6. UI/UX Guidelines

### Loading States
- Always show a loading skeleton or spinner while data loads
- Never show empty state before data has loaded
- Use Tailwind's `animate-pulse` for skeleton loading

### Error States
- Display user-friendly error messages
- Provide retry actions where appropriate
- Log detailed errors to console for debugging

### Empty States
- Show a helpful message when lists are empty
- Include an action (e.g., "No reports found. Adjust your filters.")
- Use an icon or illustration

### Animations
- Use `transition-all duration-200` for hover effects
- Use `animate-slide-up` (custom) for page content entrance
- Use stagger classes (`stagger-1`, `stagger-2`) for sequential animations
- Use `hover:-translate-y-1` for card lift effects
- Use `hover:shadow-[0_8px_30px_rgb(20,184,166,0.15)]` for teal glow on hover

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Sidebar collapses to hamburger menu on mobile (`md:` breakpoint)
- Tables become horizontally scrollable on mobile
- Grid layouts adapt: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`

---

## 7. Map Guidelines

### Leaflet (Primary)
- Use `react-leaflet` with dynamic import (`next/dynamic`, `{ ssr: false }`)
- Default center: Sri Lanka (`[7.8731, 80.7718]`)
- Default zoom: `8`
- Use dark tile layer matching the dashboard theme
- Color-code pins by status or category

### Google Maps (If Added)
- API key in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restrict API key to the dashboard domain
- Consider keeping Leaflet as primary (free, no API key limits)

---

## 8. Notification Message Templates

Use consistent notification messages when changing report status:

| Status Change | Title | Body Template |
|---|---|---|
| → ASSIGNED | Report Assigned | Your report "{title}" has been assigned to a team for review. |
| → FIXING | Work In Progress | Good news! Work has started on your report "{title}". |
| → RESOLVED | Issue Resolved | Your report "{title}" has been resolved. Thank you for reporting! |
| → REJECTED | Report Reviewed | Your report "{title}" has been reviewed. Reason: {note} |

---

## 9. Git Conventions

### Branch Naming
- `feat/firebase-integration` — new features
- `fix/login-redirect` — bug fixes
- `refactor/service-layer` — code restructuring
- `docs/update-status` — documentation changes

### Commit Messages
```
feat: wire reports management to Firestore
fix: resolve admin auth redirect on page reload
refactor: extract report service layer
docs: update CURRENT_STATUS after Phase 2
chore: add Google Maps API key
style: improve loading skeleton animations
```

---

## 10. Security Checklist

- [ ] Firebase API keys are in `.env.local` (not committed to repo)
- [ ] Admin role is verified on login (not just Firebase Auth)
- [ ] Reports can only be updated by admins (Firestore security rules)
- [ ] Users cannot be hard-deleted
- [ ] Reports cannot be hard-deleted
- [ ] Test pages (`test-connection/`) removed before production
- [ ] No passwords or secrets in source code
- [ ] Google Maps API key is domain-restricted
