import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  
  // Use projectId if available (new route), otherwise use id (legacy route)
  const currentProjectId = projectId || id;



  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["project-overview", currentProjectId],
    queryFn: async () => {
      const response = await projectServices.getProjectOverview(currentProjectId!);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch project');
      }
    },
    enabled: !!currentProjectId,
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

  if (error || !overview || !overview.project) {
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

  const totalTasks = taskBreakdown.reduce((sum: number, item: any) => sum + item.count, 0);
  const completedTasks = taskBreakdown.find((item: any) => item._id === "Completed")?.count || 0;
  const totalBugs = bugBreakdown.reduce((sum: number, item: any) => sum + item.count, 0);
  const closedBugs = bugBreakdown.find((item: any) => item._id === "Closed")?.count || 0;

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
            variant={window.location.pathname.includes('/dashboard') ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate(`/company/project-overview/${currentProjectId}/dashboard`)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={window.location.pathname.includes('/tasks') ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate(`/company/project-overview/${currentProjectId}/tasks`)}
            className="flex items-center gap-2"
          >
            <ListCheck className="h-4 w-4" />
            Tasks
          </Button>
          <Button
            variant={window.location.pathname.includes('/bugs') ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate(`/company/project-overview/${currentProjectId}/bugs`)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Bugs
          </Button>
          <Button
            variant={window.location.pathname.includes('/timesheets') ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate(`/company/project-overview/${currentProjectId}/timesheets`)}
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            Time Logs
          </Button>
        </div>

        {/* Dashboard Content - Only show on dashboard route */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="hidden">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                <CardTitle className="text-lg">
                  My Tasks in {getProjectTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_tasks || overview.user_tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <ListCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks assigned</h3>
                    <p className="text-muted-foreground">No tasks are assigned to you in this project</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task Name</TableHead>
                          <TableHead>Task List</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.user_tasks.map((task: any) => (
                          <TableRow key={task._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{task.name}</p>
                                <p className="text-xs text-muted-foreground">{task.task_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{task.task_list_id?.name || 'No List'}</span>
                            </TableCell>
                            <TableCell>
                              {task.assignee ? (
                                <span className="text-sm">{task.assignee.first_name} {task.assignee.last_name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {task.due_date ? (
                                <span className="text-sm">{formatDate(task.due_date)}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <PriorityBadge priority={task.priority} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={task.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bugs Tab */}
          <TabsContent value="bugs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  My Bugs in {getProjectTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_bugs || overview.user_bugs.length === 0 ? (
                  <div className="text-center py-12">
                    <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No bugs assigned</h3>
                    <p className="text-muted-foreground">No bugs are assigned to you in this project</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bug Title</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.user_bugs.map((bug: any) => (
                          <TableRow key={bug._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{bug.title}</p>
                                <p className="text-xs text-muted-foreground">{bug.bug_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {bug.reporter ? (
                                <span className="text-sm">{bug.reporter.first_name} {bug.reporter.last_name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {bug.assignee ? (
                                <span className="text-sm">{bug.assignee.first_name} {bug.assignee.last_name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {bug.due_date ? (
                                <span className="text-sm">{formatDate(bug.due_date)}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No due date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={bug.severity === "Critical" ? "destructive" : bug.severity === "High" ? "destructive" : "outline"}>
                                {bug.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={bug.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Logs Tab */}
          <TabsContent value="timelogs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  My Time Logs in {getProjectTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!overview?.user_time_logs || overview.user_time_logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No time logs recorded</h3>
                    <p className="text-muted-foreground">No time logs have been recorded for this project</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead>Billing Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.user_time_logs.map((log: any) => (
                          <TableRow key={log._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{log.title || log.description || "Time log entry"}</p>
                                <p className="text-xs text-muted-foreground">{log.log_id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.log_date ? (
                                <span className="text-sm">{formatDate(log.log_date)}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No date</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.hours || 0}h</Badge>
                            </TableCell>
                            <TableCell>
                              {log.task_id ? (
                                <span className="text-sm">{log.task_id.name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No task</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.is_billable ? "default" : "secondary"}>
                                {log.is_billable ? "Billable" : "Non-Billable"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={log.approval_status || log.status || "Pending"} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
