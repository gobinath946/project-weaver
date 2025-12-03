import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "task" | "bug" | "timelog" | "project";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const statusColors: Record<string, string> = {
  // Task statuses
  "Not Started": "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Completed": "bg-green-500/20 text-green-400 border-green-500/30",
  "On Hold": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Cancelled": "bg-red-500/20 text-red-400 border-red-500/30",
  
  // Bug statuses
  "Open": "bg-red-500/20 text-red-400 border-red-500/30",
  "Testing": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Moved to UAT": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Ready for Production": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Closed": "bg-green-500/20 text-green-400 border-green-500/30",
  "Reopen": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  
  // Time log statuses
  "Pending": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Approved": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Rejected": "bg-red-500/20 text-red-400 border-red-500/30",
  
  // Project statuses - Extended
  "Active": "bg-green-500/20 text-green-400 border-green-500/30",
  "On Track": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Delayed": "bg-red-500/20 text-red-400 border-red-500/30",
  "In Testing": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Planning": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Invoiced": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Yet to Start": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Compl Yet to Mov": "bg-lime-500/20 text-lime-400 border-lime-500/30",
  "Waiting for Live Input": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Archived": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const StatusBadge = ({ status, type, className }: StatusBadgeProps) => {
  const colorClass = statusColors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium text-xs px-2 py-0.5 border",
        colorClass,
        className
      )}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;
