import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { projectServices } from "@/api/services";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Bug, 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp,
  ListCheck,
  Timer
} from "lucide-react";

const ProjectOverviewDashboard = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();

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

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["user-project-overview", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getProjectOverview(currentProject!._id);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch project');
      }
    },
    enabled: !!currentProject?._id,
  });

  // Fetch user-specific tasks for this project
  const { data: userTasks } = useQuery({
    queryKey: ["user-project-tasks-count", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getUserTasks({ project_id: currentProject?._id });
      return response.data.data;
    },
    enabled: !!currentProject?._id,
  });

  // Fetch user-specific bugs for this project
  const { data: userBugs } = useQuery({
    queryKey: ["user-project-bugs-count", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getUserBugs({ project_id: currentProject?._id });
      return response.data.data;
    },
    enabled: !!currentProject?._id,
  });

  // Fetch user-specific time logs for this project
  const { data: userTimeLogs } = useQuery({
    queryKey: ["user-project-timelogs-count", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getTimeLogs({ 
        project_id: currentProject?._id,
        limit: 1000 // Get all to count
      });
      return response.data.data;
    },
    enabled: !!currentProject?._id,
  });

  // Helper function to safely format dates
  const formatDate = (date: any, formatStr: string = "MMM dd, yyyy") => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), formatStr);
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading || !projects) {
    return (
      <DashboardLayout title="Loading Project...">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !currentProject || !overview?.project) {
    return (
      <DashboardLayout title="Project Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested project could not be found or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/company/project_overview")}>
              Back to Projects
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = overview?.project;
  const taskBreakdown = overview?.task_breakdown || [];
  const bugBreakdown = overview?.bug_breakdown || [];

  // Helper function to get project display title
  const getProjectTitle = () => {
    if (project?.title && project.title.trim()) {
      return project.title.trim();
    }
    if (project?.project_id) {
      return `Project ${project.project_id}`;
    }
    return 'Untitled Project';
  };

  // Calculate user-specific counts
  const totalTasks = userTasks?.length || 0;
  const completedTasks = userTasks?.filter((task: any) => task.status === "Completed")?.length || 0;
  const totalBugs = userBugs?.length || 0;
  const closedBugs = userBugs?.filter((bug: any) => bug.status === "Closed")?.length || 0;
  const totalTimeLogs = userTimeLogs?.length || 0;

  // Create user-specific breakdowns
  const userTaskBreakdown = userTasks ? 
    Object.entries(
      userTasks.reduce((acc: any, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ _id: status, count })) : [];

  const userBugBreakdown = userBugs ? 
    Object.entries(
      userBugs.reduce((acc: any, bug: any) => {
        acc[bug.status] = (acc[bug.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ _id: status, count })) : [];

  return (
    <DashboardLayout title={getProjectTitle()}>
      <div className="space-y-6">
        {/* Back Button & Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/company/project_overview")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {getProjectTitle()}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                ID: {project?.project_id || 'Not assigned'}
              </p>
              {project?.description && (
                <p className="text-muted-foreground mt-2 leading-relaxed">{project.description}</p>
              )}
            </div>
          </div>
          <StatusBadge status={project?.status} />
        </div>

        {/* Project Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="font-medium">
                    {project?.owner?.first_name && project?.owner?.last_name 
                      ? `${project.owner.first_name} ${project.owner.last_name}`
                      : project?.owner?.email || 'Not assigned'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{project?.start_date ? formatDate(project.start_date, "MMM d, yyyy") : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">{project?.end_date ? formatDate(project.end_date, "MMM d, yyyy") : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="font-medium">{project?.progress || 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b">
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/tasks`)}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Circle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Tasks</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Bug className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Bugs</p>
                <p className="text-2xl font-bold">{totalBugs}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Logs</p>
                <p className="text-2xl font-bold">{totalTimeLogs}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task & Bug Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {userTaskBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tasks assigned</p>
              ) : (
                <div className="space-y-2">
                  {userTaskBreakdown.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="text-sm">{item._id}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bug Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {userBugBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No bugs assigned</p>
              ) : (
                <div className="space-y-2">
                  {userBugBreakdown.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="text-sm">{item._id}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectOverviewDashboard;