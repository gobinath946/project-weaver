import { useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ViewToggle, ViewMode } from "@/components/project-management/ViewToggle";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { PriorityBadge } from "@/components/project-management/PriorityBadge";
import KanbanBoard from "@/components/project-management/KanbanBoard";
import TaskDialog from "@/components/project-management/TaskDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Plus, Search, MoreVertical, Edit, Trash2, ListCheck, User } from "lucide-react";

const TaskList = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
  });

  // Fetch tasks for list view
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch,
  } = useInfiniteQuery({
    queryKey: ["tasks", search, statusFilter, projectFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { page: pageParam, limit: 20 };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (projectFilter && projectFilter !== "all") params.project_id = projectFilter;
      const response = await projectServices.getTasks(params);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined,
    initialPageParam: 1,
    enabled: view === "list",
  });

  // Fetch kanban data
  const { data: kanbanData, isLoading: kanbanLoading } = useQuery({
    queryKey: ["tasks-kanban", projectFilter],
    queryFn: async () => {
      const params: any = {};
      if (projectFilter && projectFilter !== "all") params.project_id = projectFilter;
      const response = await projectServices.getTasksKanban(params);
      return response.data.data;
    },
    enabled: view === "kanban",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteTask(id),
    onSuccess: () => {
      toast({ title: "Task deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const { loadMoreRef } = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const tasks = data?.pages.flatMap((page) => page.data) || [];

  const kanbanColumns = kanbanData ? [
    { id: "not-started", title: "Not Started", items: kanbanData["Not Started"] || [], color: "gray" },
    { id: "in-progress", title: "In Progress", items: kanbanData["In Progress"] || [], color: "blue" },
    { id: "on-hold", title: "On Hold", items: kanbanData["On Hold"] || [], color: "orange" },
    { id: "completed", title: "Completed", items: kanbanData["Completed"] || [], color: "green" },
  ] : [];

  const handleEdit = (task: any) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout title="Tasks">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectsData?.map((p: any) => (
                  <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <ViewToggle view={view} onViewChange={setView} />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Content */}
        {view === "list" ? (
          isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task: any) => (
                    <TableRow key={task._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-xs text-muted-foreground">{task.task_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{task.project_id?.title}</span>
                      </TableCell>
                      <TableCell>
                        {task.assignee && (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {task.assignee.first_name?.charAt(0)}
                            </div>
                            <span className="text-sm">{task.assignee.first_name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={task.status} /></TableCell>
                      <TableCell><PriorityBadge priority={task.priority} /></TableCell>
                      <TableCell>
                        {task.due_date && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(task.due_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(task)}>
                              <Edit className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(task._id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          kanbanLoading ? (
            <div className="flex gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-80" />)}</div>
          ) : (
            <KanbanBoard columns={kanbanColumns} type="task" onItemClick={handleEdit} />
          )
        )}

        {view === "list" && (
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <div className="text-sm text-muted-foreground">Loading more...</div>}
          </div>
        )}

        {!isLoading && tasks.length === 0 && view === "list" && (
          <div className="text-center py-12">
            <ListCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-4">Create your first task to get started</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Task</Button>
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedTask(null); }}
        task={selectedTask}
        onSuccess={() => { setDialogOpen(false); setSelectedTask(null); refetch(); queryClient.invalidateQueries({ queryKey: ["tasks-kanban"] }); }}
      />
    </DashboardLayout>
  );
};

export default TaskList;
