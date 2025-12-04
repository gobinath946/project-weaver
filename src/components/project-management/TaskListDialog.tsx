import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { projectServices } from "@/api/services";
import { TASK_LIST_FLAG } from "@/constants/taskConstants";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X, Plus } from "lucide-react";

interface TaskListDialogProps {
  open: boolean;
  onClose: () => void;
  taskList?: any;
  projectId?: string;
  onSuccess?: () => void;
}

const TaskListDialog = ({ open, onClose, taskList, projectId, onSuccess }: TaskListDialogProps) => {
  const { toast } = useToast();
  const isEdit = !!taskList;

  const [formData, setFormData] = useState({
    name: "",
    project_id: projectId || "",
    related_milestone: "",
    task_list_flag: "Internal",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
    enabled: open && !projectId,
  });

  useEffect(() => {
    if (taskList) {
      setFormData({
        name: taskList.name || "",
        project_id: taskList.project_id?._id || taskList.project_id || projectId || "",
        related_milestone: taskList.related_milestone?._id || "",
        task_list_flag: taskList.task_list_flag || "Internal",
        tags: taskList.tags || [],
      });
    } else {
      setFormData({
        name: "",
        project_id: projectId || "",
        related_milestone: "",
        task_list_flag: "Internal",
        tags: [],
      });
    }
    setTagInput("");
  }, [taskList, projectId, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createTaskList(data.project_id, data),
    onSuccess: () => {
      toast({ title: "Task list created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create task list", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateTaskList(taskList._id, data),
    onSuccess: () => {
      toast({ title: "Task list updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update task list", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      related_milestone: formData.related_milestone || undefined,
    };
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? "Edit Task List" : "New Task List"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project */}
            {!projectId && (
              <div className="space-y-2">
                <Label>Project <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsData?.map((p: any) => (
                      <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Task List Name */}
            <div className="space-y-2">
              <Label>Task List <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter task list name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Clone from Task Template | Clone from a Project or Project Template
              </p>
            </div>

            {/* Related Milestone */}
            <div className="space-y-2">
              <Label>Related Milestone</Label>
              <Select
                value={formData.related_milestone || "none"}
                onValueChange={(v) => setFormData({ ...formData, related_milestone: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {/* Milestones would be loaded here */}
                </SelectContent>
              </Select>
            </div>

            {/* Task List Flag */}
            <div className="space-y-2">
              <Label>Task List Flag</Label>
              <Select
                value={formData.task_list_flag}
                onValueChange={(v) => setFormData({ ...formData, task_list_flag: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_LIST_FLAG.map((flag) => (
                    <SelectItem key={flag} value={flag}>{flag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Enter a tag name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleSubmit} disabled={isLoading}>Add More</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.name || !formData.project_id}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update" : "Add"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskListDialog;
