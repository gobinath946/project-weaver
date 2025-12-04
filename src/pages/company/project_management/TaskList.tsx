import { useState, useRef } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ViewToggle, ViewMode } from "@/components/project-management/ViewToggle";
import TaskListView from "@/components/project-management/TaskListView";
import TaskKanbanView from "@/components/project-management/TaskKanbanView";
import TaskDialog from "@/components/project-management/TaskDialog";
import TaskListDialog from "@/components/project-management/TaskListDialog";
import TaskFilterSheet, { TaskFilters } from "@/components/project-management/TaskFilterSheet";
import TaskDetailModal from "@/components/project-management/TaskDetailModal";
import { GROUP_BY_OPTIONS } from "@/constants/taskConstants";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Filter, ListCheck, ChevronDown, ListPlus, LayoutList } from "lucide-react";

const TaskList = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<'task_list' | 'project' | 'none'>('task_list');
  const [filters, setFilters] = useState<TaskFilters>({ filter_mode: 'all' });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskListDialogOpen, setTaskListDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch projects for filter and kanban
  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
  });

  // Build query params from filters
  const buildQueryParams = (pageParam: number) => {
    const params: any = { page: pageParam, limit: 30 };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.project_id) params.project_id = filters.project_id;
    if (filters.task_list_id) params.task_list_id = filters.task_list_id;
    if (filters.owner) params.owner = filters.owner;
    if (filters.current_owner) params.current_owner = filters.current_owner;
    if (filters.billing_type) params.billing_type = filters.billing_type;
    if (filters.created_by) params.created_by = filters.created_by;
    if (filters.tags) params.tags = filters.tags;
    if (filters.time_span) params.time_span = filters.time_span;
    if (filters.start_date_from) params.start_date_from = filters.start_date_from.toISOString();
    if (filters.start_date_to) params.start_date_to = filters.start_date_to.toISOString();
    if (filters.due_date_from) params.due_date_from = filters.due_date_from.toISOString();
    if (filters.due_date_to) params.due_date_to = filters.due_date_to.toISOString();
    if (filters.created_from) params.created_from = filters.created_from.toISOString();
    if (filters.created_to) params.created_to = filters.created_to.toISOString();

    return params;
  };

  // Fetch tasks for list view (flat)
  const {
    data: tasksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useInfiniteQuery({
    queryKey: ["tasks", filters, groupBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = buildQueryParams(pageParam);
      if (groupBy !== 'none') {
        params.group_by = groupBy;
        const response = await projectServices.getTasksGrouped(params);
        return response.data;
      }
      const response = await projectServices.getTasks(params);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (groupBy !== 'none') return undefined; // No pagination for grouped view
      return lastPage.pagination?.has_more ? lastPage.pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: view === "list",
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

  const { loadMoreRef: scrollRef } = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  // Process tasks data
  const tasks = groupBy === 'none'
    ? tasksData?.pages.flatMap((page) => page.data) || []
    : [];

  const groupedTasks = groupBy !== 'none' && tasksData?.pages[0]?.data
    ? tasksData.pages[0].data
    : undefined;

  const handleEdit = (task: any) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (task: any) => {
    setSelectedTaskId(task._id);
    setDetailModalOpen(true);
  };

  const handleApplyFilters = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'filter_mode' && value && value !== ''
  ).length;

  return (
    <DashboardLayout title="Tasks">
      <div className="h-full flex flex-col">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {/* Group By Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutList className="h-4 w-4" />
                  Group By: {GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label || 'None'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setGroupBy('none')}>
                  Default Views
                </DropdownMenuItem>
                {GROUP_BY_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setGroupBy(option.value as any)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle view={view} onViewChange={setView} />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterSheetOpen(true)}
              className="h-8 relative"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4" />
                  Add
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTaskDialogOpen(true)}>
                  <ListCheck className="h-4 w-4 mr-2" />
                  Add Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTaskListDialogOpen(true)}>
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add Task List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "list" ? (
            tasksLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <TaskListView
                tasks={tasks}
                groupedTasks={groupedTasks}
                isLoading={tasksLoading}
                groupBy={groupBy}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                loadMoreRef={scrollRef}
                isFetchingMore={isFetchingNextPage}
              />
            )
          ) : (
            <TaskKanbanView
              projects={projectsData || []}
              onTaskClick={handleView}
            />
          )}

          {!tasksLoading && tasks.length === 0 && !groupedTasks && view === "list" && (
            <div className="text-center py-12">
              <ListCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">Create your first task to get started</p>
              <Button onClick={() => setTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={() => {
          setTaskDialogOpen(false);
          setSelectedTask(null);
          refetchTasks();
          queryClient.invalidateQueries({ queryKey: ["tasks-kanban"] });
        }}
      />

      <TaskListDialog
        open={taskListDialogOpen}
        onClose={() => setTaskListDialogOpen(false)}
        onSuccess={() => {
          setTaskListDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: ["task-lists"] });
          queryClient.invalidateQueries({ queryKey: ["all-task-lists"] });
        }}
      />

      <TaskFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      <TaskDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
      />
    </DashboardLayout>
  );
};

export default TaskList;
