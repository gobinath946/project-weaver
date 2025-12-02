# Design Document: Project Management Module

## Overview

The Project Management module extends the existing Project Hub application with comprehensive project tracking capabilities similar to Zoho Projects. The module introduces four main entities: Projects, Tasks (with Task Lists), Bugs, and Time Logs. It integrates with the existing authentication and role-based access control system to provide appropriate data visibility based on user roles.

The architecture follows the existing patterns in the codebase:
- Backend: Express.js with MongoDB/Mongoose
- Frontend: React with TypeScript, TanStack Query, and shadcn/ui components
- API: RESTful endpoints with JWT authentication

## Architecture

```mermaid
graph TB
    subgraph Frontend
        PM[Project Management Pages]
        PL[ProjectList]
        TL[TaskList]
        BL[BugList]
        TML[TimeLogList]
        DB[Dashboard]
        
        PM --> PL
        PM --> TL
        PM --> BL
        PM --> TML
        PM --> DB
    end
    
    subgraph API Layer
        PR[/api/projects]
        TR[/api/tasks]
        TLR[/api/task-lists]
        BR[/api/bugs]
        TMLR[/api/timelogs]
        DBR[/api/dashboard]
    end
    
    subgraph Backend Services
        PC[ProjectController]
        TC[TaskController]
        BC[BugController]
        TMLC[TimeLogController]
        DBC[DashboardController]
    end
    
    subgraph Data Layer
        PModel[Project Model]
        TLModel[TaskList Model]
        TModel[Task Model]
        BModel[Bug Model]
        TMLModel[TimeLog Model]
    end
    
    PL --> PR
    TL --> TR
    TL --> TLR
    BL --> BR
    TML --> TMLR
    DB --> DBR
    
    PR --> PC
    TR --> TC
    TLR --> TC
    BR --> BC
    TMLR --> TMLC
    DBR --> DBC
    
    PC --> PModel
    TC --> TLModel
    TC --> TModel
    BC --> BModel
    TMLC --> TMLModel
```

## Components and Interfaces

### Backend Components

#### 1. Models

**Project Model** (`backend/src/models/Project.js`)
- Stores project metadata including title, description, owner, team members
- References Company for multi-tenancy
- Tracks project status, dates, and visibility

**TaskList Model** (`backend/src/models/TaskList.js`)
- Groups tasks within a project
- Supports ordering and hierarchy

**Task Model** (`backend/src/models/Task.js`)
- Individual work items with assignee, status, priority
- References Project and optionally TaskList
- Tracks time estimates and actual hours

**Bug Model** (`backend/src/models/Bug.js`)
- Defect tracking with severity, status workflow
- References Project and optionally Task
- Supports classification and reproducibility

**TimeLog Model** (`backend/src/models/TimeLog.js`)
- Time entries linked to tasks or bugs
- Approval workflow with status (Pending, Approved, Rejected)
- Billing type classification

#### 2. Controllers

**ProjectController** - CRUD operations for projects with role-based filtering
**TaskController** - Task and TaskList management with status transitions
**BugController** - Bug tracking with workflow state management
**TimeLogController** - Time logging with approval workflow
**DashboardController** - Aggregated statistics and metrics

#### 3. Routes

All routes follow RESTful conventions with pagination, sorting, and filtering support.

### Frontend Components

#### 1. Pages

**ProjectList** (`src/pages/company/project_management/ProjectList.tsx`)
- List/Card view of projects with infinite scroll
- Project creation dialog
- Filtering by status, owner, dates

**TaskList** (`src/pages/company/project_management/TaskList.tsx`)
- List and Kanban views
- Task creation with project/task list selection
- Drag-and-drop status changes in Kanban

**BugList** (`src/pages/company/project_management/BugList.tsx`)
- List and Kanban views with status workflow
- Bug creation and assignment
- Severity and status filtering

**TimeLogList** (`src/pages/company/project_management/TimeLogList.tsx`)
- Time log entries with date range filtering
- Approval workflow for super admins
- Billable/Non-billable aggregation

**Dashboard** (`src/pages/company/project_management/Dashboard.tsx`)
- Summary statistics cards
- My Tasks and Due Today sections
- Overdue items with indicators

#### 2. Shared Components

**KanbanBoard** - Reusable kanban component with drag-and-drop
**InfiniteScrollList** - Wrapper for paginated lists with scroll detection
**StatusBadge** - Colored status indicators
**ViewToggle** - Switch between List/Kanban/Card views

## Data Models

### Project Schema

```javascript
{
  project_id: String,        // Auto-generated: PRJ-001
  title: String,             // Required
  description: String,
  owner: ObjectId,           // Ref: User
  team_members: [ObjectId],  // Ref: User
  company_id: ObjectId,      // Ref: Company
  status: String,            // Active, On Hold, Completed, Archived
  visibility: String,        // Private, Public
  start_date: Date,
  end_date: Date,
  tags: [String],
  progress: Number,          // 0-100
  task_count: Number,        // Denormalized
  bug_count: Number,         // Denormalized
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

### TaskList Schema

```javascript
{
  name: String,              // Required
  project_id: ObjectId,      // Ref: Project
  company_id: ObjectId,      // Ref: Company
  description: String,
  order: Number,
  is_active: Boolean,
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

### Task Schema

```javascript
{
  task_id: String,           // Auto-generated: TSK-001
  name: String,              // Required
  description: String,
  project_id: ObjectId,      // Ref: Project, Required
  task_list_id: ObjectId,    // Ref: TaskList, Optional
  company_id: ObjectId,      // Ref: Company
  assignee: ObjectId,        // Ref: User
  owner: ObjectId,           // Ref: User
  status: String,            // Not Started, In Progress, Completed, On Hold
  priority: String,          // None, Low, Medium, High, Urgent
  start_date: Date,
  due_date: Date,
  work_hours_estimate: Number,
  actual_hours: Number,
  completion_percentage: Number,
  tags: [String],
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

### Bug Schema

```javascript
{
  bug_id: String,            // Auto-generated: BUG-001
  title: String,             // Required
  description: String,
  project_id: ObjectId,      // Ref: Project, Required
  task_id: ObjectId,         // Ref: Task, Optional
  company_id: ObjectId,      // Ref: Company
  reporter: ObjectId,        // Ref: User
  assignee: ObjectId,        // Ref: User
  status: String,            // Open, In Progress, Testing, Moved to UAT, Ready for Production, Closed, Reopen
  severity: String,          // None, Minor, Major, Critical, Blocker
  classification: String,    // Functional Bug, UI Bug, Performance, Security
  module: String,
  reproducible: String,      // Always, Sometimes, Rarely, Unable
  due_date: Date,
  tags: [String],
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

### TimeLog Schema

```javascript
{
  log_id: String,            // Auto-generated: TL-001
  title: String,
  project_id: ObjectId,      // Ref: Project, Required
  task_id: ObjectId,         // Ref: Task, Optional
  bug_id: ObjectId,          // Ref: Bug, Optional
  company_id: ObjectId,      // Ref: Company
  user_id: ObjectId,         // Ref: User
  date: Date,                // Required
  daily_log_hours: Number,   // Required
  start_time: String,        // HH:MM format
  end_time: String,          // HH:MM format
  billing_type: String,      // Billable, Non-Billable
  approval_status: String,   // Pending, Approved, Rejected
  approved_by: ObjectId,     // Ref: User
  approved_at: Date,
  notes: String,
  created_by: ObjectId,
  created_at: Date,
  updated_at: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based project filtering
*For any* company with projects and users, when a company_super_admin queries projects, all projects for that company should be returned; when a company_admin queries projects, only projects where they are owner, assignee, or team member should be returned.
**Validates: Requirements 1.1, 1.2, 6.1, 6.2**

### Property 2: Pagination consistency
*For any* paginated API response, the total count should equal the sum of items across all pages, and requesting page N should return items starting at offset (N-1) * pageSize.
**Validates: Requirements 1.3, 2.2, 3.1, 7.2**

### Property 3: Project creation validation
*For any* project creation request, if title, owner, or start_date is missing or empty, the request should be rejected; otherwise a unique project_id should be generated and the project should be persisted.
**Validates: Requirements 1.4, 1.5**

### Property 4: Task-TaskList association integrity
*For any* task list created, it must be associated with exactly one project; for any task created, it must be associated with exactly one project and optionally one task list within that project.
**Validates: Requirements 2.3, 2.4**

### Property 5: Task field persistence
*For any* task created with all fields populated, querying that task should return all fields with identical values (name, description, assignee, dates, priority, status, work hours).
**Validates: Requirements 2.5, 2.7**

### Property 6: Bug status workflow validity
*For any* bug status transition, the new status must be one of the valid workflow states (Open, In Progress, Testing, Moved to UAT, Ready for Production, Closed, Reopen).
**Validates: Requirements 3.5**

### Property 7: Time log approval workflow
*For any* time log, only a company_super_admin should be able to change approval_status from Pending to Approved or Rejected; the approved_by and approved_at fields should be set when status changes.
**Validates: Requirements 4.5**

### Property 8: Time aggregation accuracy
*For any* set of time logs within a date range, the aggregated billable hours should equal the sum of daily_log_hours where billing_type is Billable, and non-billable hours should equal the sum where billing_type is Non-Billable.
**Validates: Requirements 4.6**

### Property 9: Dashboard statistics consistency
*For any* user's dashboard, the open tasks count should equal the count of tasks with status not equal to Completed, and closed tasks should equal tasks with status Completed, filtered by role permissions.
**Validates: Requirements 5.1, 5.2**

### Property 10: Date serialization round-trip
*For any* date field stored in the database, serializing to JSON and deserializing should produce an equivalent date value in ISO 8601 format.
**Validates: Requirements 7.1**

### Property 11: Entity population completeness
*For any* API response that includes referenced entities (owner, assignee), those references should be populated with at minimum id, email, and name fields.
**Validates: Requirements 7.4**

## Error Handling

### API Error Responses

All API errors follow a consistent format:
```javascript
{
  success: false,
  message: "Human-readable error message",
  errors: [] // Optional validation errors array
}
```

### Error Categories

1. **Validation Errors (400)**: Missing required fields, invalid data formats
2. **Authentication Errors (401)**: Invalid or expired token
3. **Authorization Errors (403)**: User lacks permission for the operation
4. **Not Found Errors (404)**: Requested resource doesn't exist
5. **Conflict Errors (409)**: Duplicate entries or state conflicts
6. **Server Errors (500)**: Unexpected internal errors

### Specific Error Handling

- **Project not found**: Return 404 with project_id in message
- **Task list not in project**: Return 400 when task list doesn't belong to selected project
- **Invalid status transition**: Return 400 with current and attempted status
- **Time log already approved**: Return 409 when trying to modify approved time log
- **Unauthorized access**: Return 403 when user tries to access/modify data outside their permission scope

## UI/UX Design Guidelines

### Modern Professional UI Principles

1. **Dark Theme Support**: Consistent with existing app theme (dark green accent)
2. **Clean Typography**: Clear hierarchy with proper spacing
3. **Card-Based Layouts**: Modern card components for list items
4. **Smooth Animations**: Subtle transitions for state changes
5. **Responsive Design**: Mobile-first approach with adaptive layouts

### View Modes

**List View**
- Clean table layout with hover effects
- Sortable columns with visual indicators
- Row actions on hover (edit, delete, view)
- Status badges with color coding

**Kanban View**
- Drag-and-drop columns by status
- Card preview with key information
- Quick actions on cards
- Column headers with item counts

**Card View** (for Projects)
- Grid layout with project cards
- Progress indicators
- Team member avatars
- Quick stats (tasks, bugs)

### Color Coding

**Status Colors:**
- Not Started / Open: `gray`
- In Progress: `blue`
- Testing / Review: `yellow`
- Completed / Closed: `green`
- On Hold / Blocked: `orange`
- Overdue: `red`

**Priority Colors:**
- None: `gray`
- Low: `green`
- Medium: `yellow`
- High: `orange`
- Urgent/Critical: `red`

**Severity Colors:**
- Minor: `blue`
- Major: `yellow`
- Critical: `orange`
- Blocker: `red`

### Component Patterns

- Infinite scroll with loading skeletons
- Modal dialogs for create/edit forms
- Toast notifications for actions
- Confirmation dialogs for destructive actions
- Empty states with helpful illustrations
- Filter panels with clear/reset options
