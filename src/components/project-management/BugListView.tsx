import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { MoreVertical, Edit, Trash2, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { BUG_STATUS_COLORS, BUG_SEVERITY_COLORS } from "@/constants/bugConstants";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Bug {
  _id: string;
  bug_id: string;
  title: string;
  description?: string;
  project_id?: { _id: string; title: string; project_id: string };
  reporter?: { _id: string; first_name: string; last_name: string };
  assignee?: { _id: string; first_name: string; last_name: string };
  status: string;
  severity: string;
  classification?: string;
  module?: string;
  reproducible?: string;
  flag?: string;
  due_date?: string;
  last_closed_time?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

interface GroupedBugs {
  _id: string;
  group_name: string;
  group_id: string;
  items: Bug[];
  count: number;
}

interface BugListViewProps {
  bugs: Bug[];
  groupedBugs?: GroupedBugs[];
  isLoading: boolean;
  groupBy: 'none' | 'project';
  onEdit: (bug: Bug) => void;
  onDelete: (id: string) => void;
  onView?: (bug: Bug) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isFetchingMore?: boolean;
}

const BugListView = ({
  bugs,
  groupedBugs,
  isLoading,
  groupBy,
  onEdit,
  onDelete,
  onView,
  loadMoreRef,
  isFetchingMore,
}: BugListViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const columns = useMemo(() => [
    { key: 'bug_id', label: 'ID', fixed: true, width: 'w-28' },
    { key: 'title', label: 'Bug Name', fixed: true, width: 'min-w-[220px]' },
    { key: 'project', label: 'Project', width: 'w-36' },
    { key: 'reporter', label: 'Reporter', width: 'w-32' },
    { key: 'created_at', label: 'Created At', width: 'w-32' },
    { key: 'assignee', label: 'Assignee', width: 'w-32' },
    { key: 'last_closed_time', label: 'Last Closed', width: 'w-32' },
    { key: 'updated_at', label: 'Last Modified', width: 'w-36' },
    { key: 'due_date', label: 'Due Date', width: 'w-28' },
    { key: 'status', label: 'Status', width: 'w-36' },
    { key: 'severity', label: 'Severity', width: 'w-28' },
    { key: 'module', label: 'Module', width: 'w-28' },
    { key: 'classification', label: 'Classification', width: 'w-36' },
    { key: 'flag', label: 'Flag', width: 'w-24' },
    { key: 'tags', label: 'Tags', width: 'w-32' },
    { key: 'reproducible', label: 'Reproducible', width: 'w-28' },
  ], []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const renderCellContent = (bug: Bug, key: string) => {
    switch (key) {
      case 'bug_id':
        return <span className="font-mono text-xs">{bug.bug_id}</span>;

      case 'title':
        return (
          <div 
            className="max-w-[220px] cursor-pointer hover:text-primary"
            onClick={() => onView?.(bug)}
          >
            <p className="font-medium truncate">{bug.title}</p>
          </div>
        );

      case 'project':
        return bug.project_id ? (
          <span className="text-sm truncate">{bug.project_id.title}</span>
        ) : '-';

      case 'reporter':
        return bug.reporter ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                {bug.reporter.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{bug.reporter.first_name}</span>
          </div>
        ) : '-';

      case 'assignee':
        return bug.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                {bug.assignee.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{bug.assignee.first_name}</span>
          </div>
        ) : '-';

      case 'status':
        const statusColors = BUG_STATUS_COLORS[bug.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
        return (
          <Badge className={cn("text-xs whitespace-nowrap", statusColors.bg, statusColors.text)}>
            {bug.status}
          </Badge>
        );

      case 'severity':
        const severityColors = BUG_SEVERITY_COLORS[bug.severity] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
        return (
          <Badge className={cn("text-xs", severityColors.bg, severityColors.text)}>
            {bug.severity}
          </Badge>
        );

      case 'classification':
        return bug.classification ? (
          <span className="text-sm">{bug.classification}</span>
        ) : '-';

      case 'module':
        return bug.module ? (
          <span className="text-sm truncate">{bug.module}</span>
        ) : '-';

      case 'reproducible':
        return bug.reproducible ? (
          <span className="text-sm">{bug.reproducible}</span>
        ) : '-';

      case 'flag':
        return bug.flag ? (
          <Badge variant="outline" className="text-xs">
            {bug.flag}
          </Badge>
        ) : '-';

      case 'due_date':
        if (!bug.due_date) return '-';
        const dueDate = new Date(bug.due_date);
        const isOverdue = dueDate < new Date() && bug.status !== 'Closed';
        return (
          <span className={cn("text-sm", isOverdue && "text-red-500")}>
            {format(dueDate, "dd/MM/yyyy")}
          </span>
        );

      case 'last_closed_time':
        return bug.last_closed_time ? (
          <span className="text-sm">{format(new Date(bug.last_closed_time), "dd/MM/yyyy HH:mm")}</span>
        ) : '-';

      case 'created_at':
        return bug.created_at ? (
          <span className="text-sm">{format(new Date(bug.created_at), "dd/MM/yyyy HH:mm")}</span>
        ) : '-';

      case 'updated_at':
        return bug.updated_at ? (
          <span className="text-sm">{format(new Date(bug.updated_at), "dd/MM/yyyy HH:mm")}</span>
        ) : '-';

      case 'tags':
        return bug.tags?.length ? (
          <div className="flex gap-1 flex-wrap">
            {bug.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {bug.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{bug.tags.length - 2}</Badge>
            )}
          </div>
        ) : '-';

      default:
        return '-';
    }
  };

  const renderBugRow = (bug: Bug) => (
    <TableRow key={bug._id} className="hover:bg-muted/50">
      {columns.map((column) => (
        <TableCell
          key={column.key}
          className={cn(
            column.width,
            column.fixed && "sticky bg-background",
            column.key === 'bug_id' && "left-0 z-10",
            column.key === 'title' && "left-28 z-10"
          )}
        >
          {renderCellContent(bug, column.key)}
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
              <DropdownMenuItem onClick={() => onView(bug)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(bug)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(bug._id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
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
  if (groupBy === 'project' && groupedBugs) {
    return (
      <div className="h-full overflow-auto">
        {groupedBugs.map((group) => {
          const isExpanded = expandedGroups.has(group._id) || expandedGroups.size === 0;
          
          return (
            <Collapsible
              key={group._id}
              open={isExpanded}
              onOpenChange={() => toggleGroup(group._id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 hover:bg-muted border-b">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{group.group_name}</span>
                <Badge variant="secondary" className="ml-2">{group.count}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-x-auto">
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
                              column.key === 'bug_id' && "left-0",
                              column.key === 'title' && "left-28"
                            )}
                          >
                            {column.label}
                          </TableHead>
                        ))}
                        <TableHead className="w-12 sticky right-0 bg-background z-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map(renderBugRow)}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Flat list view
  return (
    <div className="relative h-full overflow-auto">
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
                  column.key === 'bug_id' && "left-0",
                  column.key === 'title' && "left-28"
                )}
              >
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-12 sticky right-0 bg-background z-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bugs.map(renderBugRow)}
        </TableBody>
      </Table>

      {bugs.length === 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No bugs found
        </div>
      )}

      {loadMoreRef && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetchingMore && <span className="text-sm text-muted-foreground">Loading more...</span>}
        </div>
      )}
    </div>
  );
};

export default BugListView;
