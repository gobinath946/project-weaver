import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectServices } from "@/api/services";
import { STATUS_COLORS, PROJECT_STATUS } from "@/constants/projectConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar, Users, Bug, ListCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectKanbanViewProps {
  onProjectClick?: (project: any) => void;
}

const ProjectKanbanView = ({ onProjectClick }: ProjectKanbanViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedProject, setDraggedProject] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects-kanban"],
    queryFn: async () => {
      const response = await projectServices.getProjectsKanban();
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectServices.updateProject(id, { status }),
    onSuccess: () => {
      toast({ title: "Project status updated" });
      queryClient.invalidateQueries({ queryKey: ["projects-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, project: any) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", project._id);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (draggedProject && draggedProject.status !== newStatus) {
      updateStatusMutation.mutate({
        id: draggedProject._id,
        status: newStatus,
      });
    }
    setDraggedProject(null);
  };

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

  return (
    <ScrollArea className="h-full">
      <div className="flex gap-3 p-4 min-h-full">
        {PROJECT_STATUS.map((status) => {
          const projects = kanbanData[status] || [];
          const colors = STATUS_COLORS[status] || { bg: "bg-gray-500/20", text: "text-gray-500", border: "border-gray-500" };
          const isDragOver = dragOverStatus === status;

          return (
            <div
              key={status}
              className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className={cn("flex items-center gap-2 p-2.5 rounded-t-lg border-b-2", colors.bg, colors.border)}>
                <span className={cn("font-medium text-sm", colors.text)}>{status}</span>
                <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[20px] justify-center">
                  {projects.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div
                className={cn(
                  "flex-1 bg-muted/20 rounded-b-lg p-2 min-h-[300px] space-y-2 transition-colors",
                  isDragOver && "bg-primary/10 ring-2 ring-primary/30"
                )}
              >
                {projects.map((project: any) => (
                  <Card
                    key={project._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                      draggedProject?._id === project._id && "opacity-50 scale-95"
                    )}
                    onClick={() => onProjectClick?.(project)}
                  >
                    <CardContent className="p-3 space-y-2.5">
                      {/* Drag Handle & Project ID */}
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground font-mono">{project.project_id}</span>
                      </div>

                      {/* Title */}
                      <p className="font-medium text-sm line-clamp-2">{project.title}</p>

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
                          <span>{project.completed_task_count || 0}/{project.task_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bug className="h-3 w-3" />
                          <span>{project.closed_bug_count || 0}/{project.bug_count || 0}</span>
                        </div>
                        {project.allocated_users?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{project.allocated_users.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Dates */}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {project.start_date && format(new Date(project.start_date), "dd/MM/yy")}
                          {project.start_date && project.end_date && " - "}
                          {project.end_date && (
                            <span className={new Date(project.end_date) < new Date() ? "text-red-500" : ""}>
                              {format(new Date(project.end_date), "dd/MM/yy")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Owner & Tags */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        {project.owner && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {project.owner.first_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] truncate max-w-[60px]">
                              {project.owner.first_name}
                            </span>
                          </div>
                        )}
                        {project.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 1).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 h-4">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 1 && (
                              <span className="text-[9px] text-muted-foreground">+{project.tags.length - 1}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {projects.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Drop projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ProjectKanbanView;
