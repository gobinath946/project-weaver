# API Endpoints Reference - Project Overview Feature

## Overview
This document lists all API endpoints used by the Project Overview feature, including request/response formats and authentication requirements.

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Get User Projects
**Endpoint:** `GET /api/project-overview/user-projects`

**Description:** Returns all projects assigned to the logged-in user

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "project_id",
      "title": "Project Name",
      "project_id": "PROJ-001",
      "description": "Project description",
      "status": "Active",
      "visibility": "Private",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "progress": 45,
      "owner": {
        "_id": "user_id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "team_members": [...],
      "allocated_users": [...],
      "project_group": {
        "_id": "group_id",
        "name": "Group Name",
        "color": "#6366f1"
      },
      "user_stats": {
        "total_tasks": 10,
        "completed_tasks": 4,
        "total_bugs": 5,
        "closed_bugs": 2
      }
    }
  ]
}
```

**Used In:** ProjectOverview.tsx (main project list)

---

### 2. Get User Statistics
**Endpoint:** `GET /api/project-overview/user-stats`

**Description:** Returns overall statistics for the user across all projects

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "total_projects": 5,
    "total_tasks": 25,
    "completed_tasks": 15,
    "open_tasks": 10,
    "total_bugs": 8,
    "closed_bugs": 3,
    "open_bugs": 5,
    "total_time_logged": 120.5,
    "task_completion_rate": 60,
    "bug_resolution_rate": 38
  }
}
```

**Used In:** ProjectOverview.tsx (summary statistics cards)

---

### 3. Get User Tasks
**Endpoint:** `GET /api/project-overview/user-tasks`

**Description:** Returns tasks assigned to the user, optionally filtered by project

**Query Parameters:**
- `project_id` (optional): Filter tasks by project ID
- `status` (optional): Filter by task status
- `priority` (optional): Filter by priority
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Items per page

**Example Request:**
```
GET /api/project-overview/user-tasks?project_id=123&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "task_id",
      "name": "Task Name",
      "description": "Task description",
      "status": "In Progress",
      "priority": "High",
      "due_date": "2024-12-31T00:00:00.000Z",
      "project_id": {
        "_id": "project_id",
        "title": "Project Name",
        "project_id": "PROJ-001"
      },
      "assignee": {
        "_id": "user_id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "owner": {...}
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_count": 25,
    "per_page": 20
  }
}
```

**Used In:** ProjectOverview.tsx (tasks tab)

---

### 4. Get User Bugs
**Endpoint:** `GET /api/project-overview/user-bugs`

**Description:** Returns bugs assigned to the user, optionally filtered by project

**Query Parameters:**
- `project_id` (optional): Filter bugs by project ID
- `status` (optional): Filter by bug status
- `severity` (optional): Filter by severity
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Items per page

**Example Request:**
```
GET /api/project-overview/user-bugs?project_id=123&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "bug_id",
      "title": "Bug Title",
      "description": "Bug description",
      "status": "Open",
      "severity": "Critical",
      "due_date": "2024-12-31T00:00:00.000Z",
      "project_id": {
        "_id": "project_id",
        "title": "Project Name",
        "project_id": "PROJ-001"
      },
      "assignee": {
        "_id": "user_id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "reporter": {...}
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_count": 8,
    "per_page": 20
  }
}
```

**Used In:** ProjectOverview.tsx (bugs tab)

---

### 5. Get Project Overview
**Endpoint:** `GET /api/project-overview/project/:id`

**Description:** Returns detailed overview of a specific project for the user

**URL Parameters:**
- `id` (required): Project ID

**Example Request:**
```
GET /api/project-overview/project/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "project_id",
      "title": "Project Name",
      "project_id": "PROJ-001",
      "description": "Project description",
      "status": "Active",
      "visibility": "Private",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "progress": 45,
      "owner": {
        "_id": "user_id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "team_members": [...],
      "allocated_users": [...],
      "project_group": {
        "_id": "group_id",
        "name": "Group Name",
        "color": "#6366f1"
      }
    },
    "user_tasks": [
      {
        "_id": "task_id",
        "name": "Task Name",
        "description": "Task description",
        "status": "In Progress",
        "priority": "High",
        "due_date": "2024-12-31T00:00:00.000Z",
        "assignee": {...}
      }
    ],
    "user_bugs": [
      {
        "_id": "bug_id",
        "title": "Bug Title",
        "description": "Bug description",
        "status": "Open",
        "severity": "Critical",
        "due_date": "2024-12-31T00:00:00.000Z",
        "assignee": {...}
      }
    ],
    "user_time_logs": [
      {
        "_id": "log_id",
        "description": "Work description",
        "log_date": "2024-12-01T00:00:00.000Z",
        "hours": 8,
        "is_billable": true,
        "status": "Approved"
      }
    ],
    "task_breakdown": [
      {
        "_id": "In Progress",
        "count": 5
      },
      {
        "_id": "Completed",
        "count": 3
      }
    ],
    "bug_breakdown": [
      {
        "_id": "Open",
        "count": 4
      },
      {
        "_id": "Closed",
        "count": 2
      }
    ]
  }
}
```

**Used In:** MyProjectDetail.tsx (all tabs)

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Project not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching data"
}
```

---

## Data Filtering Logic

### Projects
User can see projects where they are:
- `owner`
- In `team_members` array
- In `allocated_users` array
- `created_by` user

### Tasks
User can see tasks where they are:
- `assignee`
- `owner`

### Bugs
User can see bugs where they are:
- `assignee`
- `reporter`

### Time Logs
User can only see their own time logs where:
- `user_id` matches logged-in user

---

## Frontend Service Methods

All API calls are made through the `projectServices` object in `src/api/services.ts`:

```typescript
// Get user's projects
projectServices.getUserProjects()

// Get user statistics
projectServices.getUserStats()

// Get user tasks (with optional filters)
projectServices.getUserTasks({ project_id: "123" })

// Get user bugs (with optional filters)
projectServices.getUserBugs({ project_id: "123" })

// Get project overview
projectServices.getProjectOverview("project_id")
```

---

## Rate Limiting

Currently, no rate limiting is applied to these endpoints. Consider implementing rate limiting in production:

```javascript
// Example rate limit configuration
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}
```

---

## Caching Recommendations

For better performance, consider implementing caching:

1. **Client-side caching** (React Query):
   - Already implemented with `staleTime` and `cacheTime`
   - Default cache time: 5 minutes

2. **Server-side caching** (Redis):
   - Cache user statistics for 5 minutes
   - Cache project lists for 2 minutes
   - Invalidate cache on data updates

---

## Performance Considerations

1. **Pagination**: All list endpoints support pagination to limit data transfer
2. **Selective Population**: Only necessary fields are populated in responses
3. **Aggregation**: Statistics are calculated using MongoDB aggregation for efficiency
4. **Indexing**: Ensure proper indexes on:
   - `project_id.company_id`
   - `project_id.owner`
   - `project_id.team_members`
   - `project_id.allocated_users`
   - `task.assignee`
   - `task.owner`
   - `bug.assignee`
   - `bug.reporter`
   - `timelog.user_id`

---

## Security Notes

1. All endpoints require authentication
2. Data is automatically filtered by company_id
3. Users can only access their own data
4. No sensitive information is exposed in responses
5. Input validation is performed on all parameters
6. MongoDB injection protection is enabled
7. XSS protection is enabled
