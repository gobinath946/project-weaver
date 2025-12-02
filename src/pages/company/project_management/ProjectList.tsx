import { useState, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ViewToggle, ViewMode } from "@/components/project-management/ViewToggle";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import ProjectDialog from "@/components/project-management/ProjectDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  Bug,
  ListCheck,
  Calendar,
  FolderKanban,
} from "lucide-react";

const ProjectList = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["projects", search, statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { page: pageParam, limit: 20 };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      const response = await projectServices.getProjects(params);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_more) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteProject(id),
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const { loadMoreRef } = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const projects = data?.pages.flatMap((page) => page.data) || [];

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProject(null);
  };

  return (
    <DashboardLayout title="Projects">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <ViewToggle view={view} onViewChange={setView} showCard />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton view={view} />
        ) : view === "list" ? (
          <ProjectTable
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProjectCards
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage && (
            <div className="text-sm text-muted-foreground">Loading more...</div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first project
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        project={selectedProject}
        onSuccess={() => {
          handleDialogClose();
          refetch();
        }}
      />
    </DashboardLayout>
  );
};

// Project Table Component
const ProjectTable = ({ projects, onEdit, onDelete }: any) => (
  <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Tasks</TableHead>
          <TableHead>Bugs</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project: any) => (
          <TableRow key={project._id}>
            <TableCell>
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="text-xs text-muted-foreground">{project.project_id}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                  {project.owner?.first_name?.charAt(0)}
                </div>
                <span className="text-sm">
                  {project.owner?.first_name} {project.owner?.last_name}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={project.status} type="project" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={project.progress} className="w-20 h-2" />
                <span className="text-xs text-muted-foreground">{project.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <ListCheck className="h-4 w-4 text-muted-foreground" />
                {project.completed_task_count || 0}/{project.task_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Bug className="h-4 w-4 text-muted-foreground" />
                {project.closed_bug_count || 0}/{project.bug_count || 0}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                {project.start_date && format(new Date(project.start_date), "MMM d, yyyy")}
                {project.end_date && ` - ${format(new Date(project.end_date), "MMM d, yyyy")}`}
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
  </div>
);

// Project Cards Component
const ProjectCards = ({ projects, onEdit, onDelete }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {projects.map((project: any) => (
      <Card key={project._id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{project.title}</p>
              <p className="text-xs text-muted-foreground">{project.project_id}</p>
            </div>
            <StatusBadge status={project.status} type="project" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ListCheck className="h-4 w-4" />
              {project.task_count || 0} tasks
            </div>
            <div className="flex items-center gap-1">
              <Bug className="h-4 w-4" />
              {project.bug_count || 0} bugs
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                {project.owner?.first_name?.charAt(0)}
              </div>
              <span className="text-sm">{project.owner?.first_name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Loading Skeleton
const LoadingSkeleton = ({ view }: { view: ViewMode }) => {
  if (view === "list") {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
};

export default ProjectList;
