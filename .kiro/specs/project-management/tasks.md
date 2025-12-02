# Implementation Plan

## Phase 1: Backend Models and Database Setup

- [x] 1. Create Project Model


  - Create `backend/src/models/Project.js` with schema for projects
  - Include fields: project_id, title, description, owner, team_members, company_id, status, visibility, dates, tags, progress
  - Add indexes for company_id, owner, status
  - Add pre-save hook for auto-generating project_id (PRJ-001 format)
  - _Requirements: 1.4, 1.5, 1.6_


- [x] 2. Create TaskList Model

  - Create `backend/src/models/TaskList.js` with schema for task lists
  - Include fields: name, project_id, company_id, description, order, is_active
  - Add indexes for project_id, company_id
  - _Requirements: 2.3_


- [x] 3. Create Task Model

  - Create `backend/src/models/Task.js` with schema for tasks
  - Include fields: task_id, name, description, project_id, task_list_id, company_id, assignee, owner, status, priority, dates, work_hours, tags
  - Add indexes for project_id, assignee, status, company_id
  - Add pre-save hook for auto-generating task_id (TSK-001 format)
  - _Requirements: 2.4, 2.5_


- [x] 4. Create Bug Model


  - Create `backend/src/models/Bug.js` with schema for bugs
  - Include fields: bug_id, title, description, project_id, task_id, company_id, reporter, assignee, status, severity, classification, module, reproducible, due_date, tags
  - Add indexes for project_id, assignee, status, severity, company_id
  - Add pre-save hook for auto-generating bug_id (BUG-001 format)
  - _Requirements: 3.2, 3.3, 3.5_


- [x] 5. Create TimeLog Model

  - Create `backend/src/models/TimeLog.js` with schema for time logs
  - Include fields: log_id, title, project_id, task_id, bug_id, company_id, user_id, date, daily_log_hours, start_time, end_time, billing_type, approval_status, approved_by, approved_at, notes
  - Add indexes for project_id, user_id, date, approval_status, company_id
  - Add pre-save hook for auto-generating log_id (TL-001 format)
  - _Requirements: 4.2, 4.3_

## Phase 2: Backend Controllers


- [x] 6. Create Project Controller

  - Create `backend/src/controllers/project.controller.js`
  - Implement getProjects with role-based filtering and pagination
  - Implement getProject by ID
  - Implement createProject with validation
  - Implement updateProject
  - Implement deleteProject
  - Implement getProjectStats for dashboard
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2_


- [x] 7. Create TaskList Controller

  - Create `backend/src/controllers/taskList.controller.js`
  - Implement getTaskLists by project
  - Implement createTaskList
  - Implement updateTaskList
  - Implement deleteTaskList
  - Implement reorderTaskLists
  - _Requirements: 2.3_


- [x] 8. Create Task Controller

  - Create `backend/src/controllers/task.controller.js`
  - Implement getTasks with role-based filtering and pagination
  - Implement getTask by ID
  - Implement createTask with project/task_list validation
  - Implement updateTask including status changes
  - Implement deleteTask
  - Implement getTasksByProject
  - Implement getTasksByStatus for kanban view
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_


- [x] 9. Create Bug Controller

  - Create `backend/src/controllers/bug.controller.js`
  - Implement getBugs with role-based filtering and pagination
  - Implement getBug by ID
  - Implement createBug with validation
  - Implement updateBug with status workflow validation
  - Implement deleteBug
  - Implement getBugsByProject
  - Implement getBugsByStatus for kanban view
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_


- [x] 10. Create TimeLog Controller

  - Create `backend/src/controllers/timeLog.controller.js`
  - Implement getTimeLogs with role-based filtering and pagination
  - Implement getTimeLog by ID
  - Implement createTimeLog with validation
  - Implement updateTimeLog
  - Implement deleteTimeLog
  - Implement approveTimeLog (super_admin only)
  - Implement rejectTimeLog (super_admin only)
  - Implement getTimeLogAggregates for date range
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 11. Create Dashboard Controller


  - Create `backend/src/controllers/projectDashboard.controller.js`
  - Implement getDashboardStats (open/closed tasks, bugs, milestones)
  - Implement getMyTasks
  - Implement getDueToday
  - Implement getOverdueItems
  - Implement getProjectDashboard for project-specific metrics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Phase 3: Backend Routes


- [x] 12. Create Project Routes

  - Create `backend/src/routes/project.routes.js`
  - GET /api/projects - list with pagination
  - GET /api/projects/:id - single project
  - POST /api/projects - create project
  - PUT /api/projects/:id - update project
  - DELETE /api/projects/:id - delete project
  - GET /api/projects/:id/stats - project statistics
  - Add authentication middleware
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [x] 13. Create TaskList Routes


  - Create `backend/src/routes/taskList.routes.js`
  - GET /api/projects/:projectId/task-lists - list task lists
  - POST /api/projects/:projectId/task-lists - create task list
  - PUT /api/task-lists/:id - update task list
  - DELETE /api/task-lists/:id - delete task list
  - PUT /api/projects/:projectId/task-lists/reorder - reorder
  - Add authentication middleware
  - _Requirements: 2.3_



- [x] 14. Create Task Routes
  - Create `backend/src/routes/task.routes.js`
  - GET /api/tasks - list all tasks with pagination
  - GET /api/tasks/:id - single task
  - POST /api/tasks - create task
  - PUT /api/tasks/:id - update task
  - DELETE /api/tasks/:id - delete task
  - GET /api/projects/:projectId/tasks - tasks by project
  - GET /api/tasks/kanban - tasks grouped by status
  - Add authentication middleware
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_



- [x] 15. Create Bug Routes
  - Create `backend/src/routes/bug.routes.js`
  - GET /api/bugs - list all bugs with pagination
  - GET /api/bugs/:id - single bug
  - POST /api/bugs - create bug
  - PUT /api/bugs/:id - update bug
  - DELETE /api/bugs/:id - delete bug
  - GET /api/projects/:projectId/bugs - bugs by project
  - GET /api/bugs/kanban - bugs grouped by status
  - Add authentication middleware
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_



- [x] 16. Create TimeLog Routes
  - Create `backend/src/routes/timeLog.routes.js`
  - GET /api/timelogs - list all time logs with pagination
  - GET /api/timelogs/:id - single time log
  - POST /api/timelogs - create time log
  - PUT /api/timelogs/:id - update time log
  - DELETE /api/timelogs/:id - delete time log
  - PATCH /api/timelogs/:id/approve - approve time log
  - PATCH /api/timelogs/:id/reject - reject time log
  - GET /api/timelogs/aggregates - get aggregated hours
  - Add authentication middleware


  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 17. Create Dashboard Routes
  - Create `backend/src/routes/projectDashboard.routes.js`
  - GET /api/project-dashboard/stats - overall statistics
  - GET /api/project-dashboard/my-tasks - user's tasks
  - GET /api/project-dashboard/due-today - items due today
  - GET /api/project-dashboard/overdue - overdue items
  - GET /api/projects/:id/dashboard - project-specific dashboard
  - Add authentication middleware

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 18. Register Routes in App

  - Update `backend/src/app.js` to include all new routes
  - Add route prefixes for project management module
  - _Requirements: All_

## Phase 4: Frontend API Services


- [x] 19. Create Project Management API Services

  - Update `src/api/services.ts` with projectServices
  - Add methods for all project CRUD operations
  - Add methods for task list operations
  - Add methods for task CRUD operations
  - Add methods for bug CRUD operations
  - Add methods for time log operations
  - Add methods for dashboard data
  - _Requirements: All_

## Phase 5: Frontend Shared Components

- [x] 20. Create Status Badge Component


  - Create `src/components/project-management/StatusBadge.tsx`
  - Support task, bug, and time log statuses
  - Color coding based on status type
  - _Requirements: 2.6, 3.4, 4.4_


- [x] 21. Create Priority Badge Component

  - Create `src/components/project-management/PriorityBadge.tsx`
  - Support None, Low, Medium, High, Urgent priorities
  - Color coding based on priority level
  - _Requirements: 2.5_


- [x] 22. Create View Toggle Component

  - Create `src/components/project-management/ViewToggle.tsx`
  - Toggle between List, Kanban, and Card views
  - Persist view preference in localStorage
  - _Requirements: 2.6, 3.6_


- [x] 23. Create Kanban Board Component

  - Create `src/components/project-management/KanbanBoard.tsx`
  - Drag-and-drop columns using @dnd-kit
  - Card component for items
  - Column headers with counts
  - Support for tasks and bugs
  - _Requirements: 2.6, 3.6_


- [x] 24. Create Infinite Scroll Hook

  - Create `src/hooks/useInfiniteScroll.ts`
  - Intersection Observer based scroll detection
  - Loading state management
  - Integration with TanStack Query infinite queries
  - _Requirements: 1.3, 2.2, 3.1, 4.1_

## Phase 6: Frontend Pages - Projects


- [x] 25. Create Project List Page

  - Create `src/pages/company/project_management/ProjectList.tsx`
  - List view with infinite scroll
  - Card view option for projects
  - Project cards showing: title, owner, status, progress, task/bug counts
  - Filter by status, owner, date range
  - Search by project name
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 26. Create Project Dialog Component


  - Create `src/components/project-management/ProjectDialog.tsx`
  - Form for creating/editing projects
  - Fields: title, description, owner, team members, dates, visibility, tags
  - Owner selection from company users
  - Date pickers for start/end dates
  - _Requirements: 1.4, 1.5_

## Phase 7: Frontend Pages - Tasks


- [x] 27. Create Task List Page



  - Create `src/pages/company/project_management/TaskList.tsx`
  - List view with infinite scroll
  - Kanban view grouped by status
  - Task rows showing: ID, name, project, assignee, status, priority, due date
  - Filter by project, status, priority, assignee
  - Search by task name
  - _Requirements: 2.1, 2.2, 2.6_


- [x] 28. Create Task Dialog Component
  - Create `src/components/project-management/TaskDialog.tsx`
  - Form for creating/editing tasks
  - Project selection dropdown
  - Task list selection (filtered by project)
  - Fields: name, description, assignee, dates, priority, status, work hours
  - _Requirements: 2.4, 2.5_

- [x] 29. Create TaskList Dialog Component


  - Create `src/components/project-management/TaskListDialog.tsx`
  - Form for creating/editing task lists
  - Project selection
  - Fields: name, description
  - _Requirements: 2.3_

## Phase 8: Frontend Pages - Bugs


- [x] 30. Create Bug List Page
  - Create `src/pages/company/project_management/BugList.tsx`
  - List view with infinite scroll
  - Kanban view grouped by status
  - Bug rows showing: ID, title, project, reporter, assignee, status, severity
  - Filter by project, status, severity, assignee
  - Search by bug title

  - _Requirements: 3.1, 3.4, 3.6_

- [x] 31. Create Bug Dialog Component
  - Create `src/components/project-management/BugDialog.tsx`
  - Form for creating/editing bugs
  - Project selection dropdown
  - Fields: title, description, assignee, severity, classification, module, reproducible, due date, tags
  - _Requirements: 3.2, 3.3_


## Phase 9: Frontend Pages - Time Logs

- [x] 32. Create TimeLog List Page
  - Create `src/pages/company/project_management/TimeLogList.tsx`
  - List view with infinite scroll
  - Date range filter
  - Time log rows showing: title, project, task/bug, hours, time period, user, billing type, approval status
  - Aggregated billable/non-billable hours display
  - Approval actions for super_admin
  - _Requirements: 4.1, 4.4, 4.5, 4.6_



- [x] 33. Create TimeLog Dialog Component
  - Create `src/components/project-management/TimeLogDialog.tsx`
  - Form for creating/editing time logs
  - Project selection dropdown
  - Task/Bug selection (filtered by project)
  - Fields: date, hours, time period, billing type, notes
  - _Requirements: 4.2, 4.3_

## Phase 10: Frontend Pages - Dashboard

- [x] 34. Create Project Management Dashboard


  - Create `src/pages/company/project_management/Dashboard.tsx`
  - Summary cards: Open Tasks, Closed Tasks, Open Bugs, Closed Bugs, Milestones
  - My Tasks section with task list
  - Work Items Due Today section
  - Overdue Items section with days overdue indicator
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 35. Create Project Detail Dashboard


  - Create `src/pages/company/project_management/ProjectDashboard.tsx`
  - Project-specific metrics
  - Task completion percentage chart
  - Bug resolution rate
  - Time log summaries
  - Team performance metrics
  - _Requirements: 5.4, 5.5_

## Phase 11: App Integration

- [x] 36. Update App Routes


  - Update `src/App.tsx` with new routes
  - Add routes for: /company/project_list, /company/task_list, /company/bug_list, /company/timelog_list
  - Add route for project dashboard: /company/project/:id/dashboard
  - Add ProtectedRoute wrappers with requiredModule="project_management"
  - _Requirements: All_

- [x] 37. Update Navigation


  - Update `src/components/layout/DashboardLayout.tsx`
  - Ensure Project Management menu items are properly configured
  - Add icons for each sub-menu item
  - _Requirements: All_

## Phase 12: Final Polish

- [x] 38. Add Loading States and Skeletons


  - Add skeleton loaders for all list pages
  - Add loading spinners for actions
  - Add empty state components
  - _Requirements: All_

- [x] 39. Add Toast Notifications

  - Add success/error toasts for all CRUD operations
  - Add confirmation dialogs for delete actions
  - _Requirements: All_


- [x] 40. Responsive Design Polish

  - Ensure all pages work on mobile
  - Adjust kanban board for mobile (horizontal scroll)
  - Optimize card layouts for different screen sizes
  - _Requirements: All_
