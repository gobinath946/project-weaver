import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowDown, ArrowUp, Minus, Zap } from "lucide-react";

interface PriorityBadgeProps {
  priority: string;
  showIcon?: boolean;
  className?: string;
}

const priorityConfig: Record<string, { color: string; icon: any }> = {
  "None": { 
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: Minus
  },
  "Low": { 
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: ArrowDown
  },
  "Medium": { 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Minus
  },
  "High": { 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: ArrowUp
  },
  "Urgent": { 
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: Zap
  },
};

export const PriorityBadge = ({ priority, showIcon = true, className }: PriorityBadgeProps) => {
  const config = priorityConfig[priority] || priorityConfig["None"];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium text-xs px-2 py-0.5 border inline-flex items-center gap-1",
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {priority}
    </Badge>
  );
};

// Severity Badge for Bugs
interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

const severityConfig: Record<string, { color: string; icon: any }> = {
  "None": { 
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: Minus
  },
  "Minor": { 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: ArrowDown
  },
  "Major": { 
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: AlertTriangle
  },
  "Critical": { 
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: AlertTriangle
  },
  "Blocker": { 
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: Zap
  },
};

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const config = severityConfig[severity] || severityConfig["None"];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium text-xs px-2 py-0.5 border inline-flex items-center gap-1",
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {severity}
    </Badge>
  );
};

export default PriorityBadge;
