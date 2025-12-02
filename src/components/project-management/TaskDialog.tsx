import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { projectServices } from "@/api/services";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  onSuccess?: () => void;
}

const TaskDialog = ({ open, onClose, task, onSuccess }: TaskDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    name: "", description: "", project_id: "", task_list_id: "", assignee: "",
    status: "Not Started", priority: "None", start_date: null as Date | null,
    due_date: null as Date | null, work_hours_estimate: "",
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => { const r = await projectServices.getProjects({ limit: 100 }); return r.data.data; },
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => { const r = await projectServices.getProjectUsers(); return r.data.data; },
    enabled: open,
  });

  const { data: taskListsData } = useQuery({
    queryKey: ["task-lists", formData.project_id],
    queryFn: async () => { const r = await projectServices.getTaskLists(formData.project_id); return r.data.data; },
    enabled: !!formData.project_id,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || "", description: task.description || "",
        project_id: task.project_id?._id || "", task_list_id: task.task_list_id?._id || "",
        assignee: task.assignee?._id || "", status: task.status || "Not Started",
        priority: task.priority || "None",
        start_date: task.start_date ? new Date(task.start_date) : null,
        due_date: task.due_date ? new Date(task.due_date) : null,
        work_hours_estimate: task.work_hours_estimate?.toString() || "",
      });
    } else {
      setFormData({
        name: "", description: "", project_id: "", task_list_id: "", assignee: "",
        status: "Not Started", priority: "None", start_date: null, due_date: null, work_hours_estimate: "",
      });
    }
  }, [task, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createTask(data),
    onSuccess: () => { toast({ title: "Task created successfully" }); onSuccess?.(); },
    onError: () => { toast({ title: "Failed to create task", variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateTask(task._id, data),
    onSuccess: () => { toast({ title: "Task updated successfully" }); onSuccess?.(); },
    onError: () => { toast({ title: "Failed to update task", variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...formData, work_hours_estimate: formData.work_hours_estimate ? parseFloat(formData.work_hours_estimate) : 0 };
    if (!data.task_list_id) delete data.task_list_id;
    if (!data.assignee) delete data.assignee;
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Task Name *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v, task_list_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projectsData?.map((p: any) => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task List</Label>
              <Select value={formData.task_list_id || "none"} onValueChange={(v) => setFormData({ ...formData, task_list_id: v === "none" ? "" : v })} disabled={!formData.project_id}>
                <SelectTrigger><SelectValue placeholder="Select task list" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {taskListsData?.map((tl: any) => <SelectItem key={tl._id} value={tl._id}>{tl.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={formData.assignee} onValueChange={(v) => setFormData({ ...formData, assignee: v })}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {usersData?.map((u: any) => <SelectItem key={u._id} value={u._id}>{u.first_name} {u.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Work Hours Estimate</Label>
              <Input type="number" value={formData.work_hours_estimate} onChange={(e) => setFormData({ ...formData, work_hours_estimate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.start_date || undefined} onSelect={(d) => setFormData({ ...formData, start_date: d || null })} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.due_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.due_date || undefined} onSelect={(d) => setFormData({ ...formData, due_date: d || null })} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
