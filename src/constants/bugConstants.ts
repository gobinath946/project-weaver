// Bug Status Enum
export const BUG_STATUS = [
  'Open',
  'In progress',
  'Unit Testing',
  'Moved to Testing',
  'Testing in Progress',
  'Ready for UAT',
  'Ready for Production',
  'Pending Customer Response',
  'Pending Int. Resp',
  'After Production',
  'On Hold',
  'Closed'
] as const;

export type BugStatus = typeof BUG_STATUS[number];

// Bug Status Colors
export const BUG_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Open': { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500' },
  'In progress': { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500' },
  'Unit Testing': { bg: 'bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-500' },
  'Moved to Testing': { bg: 'bg-indigo-500/20', text: 'text-indigo-500', border: 'border-indigo-500' },
  'Testing in Progress': { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500' },
  'Ready for UAT': { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500' },
  'Ready for Production': { bg: 'bg-cyan-500/20', text: 'text-cyan-500', border: 'border-cyan-500' },
  'Pending Customer Response': { bg: 'bg-pink-500/20', text: 'text-pink-500', border: 'border-pink-500' },
  'Pending Int. Resp': { bg: 'bg-rose-500/20', text: 'text-rose-500', border: 'border-rose-500' },
  'After Production': { bg: 'bg-teal-500/20', text: 'text-teal-500', border: 'border-teal-500' },
  'On Hold': { bg: 'bg-gray-500/20', text: 'text-gray-500', border: 'border-gray-500' },
  'Closed': { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500' }
};

// Bug Severity
export const BUG_SEVERITY = [
  'None',
  'Show Stopper',
  'Critical',
  'Major',
  'Minor'
] as const;

export type BugSeverity = typeof BUG_SEVERITY[number];

// Bug Severity Colors
export const BUG_SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  'None': { bg: 'bg-gray-500/20', text: 'text-gray-500' },
  'Show Stopper': { bg: 'bg-red-600/20', text: 'text-red-600' },
  'Critical': { bg: 'bg-red-500/20', text: 'text-red-500' },
  'Major': { bg: 'bg-orange-500/20', text: 'text-orange-500' },
  'Minor': { bg: 'bg-yellow-500/20', text: 'text-yellow-500' }
};

// Bug Classification
export const BUG_CLASSIFICATION = [
  'None',
  'Security',
  'Crash/Hang',
  'Data loss',
  'Performance',
  'UI/Usability',
  'Other bug',
  'Feature(New)',
  'Enhancement',
  'Functional Bug',
  'Technical Bug',
  'Requirement Not Covered',
  'Requirement Not Clear',
  'Integrating Issue'
] as const;

export type BugClassification = typeof BUG_CLASSIFICATION[number];

// Bug Reproducible
export const BUG_REPRODUCIBLE = [
  'None',
  'Always',
  'Sometimes',
  'Rarely',
  'Not Applicable'
] as const;

export type BugReproducible = typeof BUG_REPRODUCIBLE[number];

// Bug Flag
export const BUG_FLAG = [
  'Internal',
  'External'
] as const;

export type BugFlag = typeof BUG_FLAG[number];

// Group By Options
export const BUG_GROUP_BY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'project', label: 'Project' }
] as const;
