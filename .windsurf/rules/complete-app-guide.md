---
trigger: always_on
---

# ------------------------------------------------------------
# 🧠 PROJECT OVERVIEW
# ------------------------------------------------------------

Logi is a modern in-house workforce productivity and task management platform
designed for internal company use only. It helps companies monitor staff activity,
task progress, attendance flow, and work performance in a single centralized system.

The application simplifies daily operations between administrators and staff members
through a clean, efficient, and performance-oriented workflow system.

This is NOT a public-facing product. All users are company staff members only.
Access is controlled via predefined company credentials.

The platform contains two main user roles:
  1. Staff / User Panel
  2. Admin / Management Panel

## Staff Panel Features:
  - Secure login with predefined company credentials
  - View available "lives" or work credits
  - Check-in system for attendance marking
  - View list of assigned tasks
  - Each task contains:
      * Detailed task information
      * Task progress controls
      * Start / Stop timer functionality
      * Reply or update section for reporting work status
      * Time tracking for productivity monitoring
  - Total active / pending task count display

## Admin / Management Panel Features:
  - Complete operational dashboard
  - View all staff activities
  - Monitor task progress in real time
  - Review employee replies and updates
  - Track time consumed per task
  - Assign tasks to specific employees
  - Manage user work credits / lives (increase or decrease)
  - Monitor attendance and productivity insights

## Product Philosophy:
  - Modern, premium, simple, and highly professional UI
  - Clean user experience that reduces clutter
  - Improves workflow efficiency for both staff and admins
  - Transparent productivity tracking
  - Structured workflow ecosystem

# ------------------------------------------------------------
# 📦 TECH STACK
# ------------------------------------------------------------

- Monorepo Tool    : Turborepo
- Frontend         : Next.js 14+ (App Router)
- Backend          : Next.js API Routes (Node.js runtime)
- Database         : MongoDB Atlas
- ODM              : Mongoose
- Language         : TypeScript (strict mode)
- Styling          : Tailwind CSS
- Auth             : NextAuth.js (credentials provider only — no social login)
- State Management : Zustand
- Form Handling    : React Hook Form + Zod validation

# ------------------------------------------------------------
# 📁 MONOREPO FOLDER STRUCTURE (Always Follow This Exactly)
# ------------------------------------------------------------

logi/
├── apps/
│   └── web/                             # Main Next.js application
│       ├── app/
│       │   ├── (auth)/                  # Auth group — login page
│       │   │   └── login/
│       │   │       └── page.tsx
│       │   ├── (staff)/                 # Staff panel pages
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   ├── tasks/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [taskId]/
│       │   │   │       └── page.tsx
│       │   │   └── attendance/
│       │   │       └── page.tsx
│       │   ├── (admin)/                 # Admin panel pages
│       │   │   ├── layout.tsx
│       │   │   ├── dashboard/
│       │   │   │   └── page.tsx
│       │   │   ├── staff/
│       │   │   │   └── page.tsx
│       │   │   ├── tasks/
│       │   │   │   └── page.tsx
│       │   │   └── attendance/
│       │   │       └── page.tsx
│       │   ├── api/
│       │   │   └── v1/                  # Always version your APIs
│       │   │       ├── auth/
│       │   │       │   └── [...nextauth]/
│       │   │       │       └── route.ts
│       │   │       ├── users/
│       │   │       │   └── route.ts
│       │   │       ├── tasks/
│       │   │       │   ├── route.ts
│       │   │       │   └── [taskId]/
│       │   │       │       └── route.ts
│       │   │       ├── attendance/
│       │   │       │   └── route.ts
│       │   │       ├── timer/
│       │   │       │   └── route.ts
│       │   │       └── lives/
│       │   │           └── route.ts
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── ui/                      # Reusable base UI components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Badge.tsx
│       │   │   └── Card.tsx
│       │   ├── shared/                  # Shared across panels
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── PageHeader.tsx
│       │   ├── staff/                   # Staff panel specific components
│       │   │   ├── TaskCard.tsx
│       │   │   ├── TaskTimer.tsx
│       │   │   ├── CheckInButton.tsx
│       │   │   └── LivesCounter.tsx
│       │   └── admin/                   # Admin panel specific components
│       │       ├── StaffTable.tsx
│       │       ├── TaskAssignModal.tsx
│       │       ├── ActivityFeed.tsx
│       │       └── ProductivityChart.tsx
│       ├── lib/
│       │   ├── db.ts                    # MongoDB connection handler
│       │   ├── auth.ts                  # NextAuth config
│       │   └── utils.ts                 # Shared utility functions
│       ├── models/                      # All Mongoose models
│       │   ├── User.ts
│       │   ├── Task.ts
│       │   ├── Attendance.ts
│       │   ├── Timer.ts
│       │   └── TaskReply.ts
│       ├── hooks/                       # Custom React hooks
│       │   ├── useTimer.ts
│       │   ├── useTasks.ts
│       │   └── useAttendance.ts
│       ├── store/                       # Zustand state stores
│       │   ├── authStore.ts
│       │   └── taskStore.ts
│       ├── types/                       # TypeScript type definitions
│       │   ├── user.types.ts
│       │   ├── task.types.ts
│       │   └── attendance.types.ts
│       ├── constants/                   # App-wide constants
│       │   ├── roles.ts
│       │   └── status.ts
│       └── validations/                 # Zod validation schemas
│           ├── task.schema.ts
│           └── user.schema.ts
└── packages/
    ├── ui/                              # Shared UI component library
    ├── config/                          # Shared ESLint, TS, Tailwind configs
    └── types/                           # Shared TypeScript types across apps

# ------------------------------------------------------------
# 🔌 API STRUCTURE RULES (Always Follow This)
# ------------------------------------------------------------

- All APIs must live under: /app/api/v1/
- Always version APIs — never create routes outside /v1/
- Every route.ts must only export valid HTTP methods: GET, POST, PUT, PATCH, DELETE
- Every API must return a consistent JSON response structure:

  # Success Response:
  {
    "success": true,
    "message": "Task fetched successfully",
    "data": { ... }
  }

  # Error Response:
  {
    "success": false,
    "message": "Task not found",
    "error": "NOT_FOUND"
  }

  # List Response:
  {
    "success": true,
    "message": "Tasks fetched successfully",
    "data": [ ... ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10
    }
  }

- Always validate request body using Zod before touching the database
- Always wrap API logic in try/catch blocks
- Never expose passwords or sensitive fields in API responses
- Always check user role and session before processing requests
- Staff APIs and Admin APIs must be separately protected by role middleware

# ------------------------------------------------------------
# 🗄️ DATABASE / MONGOOSE RULES (Always Follow This)
# ------------------------------------------------------------

- All Mongoose models go inside /models folder only
- Every model must include timestamps: { timestamps: true }
- Always use this pattern to avoid model re-registration:
    mongoose.models.ModelName || mongoose.model('ModelName', Schema)
- Never store plain text passwords — always hash with bcrypt
- Never return password field in any query — use .select('-password')
- Use meaningful field names that describe the data clearly
- Always define proper types and required fields in schemas
- Index fields that are frequently queried (email, userId, status)

## Core Models to Always Respect:
  User       — company staff and admin accounts
  Task       — tasks assigned to staff members
  Attendance — daily check-in records per staff
  Timer      — task timer start/stop tracking per user
  TaskReply  — staff replies and updates on tasks

# ------------------------------------------------------------
# 🔐 AUTHENTICATION RULES
# ------------------------------------------------------------

- Use NextAuth.js with credentials provider only
- No Google, GitHub, or any social login — this is an in-house app
- Session strategy: JWT
- Two roles only: "staff" and "admin"
- Always protect routes using middleware.ts at the root level
- Staff can only access (staff) routes
- Admin can only access (admin) routes
- Always redirect unauthenticated users to /login

# ------------------------------------------------------------
# 🧱 COMPONENT RULES
# ------------------------------------------------------------

- Use functional components only — never class components
- Every component must have proper TypeScript props interface defined
- Keep components small and focused — one responsibility per component
- Reusable base components go in /components/ui
- Panel-specific components go in /components/staff or /components/admin
- Never fetch data directly inside a component — use custom hooks
- Use Tailwind CSS for all styling — no inline styles
- Never use !important in CSS

# ------------------------------------------------------------
# ✅ GENERAL CODE STANDARDS
# ------------------------------------------------------------

- Language: TypeScript strict mode everywhere — no 'any' types
- Always use async/await — never .then() or .catch()
- Use meaningful, descriptive variable and function names
- Add a JSDoc comment above every function describing what it does
- Never hardcode values — use constants or environment variables
- All environment variables must be prefixed with NEXT_PUBLIC_ if used on client
- Keep functions small — if a function is over 30 lines, split it
- Never commit .env files — always use .env.example for documentation
- Use early returns to avoid deeply nested if/else blocks
- Always handle loading and error states in the UI

# ------------------------------------------------------------
# 🎨 UI / UX STANDARDS
# ------------------------------------------------------------

- Design must feel: Modern, Premium, Clean, Professional
- Use a consistent color palette — define in Tailwind config
- Staff panel: Minimal, focused, distraction-free
- Admin panel: Data-rich, dashboard-style, information dense
- Always show loading skeletons — never blank screens while loading
- Always show meaningful empty states when there is no data
- Mobile responsive by default for all pages
- Use consistent spacing, typography, and border radius throughout

# ------------------------------------------------------------
# 🚫 THINGS TO NEVER DO
# ------------------------------------------------------------

- Never create files outside the defined folder structure
- Never write raw MongoDB queries — always use Mongoose
- Never skip input validation on any API route
- Never allow cross-role data access (staff cannot see admin data)
- Never use var — always use const or let
- Never use default exports for types — always use named exports
- Never create a new API route without proper error handling
- Never store sensitive data in localStorage — use secure HTTP-only cookies
