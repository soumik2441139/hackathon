# 📱 App Pages

Next.js 15 App Router pages. Each folder maps to a URL route.

## Route Map

| Route | File | Access | Description |
|-------|------|--------|-------------|
| `/` | `page.tsx` | Public | Landing page with hero, featured jobs, AI showcase |
| `/login` | `(auth)/login/page.tsx` | Public | Email/password login with glassmorphic UI |
| `/register` | `(auth)/register/page.tsx` | Public | Student registration with email verification |
| `/jobs` | `jobs/page.tsx` | Public | Job listing with filters, search, pagination |
| `/jobs/create` | `jobs/create/page.tsx` | Admin | Job creation form |
| `/jobs/[id]` | `jobs/[id]/page.tsx` | Public | Job detail with apply modal and save/share |
| `/dashboard` | `dashboard/page.tsx` | Protected | Dashboard router |
| `/dashboard/student` | `dashboard/student/page.tsx` | Student | Profile, applications, saved jobs |
| `/dashboard/student/resume` | `dashboard/student/resume/page.tsx` | Student | Resume upload and management |
| `/dashboard/admin` | `dashboard/admin/page.tsx` | Admin | System stats, user management |
| `/dashboard/admin/jobs` | `dashboard/admin/jobs/page.tsx` | Admin | Job CRUD matrix |
| `/dashboard/admin/jobs/edit/[id]` | `dashboard/admin/jobs/edit/[id]/page.tsx` | Admin | Edit job form |
| `/dashboard/admin/bots` | `dashboard/admin/bots/page.tsx` | Admin | Bot orchestration hub |
| `/dashboard/admin/cleaner` | `dashboard/admin/cleaner/page.tsx` | Admin | Data cleaning tools |
| `/dashboard/messages` | `dashboard/messages/page.tsx` | Protected | Messaging interface |

## Layout

`layout.tsx` wraps all pages with:
- `AuthProvider` (session context)
- `SmoothScrollProvider` (Lenis smooth scrolling)
- `Navbar` + `Footer`

## Styling

`globals.css` defines:
- Tailwind CSS v4 base
- CSS custom properties for theming
- Role-based themes (`theme-student`, `theme-admin`)
- Dark oceanic glassmorphism defaults
