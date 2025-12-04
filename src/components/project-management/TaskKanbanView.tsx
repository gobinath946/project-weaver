import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectServices } from "@/api/services";
import { TASK_STATUS, TASK_STATUS_COLORS } from "@/constants/taskConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar, GripVertical, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskKanbanViewProps {
  projectId?: string;
  onTaskClick?: (task: any) => void;
  projects?: any[];
}

const TaskKanbanView = ({ projectId: initialProjectId, onTaskClick, projects = [] }: TaskKanbanViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || '');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks-kanban", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return null;
      const response = await projectServices.getTasksKanban({ project_id: selectedProject });
      return response.data;
    },
    enabled: !!selectedProject,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectServices.updateTask(id, { status }),
    onSuccess: () => {
      toast({ title: "Task status updated" });
      queryClient.invalidateQueries({ queryKey: ["tasks-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task._id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
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

    if (draggedTask && draggedTask.status !== newStatus) {
      updateStatusMutation.mutate({
        id: draggedTask._id,
        status: newStatus,
      });
    }
    setDraggedTask(null);
  };

  if (!selectedProject) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a project to view Kanban" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p: any) => (
                <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a project to view the Kanban board
        </div>
      </div>
    );
  }

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

  // Filter to show only statuses that have tasks or are commonly used
  const activeStatuses = TASK_STATUS.filter(status => {
    const tasks = kanbanData[status] || [];
    return tasks.length > 0 || [
      '1-Dev/Open', '1-Dev/In Progrs', '2-TSTG/Tstg In Progrs', 
      'On Hold', 'Closed'
    ].includes(status);
  });

  return (
    <div className="p-4">
      <div className="mb-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p: any) => (
              <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="flex gap-3 min-h-full pb-4">
          {activeStatuses.map((status) => {
            const tasks = kanbanData[status] || [];
            const colors = TASK_STATUS_COLORS[status] || { bg: "bg-gray-500/20", text: "text-gray-500", border: "border-gray-500" };
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
                  <span className={cn("font-medium text-xs", colors.text)}>{status}</span>
                  <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[20px] justify-center">
                    {tasks.length}
                  </Badge>
                </div>

                {/* Column Content */}
                <div
                  className={cn(
                    "flex-1 bg-muted/20 rounded-b-lg p-2 min-h-[300px] space-y-2 transition-colors",
                    isDragOver && "bg-primary/10 ring-2 ring-primary/30"
                  )}
                >
                  {tasks.map((task: any) => (
                    <Card
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                        draggedTask?._id === task._id && "opacity-50 scale-95"
                      )}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Drag Handle & Task ID */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground font-mono">{task.task_id}</span>
                        </div>

                        {/* Title */}
                        <p className="font-medium text-sm line-clamp-2">{task.name}</p>

                        {/* Priority */}
                        {task.priority && task.priority !== 'None' && (
                          <Badge variant="outline" className="text-[10px]">
                            {task.priority}
                          </Badge>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className={new Date(task.due_date) < new Date() ? "text-red-500" : ""}>
                              {format(new Date(task.due_date), "dd/MM/yy")}
                            </span>
                          </div>
                        )}

                        {/* Owner & Tags */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          {(task.current_owner || task.owners?.length > 0) && (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {(task.current_owner || task.owners?.[0])?.first_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {task.owners?.length > 1 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Users className="h-3 w-3" />
                                  +{task.owners.length - 1}
                                </span>
                              )}
                            </div>
                          )}
                          {task.tags?.length > 0 && (
                            <div className="flex gap-1">
                              {task.tags.slice(0, 1).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default TaskKanbanView;
