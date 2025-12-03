import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectServices } from "@/api/services";
import { STATUS_COLORS } from "@/constants/projectConstants";
import { format } from "date-fns";
import { Calendar, Users, Bug, ListCheck } from "lucide-react";

interface ProjectKanbanViewProps {
  onProjectClick?: (project: any) => void;
}

const ProjectKanbanView = ({ onProjectClick }: ProjectKanbanViewProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["projects-kanban"],
    queryFn: async () => {
      const response = await projectServices.getProjectsKanban();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-10 w-full mb-3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const kanbanData = data?.data || {};
  const statuses = data?.statuses || [];

  // Filter out empty columns
  const activeStatuses = statuses.filter((status: string) => kanbanData[status]?.length > 0);

  return (
    <ScrollArea className="h-full">
      <div className="flex gap-4 p-4 min-h-full">
        {activeStatuses.map((status: string) => {
          const projects = kanbanData[status] || [];
          const colors = STATUS_COLORS[status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };

          return (
            <div key={status} className="flex-shrink-0 w-72">
              {/* Column Header */}
              <div className={`flex items-center gap-2 p-3 rounded-t-lg ${colors.bg}`}>
                <span className={`font-medium text-sm ${colors.text}`}>{status}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {projects.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="bg-muted/30 rounded-b-lg p-2 min-h-[200px] space-y-2">
                {projects.map((project: any) => (
                  <Card
                    key={project._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onProjectClick?.(project)}
                  >
                    <CardContent className="p-3 space-y-3">
                      {/* Project ID & Title */}
                      <div>
                        <p className="text-xs text-muted-foreground">{project.project_id}</p>
                        <p className="font-medium text-sm line-clamp-2">{project.title}</p>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-1.5" />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ListCheck className="h-3 w-3" />
                          {project.task_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bug className="h-3 w-3" />
                          {project.bug_count || 0}
                        </div>
                        {project.allocated_users?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.allocated_users.length}
                          </div>
                        )}
                      </div>

                      {/* Dates */}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {project.start_date && format(new Date(project.start_date), "dd/MM/yy")}
                          {project.start_date && project.end_date && " - "}
                          {project.end_date && format(new Date(project.end_date), "dd/MM/yy")}
                        </div>
                      )}

                      {/* Owner & Tags */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {project.owner && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {project.owner.first_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate max-w-[100px]">
                              {project.owner.first_name}
                            </span>
                          </div>
                        )}
                        {project.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{project.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {activeStatuses.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No projects to display
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ProjectKanbanView;
