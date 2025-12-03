// Project Status Enum
export const PROJECT_STATUS = [
  'Active',
  'In Progress',
  'On Track',
  'Delayed',
  'In Testing',
  'On Hold',
  'Approved',
  'Cancelled',
  'Planning',
  'Completed',
  'Invoiced',
  'Yet to Start',
  'Compl Yet to Mov',
  'Waiting for Live Input'
] as const;

export type ProjectStatus = typeof PROJECT_STATUS[number];

// Status colors for badges and kanban
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Active': { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' },
  'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' },
  'On Track': { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500' },
  'Delayed': { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' },
  'In Testing': { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500' },
  'On Hold': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500' },
  'Approved': { bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500' },
  'Cancelled': { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500' },
  'Planning': { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500' },
  'Completed': { bg: 'bg-green-600/20', text: 'text-green-600', border: 'border-green-600' },
  'Invoiced': { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500' },
  'Yet to Start': { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' },
  'Compl Yet to Mov': { bg: 'bg-lime-500/20', text: 'text-lime-500', border: 'border-lime-500' },
  'Waiting for Live Input': { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500' }
};

// Project visibility options
export const PROJECT_VISIBILITY = ['Private', 'Public'] as const;
export type ProjectVisibility = typeof PROJECT_VISIBILITY[number];

// Tab definitions
export const PROJECT_TABS = [
  { id: 'active', label: 'Active Projects' },
  { id: 'groups', label: 'Project Groups' },
  { id: 'public', label: 'Public Projects' },
  { id: 'completed', label: 'Completed Projects' }
] as const;

export type ProjectTab = typeof PROJECT_TABS[number]['id'];
