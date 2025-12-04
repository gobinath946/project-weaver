import { useMemo, useState, useRef, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { MoreVertical, Edit, Trash2, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { TASK_STATUS_COLORS } from "@/constants/taskConstants";
import { cn } from "@/lib/utils";

interface Task {
  _id: string;
  task_id: string;
  name: string;
  description?: string;
  project_id?: { _id: string; title: string; project_id: string };
  task_list_id?: { _id: string; name: string };
  owners?: { _id: string; first_name: string; last_name: string }[];
  current_owner?: { _id: string; first_name: string; last_name: string };
  assignee?: { _id: string; first_name: string; last_name: string };
  status: string;
  priority: string;
  start_date?: string;
  due_date?: string;
  duration?: string;
  completion_percentage: number;
  total_time_logged?: number;
  tags?: string[];
}

interface GroupedTasks {
  [key: string]: Task[] | { project: any; tasks: Task[] };
}

interface TaskListViewProps {
  tasks?: Task[];
  groupedTasks?: GroupedTasks;
  isLoading: boolean;
  groupBy?: 'task_list' | 'project' | 'none';
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView?: (task: Task) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isFetchingMore?: boolean;
}

const TaskListView = ({
  tasks = [],
  groupedTasks,
  isLoading,
  groupBy = 'none',
  onEdit,
  onDelete,
  onView,
  loadMoreRef,
  isFetchingMore,
}: TaskListViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize all groups as expanded
  useEffect(() => {
    if (groupedTasks) {
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(groupedTasks).forEach(key => {
        initialExpanded[key] = true;
      });
      setExpandedGroups(initialExpanded);
    }
  }, [groupedTasks]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const columns = useMemo(() => [
    { key: 'task_id', label: 'ID', fixed: true, width: 'w-28' },
    { key: 'name', label: 'Task Name', fixed: true, width: 'min-w-[250px]' },
    { key: 'project', label: 'Project', width: 'w-40' },
    { key: 'owner', label: 'Owner', width: 'w-44' },
    { key: 'status', label: 'Status', width: 'w-36' },
    { key: 'tags', label: 'Tags', width: 'w-32' },
    { key: 'start_date', label: 'Start Date', width: 'w-28' },
    { key: 'due_date', label: 'Due Date', width: 'w-28' },
    { key: 'duration', label: 'Duration', width: 'w-24' },
    { key: 'priority', label: 'Priority', width: 'w-24' },
    { key: 'completion', label: '% Complete', width: 'w-28' },
    { key: 'time_logged', label: 'Time Log', width: 'w-24' },
  ], []);

  const formatTimeLogged = (minutes?: number) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const renderCellContent = (task: Task, key: string) => {
    switch (key) {
      case 'task_id':
        return <span className="font-mono text-xs text-muted-foreground">{task.task_id}</span>;

      case 'name':
        return (
          <div 
            className="max-w-[250px] cursor-pointer hover:text-primary"
            onClick={() => onView?.(task)}
          >
            <p className="font-medium truncate">{task.name}</p>
          </div>
        );

      case 'project':
        return task.project_id ? (
          <span className="text-sm truncate">{task.project_id.title}</span>
        ) : '-';

      case 'owner':
        const owners = task.owners?.length ? task.owners : (task.current_owner ? [task.current_owner] : []);
        return owners.length > 0 ? (
          <div className="flex -space-x-2">
            {owners.slice(0, 3).map((owner) => (
              <Avatar key={owner._id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary/10">
                  {owner.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {owners.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{owners.length - 3}
              </div>
            )}
          </div>
        ) : '-';

      case 'status':
        const colors = TASK_STATUS_COLORS[task.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
        return (
          <Badge className={cn("text-[10px] px-1.5 py-0.5", colors.bg, colors.text)}>
            {task.status}
          </Badge>
        );

      case 'tags':
        return task.tags?.length ? (
          <div className="flex gap-1 flex-wrap">
            {task.tags.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 1 && (
              <Badge variant="outline" className="text-[10px] px-1">+{task.tags.length - 1}</Badge>
            )}
          </div>
        ) : '-';

      case 'start_date':
        return task.start_date ? (
          <span className="text-sm">{format(new Date(task.start_date), "dd/MM/yyyy")}</span>
        ) : '-';

      case 'due_date':
        if (!task.due_date) return '-';
        const dueDate = new Date(task.due_date);
        const isOverdue = dueDate < new Date() && task.status !== 'Closed' && task.status !== 'Resolved';
        return (
          <span className={cn("text-sm", isOverdue && "text-red-500")}>
            {format(dueDate, "dd/MM/yyyy")}
          </span>
        );

      case 'duration':
        return task.duration || '-';

      case 'priority':
        const priorityColors: Record<string, string> = {
          'Urgent': 'text-red-500',
          'High': 'text-orange-500',
          'Medium': 'text-yellow-500',
          'Low': 'text-blue-500',
          'None': 'text-gray-500'
        };
        return (
          <span className={cn("text-sm", priorityColors[task.priority] || 'text-gray-500')}>
            {task.priority}
          </span>
        );

      case 'completion':
        return (
          <div className="flex items-center gap-2">
            <Progress value={task.completion_percentage} className="w-12 h-2" />
            <span className="text-xs">{task.completion_percentage}%</span>
          </div>
        );

      case 'time_logged':
        return <span className="text-sm">{formatTimeLogged(task.total_time_logged)}</span>;

      default:
        return '-';
    }
  };

  const renderTaskRow = (task: Task) => (
    <TableRow key={task._id} className="hover:bg-muted/50">
      {columns.map((column) => (
        <TableCell
          key={column.key}
          className={cn(
            column.width,
            column.fixed && "sticky bg-background",
            column.key === 'task_id' && "left-0 z-10",
            column.key === 'name' && "left-28 z-10"
          )}
        >
          {renderCellContent(task, column.key)}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-background z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(task)}>
                <Eye className="h-4 w-4 mr-2" />View
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task._id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Grouped view
  if (groupBy !== 'none' && groupedTasks) {
    return (
      <div ref={scrollContainerRef} className="relative h-full overflow-auto">
        {Object.entries(groupedTasks).map(([groupName, groupData]) => {
          const groupTasks = Array.isArray(groupData) ? groupData : groupData.tasks;
          const taskCount = groupTasks.length;
          const isExpanded = expandedGroups[groupName] !== false;

          return (
            <Collapsible key={groupName} open={isExpanded} onOpenChange={() => toggleGroup(groupName)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 cursor-pointer hover:bg-muted sticky top-0 z-30">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">{groupName}</span>
                  <Badge variant="secondary" className="text-xs">{taskCount}</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Table>
                  <TableHeader className="sticky top-10 bg-background z-20">
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={cn(
                            "whitespace-nowrap",
                            column.width,
                            column.fixed && "sticky bg-background z-10",
                            column.key === 'task_id' && "left-0",
                            column.key === 'name' && "left-28"
                          )}
                        >
                          {column.label}
                        </TableHead>
                      ))}
                      <TableHead className="w-12 sticky right-0 bg-background z-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupTasks.map(renderTaskRow)}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Flat list view
  return (
    <div ref={scrollContainerRef} className="relative h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-20">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "whitespace-nowrap",
                  column.width,
                  column.fixed && "sticky bg-background z-10",
                  column.key === 'task_id' && "left-0",
                  column.key === 'name' && "left-28"
                )}
              >
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-12 sticky right-0 bg-background z-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(renderTaskRow)}
        </TableBody>
      </Table>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No tasks found
        </div>
      )}

      {loadMoreRef && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetchingMore && <div className="text-sm text-muted-foreground">Loading more...</div>}
        </div>
      )}
    </div>
  );
};

export default TaskListView;
