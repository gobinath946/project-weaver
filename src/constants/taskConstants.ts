// Task Status Enum
export const TASK_STATUS = [
  '1-Dev/Open',
  '1-Dev/Appd Task',
  '1-Dev/In Progrs',
  '1-Dev/Unit Tstg',
  '2-TSTG/Mvd to Tstg',
  '2-TSTG/Tstg In Progrs',
  '1-Dev/Bug Escltd',
  'On Hold',
  '2-Tstg/Rdy for UAT',
  '2-Tstg/Mvd to UAT',
  '2-Tstg/Rdy for Prod',
  'Closed',
  'Wtg for Lv Inpt',
  'Pdg Int. Resp',
  'Pdg Cust. Resp',
  'Recurring task',
  'Yet to St',
  'Ideation',
  '2-ATM/Feasibility',
  'Planned',
  'Creation',
  'To Review',
  'Resolved'
] as const;

export type TaskStatus = typeof TASK_STATUS[number];

// Task Status Colors
export const TASK_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1-Dev/Open': { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' },
  '1-Dev/Appd Task': { bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500' },
  '1-Dev/In Progrs': { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' },
  '1-Dev/Unit Tstg': { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500' },
  '2-TSTG/Mvd to Tstg': { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500' },
  '2-TSTG/Tstg In Progrs': { bg: 'bg-violet-500/20', text: 'text-violet-500', border: 'border-violet-500' },
  '1-Dev/Bug Escltd': { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' },
  'On Hold': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500' },
  '2-Tstg/Rdy for UAT': { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500' },
  '2-Tstg/Mvd to UAT': { bg: 'bg-sky-500/20', text: 'text-sky-500', border: 'border-sky-500' },
  '2-Tstg/Rdy for Prod': { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500' },
  'Closed': { bg: 'bg-green-600/20', text: 'text-green-600', border: 'border-green-600' },
  'Wtg for Lv Inpt': { bg: 'bg-amber-500/20', text: 'text-amber-500', border: 'border-amber-500' },
  'Pdg Int. Resp': { bg: 'bg-rose-500/20', text: 'text-rose-500', border: 'border-rose-500' },
  'Pdg Cust. Resp': { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500' },
  'Recurring task': { bg: 'bg-lime-500/20', text: 'text-lime-500', border: 'border-lime-500' },
  'Yet to St': { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500' },
  'Ideation': { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-500', border: 'border-fuchsia-500' },
  '2-ATM/Feasibility': { bg: 'bg-slate-500/20', text: 'text-slate-500', border: 'border-slate-500' },
  'Planned': { bg: 'bg-blue-400/20', text: 'text-blue-400', border: 'border-blue-400' },
  'Creation': { bg: 'bg-orange-400/20', text: 'text-orange-400', border: 'border-orange-400' },
  'To Review': { bg: 'bg-purple-400/20', text: 'text-purple-400', border: 'border-purple-400' },
  'Resolved': { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' }
};

// Priority options
export const TASK_PRIORITY = ['None', 'Low', 'Medium', 'High', 'Urgent'] as const;
export type TaskPriority = typeof TASK_PRIORITY[number];

// Billing Type options
export const BILLING_TYPE = ['None', 'Billable', 'Non-Billable'] as const;
export type BillingType = typeof BILLING_TYPE[number];

// Reminder options
export const REMINDER_OPTIONS = ['None', '1 Day Before', '2 Days Before', '1 Week Before'] as const;

// Time span options for filtering
export const TIME_SPAN_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'next_month', label: 'Next Month' },
  { value: 'next_30_days', label: 'Next 30 Days' },
  { value: 'custom', label: 'Custom Date Range' }
] as const;

// Task List Flag options
export const TASK_LIST_FLAG = ['Internal', 'External', 'None'] as const;

// Work Hours Type
export const WORK_HOURS_TYPE = ['Standard', 'Flexible'] as const;

// Group By options
export const GROUP_BY_OPTIONS = [
  { value: 'task_list', label: 'Task List' },
  { value: 'project', label: 'Projects' }
] as const;
