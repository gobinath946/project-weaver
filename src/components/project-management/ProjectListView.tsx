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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { MoreVertical, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react";
import { STATUS_COLORS } from "@/constants/projectConstants";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  project_id: string;
  title: string;
  description?: string;
  owner?: { _id: string; first_name: string; last_name: string };
  status: string;
  progress: number;
  task_count: number;
  completed_task_count: number;
  bug_count: number;
  closed_bug_count: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  allocated_time?: number;
  allocated_users?: { _id: string; first_name: string; last_name: string }[];
  no_of_allocated_users?: number;
  project_group?: { _id: string; name: string; color: string };
  created_by?: { _id: string; first_name: string; last_name: string };
  created_at?: string;
  updated_at?: string;
  last_modified_by?: { _id: string; first_name: string; last_name: string };
}

interface ProjectListViewProps {
  projects: Project[];
  isLoading: boolean;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView?: (project: Project) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const ProjectListView = ({
  projects,
  isLoading,
  onEdit,
  onDelete,
  onView,
  sortField,
  sortOrder,
  onSort,
}: ProjectListViewProps) => {
  const columns = useMemo(() => [
    { key: 'project_id', label: 'ID', fixed: true, width: 'w-24' },
    { key: 'title', label: 'Project Name', fixed: true, width: 'min-w-[200px]' },
    { key: 'progress', label: '%', width: 'w-20' },
    { key: 'owner', label: 'Owner', width: 'w-36' },
    { key: 'status', label: 'Status', width: 'w-28' },
    { key: 'task_count', label: 'Tasks', width: 'w-24' },
    { key: 'bug_count', label: 'Bugs', width: 'w-24' },
    { key: 'start_date', label: 'Start Date', width: 'w-28' },
    { key: 'end_date', label: 'End Date', width: 'w-28' },
    { key: 'tags', label: 'Tags', width: 'w-32' },
    { key: 'allocated_time', label: 'Allocated Ti...', width: 'w-28' },
    { key: 'allocated_users', label: 'Allocated Users', width: 'w-40' },
    { key: 'no_of_allocated_users', label: 'No. Of Allo...', width: 'w-28' },
    { key: 'project_group', label: 'Project Group', width: 'w-32' },
    { key: 'created_by', label: 'Created By', width: 'w-32' },
    { key: 'created_at', label: 'Create Time', width: 'w-32' },
    { key: 'updated_at', label: 'Last Modified Time', width: 'w-36' },
    { key: 'last_modified_by', label: 'Last Modified By', width: 'w-36' },
  ], []);

  const SortableHeader = ({ column }: { column: typeof columns[0] }) => (
    <TableHead
      className={cn(
        "whitespace-nowrap",
        column.width,
        column.fixed && "sticky bg-background z-10",
        column.key === 'project_id' && "left-0",
        column.key === 'title' && "left-24"
      )}
    >
      {onSort ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 -ml-3 font-medium"
          onClick={() => onSort(column.key)}
        >
          {column.label}
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ) : (
        column.label
      )}
    </TableHead>
  );

  const renderCellContent = (project: Project, key: string) => {
    switch (key) {
      case 'project_id':
        return <span className="font-mono text-xs">{project.project_id}</span>;

      case 'title':
        return (
          <div className="max-w-[200px]">
            <p className="font-medium truncate">{project.title}</p>
          </div>
        );

      case 'progress':
        return (
          <div className="flex items-center gap-2">
            <Progress value={project.progress} className="w-12 h-2" />
            <span className="text-xs">{project.progress}%</span>
          </div>
        );

      case 'owner':
        return project.owner ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                {project.owner.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{project.owner.first_name}</span>
          </div>
        ) : '-';

      case 'status':
        const colors = STATUS_COLORS[project.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
        return (
          <Badge className={cn("text-xs", colors.bg, colors.text)}>
            {project.status}
          </Badge>
        );

      case 'task_count':
        return (
          <div className="flex items-center gap-1">
            <span className="text-green-500">{project.completed_task_count || 0}</span>
            <span className="text-muted-foreground">/</span>
            <span>{project.task_count || 0}</span>
          </div>
        );

      case 'bug_count':
        return (
          <div className="flex items-center gap-1">
            <span className="text-green-500">{project.closed_bug_count || 0}</span>
            <span className="text-muted-foreground">/</span>
            <span>{project.bug_count || 0}</span>
          </div>
        );

      case 'start_date':
        return project.start_date ? (
          <span className="text-sm">{format(new Date(project.start_date), "dd/MM/yyyy")}</span>
        ) : '-';

      case 'end_date':
        if (!project.end_date) return '-';
        const endDate = new Date(project.end_date);
        const isOverdue = endDate < new Date() && project.status !== 'Completed';
        return (
          <span className={cn("text-sm", isOverdue && "text-red-500")}>
            {format(endDate, "dd/MM/yyyy")}
          </span>
        );

      case 'tags':
        return project.tags?.length ? (
          <div className="flex gap-1 flex-wrap">
            {project.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{project.tags.length - 2}</Badge>
            )}
          </div>
        ) : '-';

      case 'allocated_time':
        return project.allocated_time ? `${project.allocated_time}h` : '-';

      case 'allocated_users':
        return project.allocated_users?.length ? (
          <div className="flex -space-x-2">
            {project.allocated_users.slice(0, 3).map((user) => (
              <Avatar key={user._id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary/10">
                  {user.first_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.allocated_users.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{project.allocated_users.length - 3}
              </div>
            )}
          </div>
        ) : '-';

      case 'no_of_allocated_users':
        return project.no_of_allocated_users || project.allocated_users?.length || 0;

      case 'project_group':
        return project.project_group ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: project.project_group.color }}
          >
            {project.project_group.name}
          </Badge>
        ) : '-';

      case 'created_by':
        return project.created_by ? (
          <span className="text-sm">{project.created_by.first_name} {project.created_by.last_name}</span>
        ) : '-';

      case 'created_at':
        return project.created_at ? (
          <span className="text-sm">{format(new Date(project.created_at), "dd/MM/yyyy HH:mm")}</span>
        ) : '-';

      case 'updated_at':
        return project.updated_at ? (
          <span className="text-sm">{format(new Date(project.updated_at), "dd/MM/yyyy HH:mm")}</span>
        ) : '-';

      case 'last_modified_by':
        return project.last_modified_by ? (
          <span className="text-sm">{project.last_modified_by.first_name} {project.last_modified_by.last_name}</span>
        ) : '-';

      default:
        return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-20">
          <TableRow>
            {columns.map((column) => (
              <SortableHeader key={column.key} column={column} />
            ))}
            <TableHead className="w-12 sticky right-0 bg-background z-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project._id} className="hover:bg-muted/50">
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.width,
                    column.fixed && "sticky bg-background",
                    column.key === 'project_id' && "left-0 z-10",
                    column.key === 'title' && "left-24 z-10"
                  )}
                >
                  {renderCellContent(project, column.key)}
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
                      <DropdownMenuItem onClick={() => onView(project)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(project._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {projects.length === 0 && (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No projects found
        </div>
      )}
    </div>
  );
};

export default ProjectListView;
