import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { projectServices } from "@/api/services";
import { TASK_STATUS, TASK_PRIORITY, BILLING_TYPE, REMINDER_OPTIONS, WORK_HOURS_TYPE } from "@/constants/taskConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, Check, ChevronsUpDown, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkHoursEntry {
  user_id: string;
  business_hours: string;
  total_hours: number;
  duration: string;
  work_hours_per_day: number;
}

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  onSuccess?: () => void;
  defaultProjectId?: string;
}

const TaskDialog = ({ open, onClose, task, onSuccess, defaultProjectId }: TaskDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!task;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_id: "",
    task_list_id: "",
    owners: [] as string[],
    current_owner: "",
    status: "1-Dev/Open",
    priority: "None",
    start_date: null as Date | null,
    due_date: null as Date | null,
    total_estimation: 0,
    estimation_split: {
      integration_estimate: 0,
      web_dev_estimate: 0,
      sfdc_estimate: 0,
      bi_estimate: 0,
      testing_estimate: 0,
      infra_devops_estimate: 0,
    },
    work_hours: "0:00",
    work_hours_type: "Standard" as "Standard" | "Flexible",
    work_hours_entries: [] as WorkHoursEntry[],
    tags: [] as string[],
    billing_type: "None",
    outcome: "",
    reminder: "None",
    recurrence: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [ownerSearchOpen, setOwnerSearchOpen] = useState(false);
  const [workHoursOpen, setWorkHoursOpen] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const r = await projectServices.getProjects({ limit: 100 });
      return r.data.data;
    },
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => {
      const r = await projectServices.getProjectUsers();
      return r.data.data;
    },
    enabled: open,
  });

  const { data: taskListsData } = useQuery({
    queryKey: ["task-lists", formData.project_id],
    queryFn: async () => {
      const r = await projectServices.getTaskLists(formData.project_id);
      return r.data.data;
    },
    enabled: !!formData.project_id,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || "",
        description: task.description || "",
        project_id: task.project_id?._id || "",
        task_list_id: task.task_list_id?._id || "",
        owners: task.owners?.map((o: any) => o._id) || [],
        current_owner: task.current_owner?._id || task.owner?._id || "",
        status: task.status || "1-Dev/Open",
        priority: task.priority || "None",
        start_date: task.start_date ? new Date(task.start_date) : null,
        due_date: task.due_date ? new Date(task.due_date) : null,
        total_estimation: task.total_estimation || 0,
        estimation_split: task.estimation_split || {
          integration_estimate: 0,
          web_dev_estimate: 0,
          sfdc_estimate: 0,
          bi_estimate: 0,
          testing_estimate: 0,
          infra_devops_estimate: 0,
        },
        work_hours: task.work_hours || "0:00",
        work_hours_type: task.work_hours_type || "Standard",
        work_hours_entries: task.work_hours_entries || [],
        tags: task.tags || [],
        billing_type: task.billing_type || "None",
        outcome: task.outcome || "",
        reminder: task.reminder || "None",
        recurrence: task.recurrence || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        project_id: defaultProjectId || "",
        task_list_id: "",
        owners: [],
        current_owner: "",
        status: "1-Dev/Open",
        priority: "None",
        start_date: null,
        due_date: null,
        total_estimation: 0,
        estimation_split: {
          integration_estimate: 0,
          web_dev_estimate: 0,
          sfdc_estimate: 0,
          bi_estimate: 0,
          testing_estimate: 0,
          infra_devops_estimate: 0,
        },
        work_hours: "0:00",
        work_hours_type: "Standard",
        work_hours_entries: [],
        tags: [],
        billing_type: "None",
        outcome: "",
        reminder: "None",
        recurrence: "",
      });
    }
    setTagInput("");
  }, [task, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createTask(data),
    onSuccess: () => {
      toast({ title: "Task created successfully" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateTask(task._id, data),
    onSuccess: () => {
      toast({ title: "Task updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      task_list_id: formData.task_list_id || undefined,
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

  const handleToggleOwner = (userId: string) => {
    const newOwners = formData.owners.includes(userId)
      ? formData.owners.filter((id) => id !== userId)
      : [...formData.owners, userId];
    setFormData({ ...formData, owners: newOwners });
  };

  const updateEstimation = (field: string, value: number) => {
    const newSplit = { ...formData.estimation_split, [field]: value };
    const total = Object.values(newSplit).reduce((sum, v) => sum + v, 0);
    setFormData({ 
      ...formData, 
      estimation_split: newSplit,
      total_estimation: total
    });
  };

  const calculateTotalWorkHours = () => {
    const totalMinutes = formData.work_hours_entries.reduce((sum, entry) => sum + (entry.total_hours * 60), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedOwners = usersData?.filter((u: any) => formData.owners.includes(u._id)) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? "Edit Task" : "New Task"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project */}
            <div className="space-y-2">
              <Label>Project <span className="text-destructive">*</span></Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) => setFormData({ ...formData, project_id: v, task_list_id: "" })}
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

            {/* Task Name */}
            <div className="space-y-2">
              <Label>Task Name <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter task name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Add Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            {/* Task List */}
            <div className="space-y-2">
              <Label>Task List</Label>
              <Select
                value={formData.task_list_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, task_list_id: v === "none" ? "" : v })}
                disabled={!formData.project_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {taskListsData?.map((tl: any) => (
                    <SelectItem key={tl._id} value={tl._id}>{tl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Task Information Section */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full">
                <ChevronDown className="h-4 w-4" />
                <span className="font-medium">Task Information</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {/* Owners */}
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Popover open={ownerSearchOpen} onOpenChange={setOwnerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedOwners.length > 0
                          ? `${selectedOwners.length} user(s) selected`
                          : "Select users"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {usersData?.map((user: any) => (
                              <CommandItem
                                key={user._id}
                                value={`${user.first_name} ${user.last_name}`}
                                onSelect={() => handleToggleOwner(user._id)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.owners.includes(user._id) ? "opacity-100" : "opacity-0")} />
                                {user.first_name} {user.last_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedOwners.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedOwners.map((user: any) => (
                        <Badge key={user._id} variant="secondary" className="gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">{user.first_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.first_name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleOwner(user._id)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Owner */}
                <div className="space-y-2">
                  <Label>Current Owner <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.current_owner}
                    onValueChange={(v) => setFormData({ ...formData, current_owner: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select current owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.map((user: any) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimation Split */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Integration Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.integration_estimate}
                      onChange={(e) => updateEstimation('integration_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Web Dev Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.web_dev_estimate}
                      onChange={(e) => updateEstimation('web_dev_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">SFDC Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.sfdc_estimate}
                      onChange={(e) => updateEstimation('sfdc_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">BI Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.bi_estimate}
                      onChange={(e) => updateEstimation('bi_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Testing Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.testing_estimate}
                      onChange={(e) => updateEstimation('testing_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Infra & Devops Estimate</Label>
                    <Input
                      type="number"
                      value={formData.estimation_split.infra_devops_estimate}
                      onChange={(e) => updateEstimation('infra_devops_estimate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Work Hours */}
                <Collapsible open={workHoursOpen} onOpenChange={setWorkHoursOpen}>
                  <div className="space-y-2">
                    <Label>Work Hours</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.work_hours || calculateTotalWorkHours()}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="pt-4 space-y-4 border rounded-lg p-4 mt-2">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.work_hours_type === "Standard"}
                          onChange={() => setFormData({ ...formData, work_hours_type: "Standard" })}
                        />
                        Standard
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.work_hours_type === "Flexible"}
                          onChange={() => setFormData({ ...formData, work_hours_type: "Flexible" })}
                        />
                        Flexible
                      </label>
                    </div>
                    
                    {selectedOwners.length > 0 && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground">
                          <span>Owner</span>
                          <span>Business Hours</span>
                          <span>Total Hours</span>
                          <span>Duration</span>
                          <span>Work Hours/Day</span>
                        </div>
                        {selectedOwners.map((user: any) => {
                          const entry = formData.work_hours_entries.find(e => e.user_id === user._id) || {
                            user_id: user._id,
                            business_hours: 'Standard Business Hours',
                            total_hours: 0,
                            duration: '0d',
                            work_hours_per_day: 0
                          };
                          return (
                            <div key={user._id} className="grid grid-cols-5 gap-2 items-center">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{user.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate">{user.first_name}</span>
                              </div>
                              <span className="text-xs text-primary">{entry.business_hours}</span>
                              <Input
                                type="number"
                                className="h-8"
                                value={entry.total_hours}
                                onChange={(e) => {
                                  const newEntries = formData.work_hours_entries.filter(en => en.user_id !== user._id);
                                  newEntries.push({ ...entry, total_hours: parseFloat(e.target.value) || 0 });
                                  setFormData({ ...formData, work_hours_entries: newEntries });
                                }}
                              />
                              <span className="text-sm">{entry.duration}</span>
                              <span className="text-sm">- hrs/day</span>
                            </div>
                          );
                        })}
                        <div className="text-right font-medium">
                          {calculateTotalWorkHours()} hours
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "dd/MM/yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                          {formData.due_date ? format(formData.due_date, "dd/MM/yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={formData.due_date || undefined} onSelect={(d) => setFormData({ ...formData, due_date: d || null })} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITY.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isEdit && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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

                {/* Reminder & Recurrence */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reminder</Label>
                    <Select value={formData.reminder} onValueChange={(v) => setFormData({ ...formData, reminder: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REMINDER_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recurrence</Label>
                    <Input
                      value={formData.recurrence}
                      onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                      placeholder="e.g., Weekly"
                    />
                  </div>
                </div>

                {/* Billing Type */}
                <div className="space-y-2">
                  <Label>Billing Type</Label>
                  <Select value={formData.billing_type} onValueChange={(v) => setFormData({ ...formData, billing_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BILLING_TYPE.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Outcome */}
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Textarea
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    placeholder="Enter expected outcome"
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
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

export default TaskDialog;
