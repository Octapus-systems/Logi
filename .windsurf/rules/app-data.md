---
trigger: always_on
---
# Logi App - Project Rules

## What is this app?
Logi is a staff task management and attendance tracking app.
It has two roles: Admin and Staff (User).
The app tracks check-ins, task progress, work hours, and staff productivity using a "Lives" system.

---

## Roles

### Staff (User)
- Can check in to start their work session
- Can view tasks assigned to them by the admin
- Can update task status, reply with reports, and track time per task
- Has a Lives system that monitors activity every 30 minutes

### Admin
- Has full authority over the system
- Can assign tasks with priority to any staff member
- Can monitor all staff activity, check-ins, task status, and time logs
- Can manage Lives (give or remove) for any staff member
- Can receive and respond to staff requests

---

## Core Features

### Check-In
- Before check-in: staff sees only the COUNT of tasks assigned to them
- After check-in: staff sees the full task list with details

### Task List (Staff View)
- Each task shows: task name, priority, status dropdown, timer button, reply input
- Status dropdown options: To Do | In Progress | Stuck | Done
- Staff can update the status at any time
- Admin can see all status updates in real time

### Task Timer
- Each task has a Timer button
- Staff must manually click to start/stop the timer for a task
- Timer data is sent to admin to show how long staff worked on each task

### Reply / Report Input
- Each task has a reply input field
- Staff writes updates, progress reports, or descriptions here
- Replying to ANY task pauses the Life deduction countdown

### Lives System
- 4 Lives = 4 working hours
- Every 30 minutes after check-in, if no task has been replied to, 1 Life is deducted
- If staff replies to any task, the Life deduction is PAUSED
- If Lives reach 2, the system records only a HALF DAY (2 hours) for that staff
- Admin can manually give or remove Lives

### Request Time Button
- Staff can click "Request Time" on a task they don't understand
- This sends a request notification to the admin
- Admin can view and respond to the request

---

## Admin Panel Features

- Assign tasks to specific staff members with priority levels
- View all currently checked-in staff
- See which staff member is working on which task
- View time logs per staff per task
- View and respond to "Request Time" requests from staff
- Give or remove Lives from any staff member
- Full authority over all app settings and data

---

## Important Business Logic

- Life deduction starts 30 minutes after check-in
- Replying to a task pauses deduction — it does NOT restore lost lives
- Task timer running does NOT automatically pause life deduction (only replies do)
- Half day threshold: Lives = 2 or below
- Full day threshold: Lives = 3 or 4
- Admin life changes override the automatic system

---

## Tech Notes for AI
- Always keep Staff and Admin views completely separate
- All task updates, replies, timers, and life changes should reflect in real time for the admin
- Lives logic must run server-side (not client-side) to prevent manipulation
- Timer data must be stored per task per staff member
- Reply input must be linked to a specific task, not a general chat

---

## Unresolved Design Question
- If a task takes more than 30 minutes, staff loses a life even while actively working on it.
- Possible solution to consider: if a task timer is actively running, pause the life deduction — similar to how a reply pauses it.
- This has NOT been finalized yet. Wait for confirmation before implementing.

