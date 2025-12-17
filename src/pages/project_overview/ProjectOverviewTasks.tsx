import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import TaskListView from "@/components/project-management/TaskListView";
import TaskDialog from "@/components/project-management/TaskDialog";
import TaskDetailModal from "@/components/project-management/TaskDetailModal";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, ListCheck, TrendingUp, Bug, Timer } from "lucide-react";

const ProjectOverviewTasks = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Find project by name/title
  const { data: projects } = useQuery({
    queryKey: ["user-projects"],
    queryFn: async () => {
      const response = await projectServices.getUserProjects();
      return response.data.data;
    },
  });

  // Find the project that matches the name in URL
  const currentProject = projects?.find((p: any) => 
    p.title?.toLowerCase().replace(/\s+/g, '-') === projectName ||
    p.project_id?.toLowerCase().replace(/\s+/g, '-') === projectName
  );

  // Get project info
  const { data: projectInfo } = useQuery({
    queryKey: ["project-overview", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getProjectOverview(currentProject!._id);
      return response.data.data;
    },
    enabled: !!currentProject?._id,
  });

  // Fetch user-specific tasks for this project
  const {
    data: tasksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useInfiniteQuery({
    queryKey: ["user-project-tasks", currentProject?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { 
        page: pageParam,
        limit: 30,
        project_id: currentProject?._id
      };
      const response = await projectServices.getUserTasks(params);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.has_more ? lastPage.pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!currentProject?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteTask(id),
    onSuccess: () => {
      toast({ title: "Task deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["user-project-tasks"] });
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

  const tasks = tasksData?.pages.flatMap((page) => page.data) || [];

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

  const projectTitle = projectInfo?.project?.title || currentProject?.title || 'Project';

  if (!projects || !currentProject) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-32" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${projectTitle} - Tasks`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="glass-card border-b border-border/30 p-3 sm:p-4 flex-shrink-0 rounded-t-xl flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/project-overview/${projectName}/dashboard`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{projectTitle} - Tasks</h1>
              <p className="text-sm text-muted-foreground">Manage tasks for this project</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/dashboard`)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <ListCheck className="h-4 w-4" />
            Tasks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/bugs`)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Bugs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/timesheets`)}
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            Time Logs
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-card/50 backdrop-blur-sm rounded-b-xl">
          {tasksLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TaskListView
              tasks={tasks}
              isLoading={tasksLoading}
              groupBy="none"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              loadMoreRef={scrollRef}
              isFetchingMore={isFetchingNextPage}
            />
          )}

          {!tasksLoading && tasks.length === 0 && (
            <div className="text-center py-12">
              <ListCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">Create your first task for this project</p>
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
        }}
        defaultProjectId={currentProject?._id}
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

export default ProjectOverviewTasks;