import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { PriorityBadge } from "@/components/project-management/PriorityBadge";
import { projectServices } from "@/api/services";
import { format } from "date-fns";
import { 
  FolderKanban, 
  ListCheck, 
  Bug, 
  Timer, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";

const ProjectOverview = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const response = await projectServices.getUserStats();
      return response.data.data;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["user-projects"],
    queryFn: async () => {
      const response = await projectServices.getUserProjects();
      return response.data.data;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["user-tasks", selectedProject],
    queryFn: async () => {
      const params = selectedProject ? { project_id: selectedProject } : {};
      const response = await projectServices.getUserTasks(params);
      return response.data.data;
    },
  });

  const { data: bugs, isLoading: bugsLoading } = useQuery({
    queryKey: ["user-bugs", selectedProject],
    queryFn: async () => {
      const params = selectedProject ? { project_id: selectedProject } : {};
      const response = await projectServices.getUserBugs(params);
      return response.data.data;
    },
  });

  const statCards = [
    { 
      title: "My Projects", 
      value: stats?.total_projects || 0, 
      icon: FolderKanban, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
    { 
      title: "Open Tasks", 
      value: stats?.open_tasks || 0, 
      icon: Circle, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10" 
    },
    { 
      title: "Completed Tasks", 
      value: stats?.completed_tasks || 0, 
      icon: CheckCircle2, 
      color: "text-green-500", 
      bg: "bg-green-500/10" 
    },
    { 
      title: "Open Bugs", 
      value: stats?.open_bugs || 0, 
      icon: Bug, 
      color: "text-red-500", 
      bg: "bg-red-500/10" 
    },
    { 
      title: "Time Logged", 
      value: `${stats?.total_time_logged?.toFixed(1) || 0}h`, 
      icon: Timer, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
  ];

  return (
    <DashboardLayout title="Project Overview">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            statCards.map((stat, i) => (
              <Card key={i} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color} transition-all duration-200`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
                {/* Subtle hover glow */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </Card>
            ))
          )}
        </div>

        {/* Completion Rates */}
        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">
                      <TrendingUp className="h-7 w-7 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Task Completion Rate</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 group-hover:text-green-500 transition-colors duration-200">
                        {stats?.task_completion_rate || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Progress</p>
                    <p className="text-sm font-semibold text-foreground">
                      {stats?.completed_tasks || 0} / {stats?.total_tasks || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3">
                      <TrendingUp className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Bug Resolution Rate</p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors duration-200">
                        {stats?.bug_resolution_rate || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Progress</p>
                    <p className="text-sm font-semibold text-foreground">
                      {stats?.closed_bugs || 0} / {stats?.total_bugs || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Card>
          </div>
        )}

        {/* My Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5" />
              My Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : projects?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No projects assigned</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project: any) => {
                  // Create URL-friendly project name
                  const projectUrlName = (project.title || project.project_id || 'untitled')
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                  
                  return (
                  <div
                    key={project._id}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                    onClick={() => navigate(`/project-overview/${projectUrlName}/dashboard`)}
                  >
                    {/* Card Content */}
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
                            {project.title || 'Untitled Project'}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {project.project_id}
                          </p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <StatusBadge status={project.status} />
                        </div>
                      </div>

                      {/* Project Group Badge */}
                      {project.project_group && (
                        <div className="mb-4">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-1 border-2 font-medium"
                            style={{ 
                              borderColor: project.project_group.color,
                              color: project.project_group.color,
                              backgroundColor: `${project.project_group.color}10`
                            }}
                          >
                            {project.project_group.name}
                          </Badge>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                          <div className="flex-shrink-0">
                            <ListCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Tasks</p>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              {(project.user_stats?.completed_tasks ?? 0)}/{(project.user_stats?.total_tasks ?? 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                          <div className="flex-shrink-0">
                            <Bug className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-red-900 dark:text-red-100">Bugs</p>
                            <p className="text-sm font-bold text-red-700 dark:text-red-300">
                              {(project.user_stats?.closed_bugs ?? 0)}/{(project.user_stats?.total_bugs ?? 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer with Blue Background */}
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800"></div>
                      <div className="relative flex items-center justify-between px-5 py-3 text-white">
                        <span className="text-sm font-medium">Click to view details</span>
                        <ArrowRight className="h-4 w-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks and Bugs Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tasks">
              <ListCheck className="h-4 w-4 mr-2" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4 mr-2" />
              My Bugs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedProject ? "Project Tasks" : "All My Tasks"}
                  </CardTitle>
                  {selectedProject && (
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : tasks?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks found</p>
                ) : (
                  <div className="space-y-2">
                    {tasks?.map((task: any) => (
                      <div key={task._id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-medium text-foreground mb-1 leading-tight">{task.name}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{task.project_id?.title}</span>
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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

          <TabsContent value="bugs" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedProject ? "Project Bugs" : "All My Bugs"}
                  </CardTitle>
                  {selectedProject && (
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bugsLoading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : bugs?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bugs found</p>
                ) : (
                  <div className="space-y-2">
                    {bugs?.map((bug: any) => (
                      <div key={bug._id} className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-medium text-foreground mb-1 leading-tight">{bug.title}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{bug.project_id?.title}</span>
                            {bug.due_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(bug.due_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProjectOverview;
