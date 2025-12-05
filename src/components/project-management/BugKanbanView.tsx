import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectServices } from "@/api/services";
import { BUG_STATUS, BUG_STATUS_COLORS, BUG_SEVERITY_COLORS } from "@/constants/bugConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Calendar, GripVertical, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BugKanbanViewProps {
  onBugClick?: (bug: any) => void;
  projectFilter?: string;
}

const BugKanbanView = ({ onBugClick, projectFilter }: BugKanbanViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedBug, setDraggedBug] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bugs-kanban", projectFilter],
    queryFn: async () => {
      const params: any = {};
      if (projectFilter && projectFilter !== 'all') {
        params.project_id = projectFilter;
      }
      const response = await projectServices.getBugsKanban(params);
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectServices.updateBug(id, { status }),
    onSuccess: () => {
      toast({ title: "Bug status updated" });
      queryClient.invalidateQueries({ queryKey: ["bugs-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["bugs"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const handleDragStart = (e: React.DragEvent, bug: any) => {
    setDraggedBug(bug);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", bug._id);
  };

  const handleDragEnd = () => {
    setDraggedBug(null);
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

    if (draggedBug && draggedBug.status !== newStatus) {
      updateStatusMutation.mutate({
        id: draggedBug._id,
        status: newStatus,
      });
    }
    setDraggedBug(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(6)].map((_, i) => (
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
        {BUG_STATUS.map((status) => {
          const bugs = kanbanData[status] || [];
          const colors = BUG_STATUS_COLORS[status] || { bg: "bg-gray-500/20", text: "text-gray-500", border: "border-gray-500" };
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
                  {bugs.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div
                className={cn(
                  "flex-1 bg-muted/20 rounded-b-lg p-2 min-h-[300px] space-y-2 transition-colors",
                  isDragOver && "bg-primary/10 ring-2 ring-primary/30"
                )}
              >
                {bugs.map((bug: any) => {
                  const severityColors = BUG_SEVERITY_COLORS[bug.severity] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
                  
                  return (
                    <Card
                      key={bug._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bug)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                        draggedBug?._id === bug._id && "opacity-50 scale-95"
                      )}
                      onClick={() => onBugClick?.(bug)}
                    >
                      <CardContent className="p-3 space-y-2.5">
                        {/* Drag Handle & Bug ID */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground font-mono">{bug.bug_id}</span>
                          {bug.severity && bug.severity !== 'None' && (
                            <Badge className={cn("text-[9px] px-1 py-0 h-4 ml-auto", severityColors.bg, severityColors.text)}>
                              {bug.severity}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <p className="font-medium text-sm line-clamp-2">{bug.title}</p>

                        {/* Project */}
                        {bug.project_id && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {bug.project_id.title}
                          </div>
                        )}

                        {/* Classification & Flag */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {bug.classification && bug.classification !== 'None' && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {bug.classification}
                            </Badge>
                          )}
                          {bug.flag && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {bug.flag}
                            </Badge>
                          )}
                        </div>

                        {/* Due Date */}
                        {bug.due_date && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className={new Date(bug.due_date) < new Date() && bug.status !== 'Closed' ? "text-red-500" : ""}>
                              {format(new Date(bug.due_date), "dd/MM/yy")}
                            </span>
                          </div>
                        )}

                        {/* Reporter & Assignee */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          {bug.reporter && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-muted-foreground">By:</span>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {bug.reporter.first_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] truncate max-w-[50px]">
                                {bug.reporter.first_name}
                              </span>
                            </div>
                          )}
                          {bug.assignee && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-muted-foreground">To:</span>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {bug.assignee.first_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] truncate max-w-[50px]">
                                {bug.assignee.first_name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {bug.tags?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {bug.tags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 h-4">
                                {tag}
                              </Badge>
                            ))}
                            {bug.tags.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{bug.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {bugs.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Drop bugs here
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

export default BugKanbanView;
