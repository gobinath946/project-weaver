import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { PriorityBadge } from "@/components/project-management/PriorityBadge";
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

const MyProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["project-overview", id],
    queryFn: async () => {
      const response = await projectServices.getProjectOverview(id!);
      return response.data.data;
    },
    enabled: !!id,
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

  if (isLoading) {
    return (
      <DashboardLayout title="My Project">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const project = overview?.project;
  const taskBreakdown = overview?.task_breakdown || [];
  const bugBreakdown = overview?.bug_breakdown || [];

  const totalTasks = taskBreakdown.reduce((sum: number, item: any) => sum + item.count, 0);
  const completedTasks = taskBreakdown.find((item: any) => item._id === "Completed")?.count || 0;
  const totalBugs = bugBreakdown.reduce((sum: number, item: any) => sum + item.count, 0);
  const closedBugs = bugBreakdown.find((item: any) => item._id === "Closed")?.count || 0;

  return (
    <DashboardLayout title={project?.title || "My Project"}>
      <div className="space-y-6">
        {/* Back Button & Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/company/project_overview")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project?.title}</h1>
              <p className="text-sm text-muted-foreground">{project?.project_id}</p>
              {project?.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
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
                  <p className="font-medium">{project?.owner?.first_name} {project?.owner?.last_name}</p>
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

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="dashboard">
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListCheck className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4 mr-2" />
              Bugs
            </TabsTrigger>
            <TabsTrigger value="timelogs">
              <Timer className="h-4 w-4 mr-2" />
              Time Logs
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
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
                    <p className="text-2xl font-bold">{overview?.user_time_logs?.length || 0}</p>
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
                  {taskBreakdown.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tasks assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {taskBreakdown.map((item: any) => (
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
                  {bugBreakdown.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No bugs assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {bugBreakdown.map((item: any) => (
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
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Tasks in This Project</CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_tasks || overview.user_tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks assigned to you in this project</p>
                ) : (
                  <div className="space-y-2">
                    {overview.user_tasks.map((task: any) => (
                      <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.name}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              Due: {formatDate(task.due_date)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <PriorityBadge priority={task.priority} />
                          <StatusBadge status={task.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bugs Tab */}
          <TabsContent value="bugs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Bugs in This Project</CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_bugs || overview.user_bugs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bugs assigned to you in this project</p>
                ) : (
                  <div className="space-y-2">
                    {overview.user_bugs.map((bug: any) => (
                      <div key={bug._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{bug.title}</p>
                          {bug.description && (
                            <p className="text-sm text-muted-foreground truncate">{bug.description}</p>
                          )}
                          {bug.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              Due: {formatDate(bug.due_date)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant={bug.severity === "Critical" ? "destructive" : "outline"}>
                            {bug.severity}
                          </Badge>
                          <StatusBadge status={bug.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Logs Tab */}
          <TabsContent value="timelogs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Time Logs in This Project</CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_time_logs || overview.user_time_logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No time logs recorded in this project</p>
                ) : (
                  <div className="space-y-2">
                    {overview.user_time_logs.map((log: any) => (
                      <div key={log._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium">{log.description || "Time log entry"}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {log.log_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(log.log_date)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {log.hours || 0}h
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.is_billable ? "default" : "outline"}>
                            {log.is_billable ? "Billable" : "Non-Billable"}
                          </Badge>
                          <Badge variant={log.status === "Approved" ? "default" : "secondary"}>
                            {log.status || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyProjectDetail;
