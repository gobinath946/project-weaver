import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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

interface TimeLogDialogProps {
  open: boolean;
  onClose: () => void;
  timeLog?: any;
  onSuccess?: () => void;
  defaultProjectId?: string;
}

const TimeLogDialog = ({ open, onClose, timeLog, onSuccess, defaultProjectId }: TimeLogDialogProps) => {
  const { toast } = useToast();
  const isEdit = !!timeLog;

  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    task_id: "",
    bug_id: "",
    date: new Date() as Date | null,
    daily_log_hours: "",
    start_time: "",
    end_time: "",
    billing_type: "Billable",
    notes: "",
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
    enabled: open,
  });


  const { data: tasksData } = useQuery({
    queryKey: ["project-tasks", formData.project_id],
    queryFn: async () => {
      const response = await projectServices.getTasksByProject(formData.project_id);
      return response.data.data;
    },
    enabled: !!formData.project_id,
  });

  const { data: bugsData } = useQuery({
    queryKey: ["project-bugs", formData.project_id],
    queryFn: async () => {
      const response = await projectServices.getBugsByProject(formData.project_id);
      return response.data.data;
    },
    enabled: !!formData.project_id,
  });

  useEffect(() => {
    if (timeLog) {
      setFormData({
        title: timeLog.title || "",
        project_id: timeLog.project_id?._id || "",
        task_id: timeLog.task_id?._id || "",
        bug_id: timeLog.bug_id?._id || "",
        date: timeLog.date ? new Date(timeLog.date) : new Date(),
        daily_log_hours: timeLog.daily_log_hours?.toString() || "",
        start_time: timeLog.start_time || "",
        end_time: timeLog.end_time || "",
        billing_type: timeLog.billing_type || "Billable",
        notes: timeLog.notes || "",
      });
    } else {
      setFormData({
        title: "", project_id: defaultProjectId || "", task_id: "", bug_id: "",
        date: new Date(), daily_log_hours: "", start_time: "", end_time: "",
        billing_type: "Billable", notes: "",
      });
    }
  }, [timeLog, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createTimeLog(data),
    onSuccess: () => {
      toast({ title: "Time log created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create time log", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateTimeLog(timeLog._id, data),
    onSuccess: () => {
      toast({ title: "Time log updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update time log", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      daily_log_hours: parseFloat(formData.daily_log_hours) || 0,
      task_id: formData.task_id || undefined,
      bug_id: formData.bug_id || undefined,
    };
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Time Log" : "Add Time Log"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v, task_id: "", bug_id: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projectsData?.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date || undefined}
                    onSelect={(d) => setFormData({ ...formData, date: d || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <Select
                value={formData.task_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, task_id: v === "none" ? "" : v, bug_id: "" })}
                disabled={!formData.project_id}
              >
                <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tasksData?.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bug</Label>
              <Select
                value={formData.bug_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, bug_id: v === "none" ? "" : v, task_id: "" })}
                disabled={!formData.project_id}
              >
                <SelectTrigger><SelectValue placeholder="Select bug" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {bugsData?.map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.daily_log_hours}
                onChange={(e) => setFormData({ ...formData, daily_log_hours: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Billing Type</Label>
            <Select
              value={formData.billing_type}
              onValueChange={(v) => setFormData({ ...formData, billing_type: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Billable">Billable</SelectItem>
                <SelectItem value="Non-Billable">Non-Billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !formData.project_id || !formData.date || !formData.daily_log_hours}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeLogDialog;
