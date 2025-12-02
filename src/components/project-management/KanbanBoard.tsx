import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge, SeverityBadge } from "./PriorityBadge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface KanbanItem {
  _id: string;
  task_id?: string;
  bug_id?: string;
  name?: string;
  title?: string;
  status: string;
  priority?: string;
  severity?: string;
  due_date?: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  project_id?: {
    title: string;
    project_id: string;
  };
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
  color: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  type: "task" | "bug";
  onItemClick?: (item: KanbanItem) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
}

const columnColors: Record<string, string> = {
  "Not Started": "border-t-gray-500",
  "In Progress": "border-t-blue-500",
  "On Hold": "border-t-orange-500",
  "Completed": "border-t-green-500",
  "Open": "border-t-red-500",
  "Testing": "border-t-yellow-500",
  "Moved to UAT": "border-t-purple-500",
  "Ready for Production": "border-t-cyan-500",
  "Closed": "border-t-green-500",
  "Reopen": "border-t-orange-500",
};

export const KanbanBoard = ({ columns, type, onItemClick, onStatusChange }: KanbanBoardProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div 
          key={column.id} 
          className="flex-shrink-0 w-80"
        >
          <Card className={cn("border-t-4", columnColors[column.title] || "border-t-gray-500")}>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {column.items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2 pr-2">
                  {column.items.map((item) => (
                    <KanbanCard 
                      key={item._id} 
                      item={item} 
                      type={type}
                      onClick={() => onItemClick?.(item)}
                    />
                  ))}
                  {column.items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No items
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

interface KanbanCardProps {
  item: KanbanItem;
  type: "task" | "bug";
  onClick?: () => void;
}

const KanbanCard = ({ item, type, onClick }: KanbanCardProps) => {
  const itemId = type === "task" ? item.task_id : item.bug_id;
  const itemName = type === "task" ? item.name : item.title;
  
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-muted-foreground font-mono">{itemId}</span>
          {type === "task" && item.priority && (
            <PriorityBadge priority={item.priority} showIcon={false} />
          )}
          {type === "bug" && item.severity && (
            <SeverityBadge severity={item.severity} />
          )}
        </div>
        
        <p className="text-sm font-medium line-clamp-2">{itemName}</p>
        
        {item.project_id && (
          <p className="text-xs text-muted-foreground truncate">
            {item.project_id.title}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-1">
          {item.assignee && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{item.assignee.first_name} {item.assignee.last_name?.charAt(0)}.</span>
            </div>
          )}
          {item.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(item.due_date), "MMM d")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanBoard;
