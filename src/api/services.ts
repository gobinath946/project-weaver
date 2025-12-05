import apiClient from "./axios";

// Auth Services
export const authServices = {
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/login", { email, password }),

  registerCompany: (data: any) =>
    apiClient.post("/api/auth/register-company", data),

  getMe: () => apiClient.get("/api/auth/me"),

  getCurrentUserPermissions: (module_name?: string) => 
    apiClient.get("/api/auth/me/permissions", { 
      params: module_name ? { module_name } : {} 
    }),

  getCurrentUserModule: () => apiClient.get("/api/auth/me/module"),
};

// Subscription Services
export const subscriptionServices = {
  getPricingConfig: () => apiClient.get("/api/subscription/pricing-config"),

  calculatePrice: (data: any) =>
    apiClient.post("/api/subscription/calculate-price", data),

  createSubscription: (data: any) =>
    apiClient.post("/api/subscription/create", data),

  updatePaymentStatus: (subscriptionId: string, data: any) =>
    apiClient.patch(`/api/subscription/${subscriptionId}/payment-status`, data),

  getCurrentSubscription: () => apiClient.get("/api/subscription/current"),

  getSubscriptionHistory: (currentPage, limit) => {
    return apiClient.get(`api/subscription/history?page=${currentPage}&limit=${limit}`);
  },

  getCompanySubscriptionInfo: () =>
    apiClient.get("/api/subscription/company-info"),

  // Invoice Services
  getInvoices: (params = {}) => apiClient.get("/api/invoices", { params }),

  getInvoice: (invoiceId) => apiClient.get(`/api/invoices/${invoiceId}`),

  getInvoiceStats: () => apiClient.get("/api/invoices/stats"),

  updateInvoicePaymentStatus: (invoiceId, data) =>
    apiClient.patch(`/api/invoices/${invoiceId}/payment-status`, data),
};

// Master Admin Services
export const masterServices = {
  // Dashboard
  getDashboardStats: () => apiClient.get("/api/master/dashboard"),

  // Companies
  getCompanies: (params?: any) =>
    apiClient.get("/api/master/companies", { params }),

  getCompany: (id: string) => apiClient.get(`/api/master/companies/${id}`),

  updateCompany: (id: string, data: any) =>
    apiClient.put(`/api/master/companies/${id}`, data),

  deleteCompany: (id: string) =>
    apiClient.delete(`/api/master/companies/${id}`),

  toggleCompanyStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/companies/${id}/status`, data),

  // Plans
  getPlans: () => apiClient.get("/api/subscription/pricing-config"),

  createPlan: (data: any) => apiClient.post("/api/master/plans", data),

  updatePlan: (id: string, data: any) =>
    apiClient.put(`/api/master/plans/${id}`, data),

  deletePlan: (id: string) => apiClient.delete(`/api/master/plans/${id}`),

  getDropdowns: (params?: any) =>
    apiClient.get("api/master/dropdowns", { params }),

  getMasterdropdownvalues: (data: any) =>
    apiClient.post("api/master/dropdowns/dropdown_values", data),

  // Permissions
  getPermissions: (params?: any) =>
    apiClient.get("/api/master/permissions", { params }),

  getPermission: (id: string) => apiClient.get(`/api/master/permissions/${id}`),

  createPermission: (data: any) =>
    apiClient.post("/api/master/permissions", data),

  updatePermission: (id: string, data: any) =>
    apiClient.put(`/api/master/permissions/${id}`, data),

  deletePermission: (id: string) =>
    apiClient.delete(`/api/master/permissions/${id}`),

  togglePermissionStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/permissions/${id}/status`, data),

  // Settings
  updateProfile: (data: any) => apiClient.put("/api/master/profile", data),

  updateSmtpSettings: (data: any) =>
    apiClient.put("/api/master/smtp-settings", data),

  testSmtp: (data: any) => apiClient.post("/api/master/test-smtp", data),

  // Payment Settings
  updatePaymentSettings: (data: any) =>
    apiClient.put("/api/master/payment-settings", data),

  getPaymentSettings: () => apiClient.get("/api/master/payment-settings"),

  // Maintenance Settings
  getMaintenanceSettings: () => apiClient.get("/api/master/maintenance"),

  updateMaintenanceSettings: (data: any) =>
    apiClient.put("/api/master/maintenance", data),

  // Public maintenance settings (no auth required)
  getPublicMaintenanceSettings: () =>
    apiClient.get("/api/master/maintenance/public"),
};

// Custom Module Services
export const customModuleServices = {
  getCustomModuleConfigs: (params?: any) =>
    apiClient.get("/api/master/custom-modules", { params }),

  getCustomModuleConfig: (id: string) =>
    apiClient.get(`/api/master/custom-modules/${id}`),

  getCustomModuleConfigByCompany: (companyId: string) =>
    apiClient.get(`/api/master/custom-modules/company/${companyId}`),

  createCustomModuleConfig: (data: any) =>
    apiClient.post("/api/master/custom-modules", data),

  updateCustomModuleConfig: (id: string, data: any) =>
    apiClient.put(`/api/master/custom-modules/${id}`, data),

  deleteCustomModuleConfig: (id: string) =>
    apiClient.delete(`/api/master/custom-modules/${id}`),

  toggleCustomModuleConfigStatus: (id: string, data: any) =>
    apiClient.patch(`/api/master/custom-modules/${id}/status`, data),

  getCompaniesWithoutConfig: () =>
    apiClient.get("/api/master/custom-modules/companies-without-config"),
};

export const masterDropdownServices = {
  getMasterDropdowns: (params?: any) =>
    apiClient.get("/api/master/dropdowns", { params }),

  createMasterDropdown: (data: any) =>
    apiClient.post("/api/master/dropdowns", data),

  updateMasterDropdown: (id: string, data: any) =>
    apiClient.put(`/api/master/dropdowns/${id}`, data),

  deleteMasterDropdown: (id: string) =>
    apiClient.delete(`/api/master/dropdowns/${id}`),

  addMasterValue: (dropdownId: string, data: any) =>
    apiClient.post(`/api/master/dropdowns/${dropdownId}/values`, data),

  updateMasterValue: (dropdownId: string, valueId: string, data: any) =>
    apiClient.put(
      `/api/master/dropdowns/${dropdownId}/values/${valueId}`,
      data
    ),

  deleteMasterValue: (dropdownId: string, valueId: string) =>
    apiClient.delete(`/api/master/dropdowns/${dropdownId}/values/${valueId}`),

  reorderMasterValues: (dropdownId: string, data: any) =>
    apiClient.put(`/api/master/dropdowns/${dropdownId}/reorder/values`, data),
};

// Company Services
export const companyServices = { 

  getMasterdropdownvalues: (data: any) =>
    apiClient.post("api/company/company/dropdowns/dropdown_values", data),

  getCompanyMasterdropdownvalues: (data: any) =>
    apiClient.post(
      "api/company/company_dropdowns/dropdowns/dropdown_values",
      data
    ),

  getUserStats: (params?: any) =>
    apiClient.get("/api/company/dashboard/users", { params }),


  // Users
  getUsers: (params?: any) => apiClient.get("/api/company/users", { params }),

  createUser: (data: any) => apiClient.post("/api/company/users", data),

  updateUser: (id: string, data: any) =>
    apiClient.put(`/api/company/users/${id}`, data),

  deleteUser: (id: string) => apiClient.delete(`/api/company/users/${id}`),

  toggleUserStatus: (id: string, data: any) =>
    apiClient.patch(`/api/company/users/${id}/status`, data),

  getCompanyMetaData: (type, params = {}) =>
    apiClient.get("/api/company/company/meta-data", {
      params: { type, ...params },
    }),

  sendWelcomeEmail: (id: string) =>
    apiClient.post(`/api/company/users/${id}/send-welcome`),

  // Permissions
  getAvailablePermissions: () =>
    apiClient.get("/api/company/permissions/available"),

  getUsersWithPermissions: (params?: any) =>
    apiClient.get("/api/company/users-permissions", { params }),

  getUserPermissions: (userId: string) =>
    apiClient.get(`/api/company/users/${userId}/permissions`),

  updateUserPermissions: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/permissions`, data),

  // Module Access
  getUserModules: (userId: string) =>
    apiClient.get(`/api/company/users/${userId}/modules`),

  updateUserModules: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/modules`, data),

  // Group Permissions
  getGroupPermissions: (params?: any) =>
    apiClient.get("/api/company/group-permissions", { params }),

  getGroupPermission: (id: string) =>
    apiClient.get(`/api/company/group-permissions/${id}`),

  createGroupPermission: (data: any) =>
    apiClient.post("/api/company/group-permissions", data),

  updateGroupPermission: (id: string, data: any) =>
    apiClient.put(`/api/company/group-permissions/${id}`, data),

  deleteGroupPermission: (id: string) =>
    apiClient.delete(`/api/company/group-permissions/${id}`),

  assignGroupPermissionToUser: (userId: string, data: any) =>
    apiClient.put(`/api/company/users/${userId}/group-permission`, data),

  // Settings
  getS3Config: () => apiClient.get("/api/company/settings/s3"),

  updateS3Config: (data: any) =>
    apiClient.put("/api/company/settings/s3", data),

  getCallbackConfig: () => apiClient.get("/api/company/settings/callback"),

  updateCallbackConfig: (data: any) =>
    apiClient.put("/api/company/settings/callback", data),

  getBillingInfo: () => apiClient.get("/api/company/settings/billing"),

  testS3Connection: (data: any) =>
    apiClient.post("/api/company/settings/test-s3", data),

  testWebhook: (data: any) =>
    apiClient.post("/api/company/settings/test-webhook", data),

  // Company Info
  getCompanyInfo: () => apiClient.get("/api/company/info"),

  updateCompanyInfo: (data: any) => apiClient.put("/api/company/info", data),

  updateCompanyPassword: (data: any) =>
    apiClient.put("/api/company/password", data),

};



// Dropdown Services
export const dropdownServices = {
  getDropdowns: (params?: any) => apiClient.get("/api/dropdown", { params }),

  createDropdown: (data: any) => apiClient.post("/api/dropdown", data),

  updateDropdown: (id: string, data: any) =>
    apiClient.put(`/api/dropdown/${id}`, data),

  deleteDropdown: (id: string) => apiClient.delete(`/api/dropdown/${id}`),

  addValue: (dropdownId: string, data: any) =>
    apiClient.post(`/api/dropdown/${dropdownId}/values`, data),

  updateValue: (dropdownId: string, valueId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/values/${valueId}`, data),

  deleteValue: (dropdownId: string, valueId: string) =>
    apiClient.delete(`/api/dropdown/${dropdownId}/values/${valueId}`),

  reorderValues: (dropdownId: string, data: any) =>
    apiClient.put(`/api/dropdown/${dropdownId}/reorder/values`, data),
};

// Project Management Services
export const projectServices = {
  // Projects
  getProjects: (params?: any) => apiClient.get("/api/projects", { params }),
  getProjectsByTab: (tab: string, params?: any) => apiClient.get(`/api/projects/by-tab/${tab}`, { params }),
  getProjectsKanban: () => apiClient.get("/api/projects/kanban"),
  getProject: (id: string) => apiClient.get(`/api/projects/${id}`),
  createProject: (data: any) => apiClient.post("/api/projects", data),
  updateProject: (id: string, data: any) => apiClient.put(`/api/projects/${id}`, data),
  deleteProject: (id: string) => apiClient.delete(`/api/projects/${id}`),
  getProjectStats: (id: string) => apiClient.get(`/api/projects/${id}/stats`),
  getProjectUsers: () => apiClient.get("/api/projects/users"),
  getProjectStatuses: () => apiClient.get("/api/projects/statuses"),
  getProjectDashboard: (id: string) => apiClient.get(`/api/project-dashboard/projects/${id}/dashboard`),

  // Project Groups
  getProjectGroups: (params?: any) => apiClient.get("/api/projects/groups", { params }),
  getProjectGroup: (id: string) => apiClient.get(`/api/projects/groups/${id}`),
  createProjectGroup: (data: any) => apiClient.post("/api/projects/groups", data),
  updateProjectGroup: (id: string, data: any) => apiClient.put(`/api/projects/groups/${id}`, data),
  deleteProjectGroup: (id: string) => apiClient.delete(`/api/projects/groups/${id}`),

  // Task Lists
  getTaskLists: (projectId: string) => apiClient.get(`/api/projects/${projectId}/task-lists`),
  createTaskList: (projectId: string, data: any) => apiClient.post(`/api/projects/${projectId}/task-lists`, data),
  updateTaskList: (id: string, data: any) => apiClient.put(`/api/task-lists/${id}`, data),
  deleteTaskList: (id: string) => apiClient.delete(`/api/task-lists/${id}`),
  reorderTaskLists: (projectId: string, data: any) => apiClient.put(`/api/projects/${projectId}/task-lists/reorder`, data),

  // Tasks
  getTasks: (params?: any) => apiClient.get("/api/tasks", { params }),
  getTasksGrouped: (params?: any) => apiClient.get("/api/tasks/grouped", { params }),
  getTask: (id: string) => apiClient.get(`/api/tasks/${id}`),
  createTask: (data: any) => apiClient.post("/api/tasks", data),
  updateTask: (id: string, data: any) => apiClient.put(`/api/tasks/${id}`, data),
  deleteTask: (id: string) => apiClient.delete(`/api/tasks/${id}`),
  getTasksKanban: (params?: any) => apiClient.get("/api/tasks/kanban", { params }),
  getTasksByProject: (projectId: string, params?: any) => apiClient.get(`/api/tasks/projects/${projectId}/tasks`, { params }),
  getSubtasks: (taskId: string) => apiClient.get(`/api/tasks/${taskId}/subtasks`),
  getAllTaskLists: (params?: any) => apiClient.get("/api/task-lists", { params }),

  // Bugs
  getBugs: (params?: any) => apiClient.get("/api/bugs", { params }),
  getBugsGrouped: (params?: any) => apiClient.get("/api/bugs/grouped", { params }),
  getBug: (id: string) => apiClient.get(`/api/bugs/${id}`),
  createBug: (data: any) => apiClient.post("/api/bugs", data),
  updateBug: (id: string, data: any) => apiClient.put(`/api/bugs/${id}`, data),
  deleteBug: (id: string) => apiClient.delete(`/api/bugs/${id}`),
  getBugsKanban: (params?: any) => apiClient.get("/api/bugs/kanban", { params }),
  getBugsByProject: (projectId: string, params?: any) => apiClient.get(`/api/bugs/projects/${projectId}/bugs`, { params }),
  linkBug: (id: string, data: any) => apiClient.post(`/api/bugs/${id}/link`, data),
  associateBugTask: (id: string, data: any) => apiClient.post(`/api/bugs/${id}/associate-task`, data),

  // Time Logs
  getTimeLogs: (params?: any) => apiClient.get("/api/timelogs", { params }),
  getTimeLog: (id: string) => apiClient.get(`/api/timelogs/${id}`),
  createTimeLog: (data: any) => apiClient.post("/api/timelogs", data),
  updateTimeLog: (id: string, data: any) => apiClient.put(`/api/timelogs/${id}`, data),
  deleteTimeLog: (id: string) => apiClient.delete(`/api/timelogs/${id}`),
  approveTimeLog: (id: string) => apiClient.patch(`/api/timelogs/${id}/approve`),
  rejectTimeLog: (id: string, data?: any) => apiClient.patch(`/api/timelogs/${id}/reject`, data),
  getTimeLogAggregates: (params?: any) => apiClient.get("/api/timelogs/aggregates", { params }),

  // Dashboard
  getDashboardStats: () => apiClient.get("/api/project-dashboard/stats"),
  getMyTasks: (params?: any) => apiClient.get("/api/project-dashboard/my-tasks", { params }),
  getDueToday: () => apiClient.get("/api/project-dashboard/due-today"),
  getOverdueItems: () => apiClient.get("/api/project-dashboard/overdue"),
};

export const logServices = {
  // Get logs with optimized parameters and caching
  getLogs: (queryString: string) =>
    apiClient.get(`/api/logs?${queryString}`, {
      timeout: 30000, // 30 second timeout
    }),

  getDailyAnalytics: (queryString: string) =>
    apiClient.get(`/api/logs/analytics/daily?${queryString}`, {
      timeout: 15000, // 15 second timeout for daily analytics
    }),

  // Cached user and company lookups
  getLogUsers: (params?: any) =>
    apiClient.get("/api/logs/users", {
      params,
      timeout: 10000,
    }),

  getLogCompanies: (params?: any) =>
    apiClient.get("/api/logs/companies", {
      params,
      timeout: 10000,
    }),

  // Export with longer timeout and blob response
  exportLogs: (queryString: string) =>
    apiClient.get(`/api/logs/export?${queryString}`, {
      responseType: "blob",
      timeout: 300000, // 5 minute timeout for exports
      headers: {
        Accept: "text/csv",
      },
    }),

  // Get single log by ID
  getLogById: (id: string) =>
    apiClient.get(`/api/logs/${id}`, {
      timeout: 10000,
    }),
};


export default {
  auth: authServices,
  subscription: subscriptionServices,
  master: masterServices,
  company: companyServices,
  dropdown: dropdownServices,
  masterDropdown: masterDropdownServices,
  logs: logServices,
  custommodule: customModuleServices,
  project: projectServices,
};