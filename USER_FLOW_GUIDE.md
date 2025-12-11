# Project Overview - User Flow Guide

## Navigation Structure

```
Sidebar
  └── Project Overview (Eye Icon)
       └── Shows list of user's assigned projects
            └── Click on any project card
                 └── Opens MyProjectDetail page with 4 tabs:
                      ├── Dashboard Tab (default)
                      │    ├── My Tasks count
                      │    ├── Completed Tasks count
                      │    ├── My Bugs count
                      │    ├── Time Logs count
                      │    ├── Task Breakdown (by status)
                      │    └── Bug Breakdown (by status)
                      │
                      ├── Tasks Tab
                      │    └── List of all tasks assigned to user in this project
                      │         ├── Task name & description
                      │         ├── Due date
                      │         ├── Priority badge
                      │         └── Status badge
                      │
                      ├── Bugs Tab
                      │    └── List of all bugs assigned to user in this project
                      │         ├── Bug title & description
                      │         ├── Due date
                      │         ├── Severity badge
                      │         └── Status badge
                      │
                      └── Time Logs Tab
                           └── List of all time logs by user in this project
                                ├── Description
                                ├── Date & Hours
                                ├── Billable/Non-Billable badge
                                └── Approval status badge
```

## Screen Flow

### 1. Project Overview Page (`/company/project_overview`)

**What Users See:**
- Summary statistics cards at the top:
  - My Projects count
  - Open Tasks count
  - Completed Tasks count
  - Open Bugs count
  - Time Logged (hours)
- Completion rate cards:
  - Task Completion Rate (percentage)
  - Bug Resolution Rate (percentage)
- Grid of project cards showing:
  - Project title and ID
  - Project status badge
  - Project group (if assigned)
  - Task progress (completed/total)
  - Bug progress (closed/total)
  - "Click to view details" with arrow icon

**User Actions:**
- Click on any project card to view details
- View overall statistics across all projects
- See task and bug tabs for filtering (existing functionality)

### 2. My Project Detail Page (`/company/my-projects/:id`)

**What Users See:**

#### Header Section:
- Back button (returns to Project Overview)
- Project title
- Project ID
- Project description
- Project status badge

#### Project Info Card:
- Owner name
- Start date
- End date
- Progress percentage

#### Tab Navigation:
Four tabs to switch between different views

---

#### Dashboard Tab (Default View):

**Statistics Cards:**
- My Tasks: Total number of tasks assigned to user
- Completed: Number of completed tasks
- My Bugs: Total number of bugs assigned to user
- Time Logs: Number of time log entries

**Breakdown Cards:**
- Task Breakdown: Shows count by status (e.g., "In Progress: 5", "Completed: 3")
- Bug Breakdown: Shows count by status (e.g., "Open: 2", "Closed: 1")

---

#### Tasks Tab:

**Task List:**
Each task card shows:
- Task name (bold)
- Description (if available)
- Due date with clock icon
- Priority badge (High, Medium, Low)
- Status badge (In Progress, Completed, etc.)

**Empty State:**
"No tasks assigned to you in this project"

---

#### Bugs Tab:

**Bug List:**
Each bug card shows:
- Bug title (bold)
- Description (if available)
- Due date with clock icon
- Severity badge (Critical, High, Medium, Low)
- Status badge (Open, In Progress, Closed, etc.)

**Empty State:**
"No bugs assigned to you in this project"

---

#### Time Logs Tab:

**Time Log List:**
Each time log card shows:
- Description or "Time log entry"
- Date with calendar icon
- Hours with timer icon
- Billable/Non-Billable badge
- Approval status badge (Approved, Pending, Rejected)

**Empty State:**
"No time logs recorded in this project"

---

## Key Differences from Existing Project Management

### Project Overview (New Feature)
- **Focus:** User-centric view
- **Data:** Only shows items assigned to the logged-in user
- **Purpose:** Personal task tracking and time management
- **Access:** All users with project_management module

### Project Management (Existing Feature)
- **Focus:** Project-centric view
- **Data:** Shows all items in projects (admin view)
- **Purpose:** Project administration and team management
- **Access:** Primarily for admins and project managers

## Visual Indicators

### Color Coding:
- **Blue:** Tasks and general information
- **Green:** Completed/Success states
- **Red:** Bugs and critical items
- **Purple:** Time tracking
- **Orange:** In Progress/Pending states

### Interactive Elements:
- **Hover Effects:** Cards lift and change border color on hover
- **Cursor:** Pointer cursor on clickable elements
- **Transitions:** Smooth animations for better UX

## Responsive Behavior

### Desktop (>768px):
- 4 columns for statistics cards
- 3 columns for project cards
- 2 columns for breakdown cards
- Full tab navigation visible

### Tablet (768px - 1024px):
- 2-3 columns for statistics cards
- 2 columns for project cards
- 2 columns for breakdown cards

### Mobile (<768px):
- 2 columns for statistics cards
- 1 column for project cards
- 1 column for breakdown cards
- Stacked layout for better readability

## User Permissions

### Who Can Access:
- Users with `project_management` module enabled
- Roles: `company_super_admin`, `company_admin`

### Data Visibility:
- Users only see projects where they are:
  - Project owner
  - Team member
  - Allocated user
  - Creator

- Users only see tasks where they are:
  - Assignee
  - Owner

- Users only see bugs where they are:
  - Assignee
  - Reporter

- Users only see their own time logs

## Common Use Cases

### 1. Daily Task Review
1. Open Project Overview
2. Check "Open Tasks" count
3. Click on active project
4. Go to Tasks tab
5. Review tasks and priorities

### 2. Time Log Verification
1. Open Project Overview
2. Click on project
3. Go to Time Logs tab
4. Verify logged hours and approval status

### 3. Bug Tracking
1. Open Project Overview
2. Check "Open Bugs" count
3. Click on project with bugs
4. Go to Bugs tab
5. Review bug severity and status

### 4. Progress Monitoring
1. Open Project Overview
2. View completion rates
3. Click on project
4. Check Dashboard tab for detailed breakdown
5. Identify areas needing attention

## Tips for Users

1. **Bookmark the Project Overview page** for quick access to your work
2. **Check completion rates** to track your productivity
3. **Use the Dashboard tab** for a quick overview before diving into details
4. **Filter by project** to focus on specific work items
5. **Monitor time logs** to ensure accurate billing and tracking
