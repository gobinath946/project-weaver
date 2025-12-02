import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectServices } from "@/api/services";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
    description: "",
    project_id: projectId || "",
  });

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
        description: taskList.description || "",
        project_id: taskList.project_id?._id || taskList.project_id || projectId || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        project_id: projectId || "",
      });
    }
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
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task List" : "Create Task List"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter task list name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          {!projectId && (
            <div className="space-y-2">
              <Label>Project *</Label>
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
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.project_id}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskListDialog;
