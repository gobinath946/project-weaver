import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { projectServices } from "@/api/services";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Circle, Bug, Clock, Users, Calendar, TrendingUp } from "lucide-react";

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await projectServices.getProject(id!);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["project-dashboard", id],
    queryFn: async () => {
      const response = await projectServices.getProjectDashboard(id!);
      return response.data.data;
    },
    enabled: !!id,
  });

  const isLoading = projectLoading || dashboardLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Project Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }


  const taskCompletion = dashboard?.task_completion || 0;
  const bugResolution = dashboard?.bug_resolution || 0;

  return (
    <DashboardLayout title={project?.title || "Project Dashboard"}>
      <div className="space-y-6">
        {/* Back Button & Project Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project?.title}</h1>
              <p className="text-muted-foreground">{project?.description}</p>
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
                  <p className="font-medium">{project?.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">{project?.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "Not set"}</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Circle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
                <p className="text-2xl font-bold">{dashboard?.open_tasks || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{dashboard?.completed_tasks || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Bug className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Bugs</p>
                <p className="text-2xl font-bold">{dashboard?.open_bugs || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{dashboard?.total_hours?.toFixed(1) || 0}h</p>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="font-medium">{taskCompletion.toFixed(0)}%</span>
                </div>
                <Progress value={taskCompletion} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{dashboard?.completed_tasks || 0} completed</span>
                  <span>{dashboard?.total_tasks || 0} total</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bug Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolution Rate</span>
                  <span className="font-medium">{bugResolution.toFixed(0)}%</span>
                </div>
                <Progress value={bugResolution} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{dashboard?.closed_bugs || 0} resolved</span>
                  <span>{dashboard?.total_bugs || 0} total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Log Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Time Log Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{dashboard?.billable_hours?.toFixed(1) || 0}h</p>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-500/10">
                <p className="text-2xl font-bold">{dashboard?.non_billable_hours?.toFixed(1) || 0}h</p>
                <p className="text-sm text-muted-foreground">Non-Billable Hours</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{dashboard?.total_hours?.toFixed(1) || 0}h</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        {dashboard?.team_performance?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.team_performance.map((member: any) => (
                  <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {member.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{member.tasks_completed || 0}</p>
                        <p className="text-xs text-muted-foreground">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{member.bugs_resolved || 0}</p>
                        <p className="text-xs text-muted-foreground">Bugs</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{member.hours_logged?.toFixed(1) || 0}h</p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectDashboard;
