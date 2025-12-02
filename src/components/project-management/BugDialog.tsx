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

interface BugDialogProps { open: boolean; onClose: () => void; bug?: any; onSuccess?: () => void; }

const BugDialog = ({ open, onClose, bug, onSuccess }: BugDialogProps) => {
  const { toast } = useToast();
  const isEdit = !!bug;
  const [formData, setFormData] = useState({
    title: "", description: "", project_id: "", assignee: "", status: "Open",
    severity: "None", classification: "Functional Bug", module: "", reproducible: "Always",
    due_date: null as Date | null,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => (await projectServices.getProjects({ limit: 100 })).data.data,
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => (await projectServices.getProjectUsers()).data.data,
    enabled: open,
  });

  useEffect(() => {
    if (bug) {
      setFormData({
        title: bug.title || "", description: bug.description || "",
        project_id: bug.project_id?._id || "", assignee: bug.assignee?._id || "",
        status: bug.status || "Open", severity: bug.severity || "None",
        classification: bug.classification || "Functional Bug", module: bug.module || "",
        reproducible: bug.reproducible || "Always",
        due_date: bug.due_date ? new Date(bug.due_date) : null,
      });
    } else {
      setFormData({ title: "", description: "", project_id: "", assignee: "", status: "Open", severity: "None", classification: "Functional Bug", module: "", reproducible: "Always", due_date: null });
    }
  }, [bug, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createBug(data),
    onSuccess: () => { toast({ title: "Bug created" }); onSuccess?.(); },
    onError: () => { toast({ title: "Failed", variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateBug(bug._id, data),
    onSuccess: () => { toast({ title: "Bug updated" }); onSuccess?.(); },
    onError: () => { toast({ title: "Failed", variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEdit ? updateMutation.mutate(formData) : createMutation.mutate(formData);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Bug" : "Report Bug"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Project *</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{projectsData?.map((p: any) => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Assignee</Label>
              <Select value={formData.assignee} onValueChange={(v) => setFormData({ ...formData, assignee: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{usersData?.map((u: any) => <SelectItem key={u._id} value={u._id}>{u.first_name} {u.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem><SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem><SelectItem value="Moved to UAT">Moved to UAT</SelectItem>
                  <SelectItem value="Ready for Production">Ready for Production</SelectItem><SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem><SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Major">Major</SelectItem><SelectItem value="Critical">Critical</SelectItem><SelectItem value="Blocker">Blocker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Classification</Label>
              <Select value={formData.classification} onValueChange={(v) => setFormData({ ...formData, classification: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Functional Bug">Functional Bug</SelectItem><SelectItem value="UI Bug">UI Bug</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem><SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Module</Label><Input value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start", !formData.due_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{formData.due_date ? format(formData.due_date, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.due_date || undefined} onSelect={(d) => setFormData({ ...formData, due_date: d || null })} /></PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEdit ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BugDialog;
