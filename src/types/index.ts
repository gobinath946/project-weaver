export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  companyId?: string;
  roles: string[];
  timezone: string;
  preferences: {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    digestFrequency: string;
  };
}

export interface Company {
  _id: string;
  name: string;
  domain?: string;
  logo?: string;
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  companyId: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  companyId: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  teamMembers: TeamMember[];
  progress?: number;
}

export interface TeamMember {
  userId: User;
  role: string;
  addedAt: string;
}

export interface Task {
  _id: string;
  name: string;
  description?: string;
  projectId: string | Project;
  assignees: User[];
  owner?: User;
  status: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  startDate?: string;
  dueDate?: string;
  completionPercentage: number;
  tags: string[];
  dependencies: Task[];
}

export interface Bug {
  _id: string;
  title: string;
  description?: string;
  projectId: string | Project;
  assignee?: User;
  reporter?: User;
  status: string;
  severity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  module?: string;
  classification?: string;
  completionPercentage: number;
}

export interface TimeLog {
  _id: string;
  userId: string;
  projectId: string | Project;
  taskId?: string | Task;
  bugId?: string | Bug;
  date: string;
  hours: number;
  billingType: 'Billable' | 'Non_Billable';
  notes?: string;
}

export interface Timesheet {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  projects: { total: number; active: number };
  tasks: { total: number; completed: number; pending: number };
  bugs: { total: number; open: number };
  timesheet: { weeklyHours: number; billableHours: number; nonBillableHours: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
