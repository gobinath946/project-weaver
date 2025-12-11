import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { projectServices } from "@/api/services";
import { 
  FolderKanban, 
  ListCheck, 
  Bug, 
  Timer, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  ArrowRight
} from "lucide-react";

const MyProjects = () => {
  const navigate = useNavigate();

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

  const handleProjectClick = (projectId: string) => {
    navigate(`/company/my-projects/${projectId}`);
  };

  return (
    <DashboardLayout title="My Projects">
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

        {/* My Projects List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="h-5 w-5" />
              My Assigned Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
            ) : projects?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No projects assigned</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.map((project: any) => (
                  <div
                    key={project._id}
                    className="p-4 rounded-lg border transition-all cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-md"
                    onClick={() => handleProjectClick(project._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-lg">{project.title}</h3>
                        <p className="text-xs text-muted-foreground">{project.project_id}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.project_group && (
                      <Badge 
                        variant="outline" 
                        className="mb-3"
                        style={{ borderColor: project.project_group.color }}
                      >
                        {project.project_group.name}
                      </Badge>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <ListCheck className="h-3 w-3 text-blue-500" />
                        <span>{project.user_stats?.completed_tasks || 0}/{project.user_stats?.total_tasks || 0} Tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bug className="h-3 w-3 text-red-500" />
                        <span>{project.user_stats?.closed_bugs || 0}/{project.user_stats?.total_bugs || 0} Bugs</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        Owner: {project.owner?.first_name} {project.owner?.last_name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyProjects;
