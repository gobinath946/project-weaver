import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Completion Rates */}
        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Task Completion Rate</p>
                      <p className="text-2xl font-bold">{stats?.task_completion_rate || 0}%</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {stats?.completed_tasks || 0} / {stats?.total_tasks || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bug Resolution Rate</p>
                      <p className="text-2xl font-bold">{stats?.bug_resolution_rate || 0}%</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {stats?.closed_bugs || 0} / {stats?.total_bugs || 0}
                  </div>
                </div>
              </CardContent>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project: any) => (
                  <div
                    key={project._id}
                    className="p-4 rounded-lg border transition-all cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-md"
                    onClick={() => navigate(`/company/my-projects/${project._id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{project.title}</h3>
                        <p className="text-xs text-muted-foreground">{project.project_id}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    {project.project_group && (
                      <Badge 
                        variant="outline" 
                        className="mb-2"
                        style={{ borderColor: project.project_group.color }}
                      >
                        {project.project_group.name}
                      </Badge>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="flex items-center gap-1">
                        <ListCheck className="h-3 w-3 text-blue-500" />
                        <span>{project.user_stats?.completed_tasks || 0}/{project.user_stats?.total_tasks || 0} Tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bug className="h-3 w-3 text-red-500" />
                        <span>{project.user_stats?.closed_bugs || 0}/{project.user_stats?.total_bugs || 0} Bugs</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Click to view details</span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                ))}
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
                      <div key={task._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{task.project_id?.title}</p>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>
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
                      <div key={bug._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{bug.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{bug.project_id?.title}</p>
                            {bug.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(bug.due_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProjectOverview;
