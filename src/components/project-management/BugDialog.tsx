import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { projectServices } from "@/api/services";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  BUG_STATUS, 
  BUG_STATUS_COLORS, 
  BUG_SEVERITY, 
  BUG_CLASSIFICATION, 
  BUG_REPRODUCIBLE, 
  BUG_FLAG 
} from "@/constants/bugConstants";

interface BugDialogProps {
  open: boolean;
  onClose: () => void;
  bug?: any;
  onSuccess?: () => void;
}

const BugDialog = ({ open, onClose, bug, onSuccess }: BugDialogProps) => {
  const { toast } = useToast();
  const isEdit = !!bug;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assignee: "",
    status: "Open",
    severity: "None",
    classification: "None",
    module: "",
    reproducible: "None",
    flag: "Internal",
    due_date: null as Date | null,
    tags: [] as string[],
    followers: [] as string[],
    release_milestone: "",
    affected_milestone: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [followerSearchOpen, setFollowerSearchOpen] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => {
      const response = await projectServices.getProjectUsers();
      return response.data.data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (bug) {
      setFormData({
        title: bug.title || "",
        description: bug.description || "",
        project_id: bug.project_id?._id || "",
        assignee: bug.assignee?._id || "",
        status: bug.status || "Open",
        severity: bug.severity || "None",
        classification: bug.classification || "None",
        module: bug.module || "",
        reproducible: bug.reproducible || "None",
        flag: bug.flag || "Internal",
        due_date: bug.due_date ? new Date(bug.due_date) : null,
        tags: bug.tags || [],
        followers: bug.followers?.map((f: any) => f._id) || [],
        release_milestone: bug.release_milestone || "",
        affected_milestone: bug.affected_milestone || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        project_id: "",
        assignee: "",
        status: "Open",
        severity: "None",
        classification: "None",
        module: "",
        reproducible: "None",
        flag: "Internal",
        due_date: null,
        tags: [],
        followers: [],
        release_milestone: "",
        affected_milestone: "",
      });
    }
    setTagInput("");
  }, [bug, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createBug(data),
    onSuccess: () => {
      toast({ title: "Bug created successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create bug", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateBug(bug._id, data),
    onSuccess: () => {
      toast({ title: "Bug updated successfully" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update bug", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.project_id) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const data = {
      ...formData,
      assignee: formData.assignee || undefined,
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

  const handleToggleFollower = (userId: string) => {
    const newFollowers = formData.followers.includes(userId)
      ? formData.followers.filter((id) => id !== userId)
      : [...formData.followers, userId];
    setFormData({ ...formData, followers: newFollowers });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedFollowers = usersData?.filter((u: any) => formData.followers.includes(u._id)) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? "Edit Bug" : "Submit Bug"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project */}
            <div className="space-y-2">
              <Label>Project <span className="text-destructive">*</span></Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsData?.map((project: any) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bug Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Bug Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter bug title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the bug in detail"
                rows={4}
              />
            </div>

            {/* Followers */}
            <div className="space-y-2">
              <Label>Add Followers</Label>
              <Popover open={followerSearchOpen} onOpenChange={setFollowerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedFollowers.length > 0
                      ? `${selectedFollowers.length} follower(s) selected`
                      : "Select followers"}
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
                            onSelect={() => handleToggleFollower(user._id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.followers.includes(user._id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.first_name} {user.last_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedFollowers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFollowers.map((user: any) => (
                    <Badge key={user._id} variant="secondary" className="gap-1">
                      {user.first_name} {user.last_name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleToggleFollower(user._id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Bug Information Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <Label className="text-base font-medium">Bug Information</Label>

              {/* Assignee */}
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={formData.assignee}
                  onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
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

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, "dd/MM/yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, due_date: date || null })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUG_SEVERITY.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select
                  value={formData.classification}
                  onValueChange={(value) => setFormData({ ...formData, classification: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUG_CLASSIFICATION.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reproducible */}
              <div className="space-y-2">
                <Label>Reproducible</Label>
                <Select
                  value={formData.reproducible}
                  onValueChange={(value) => setFormData({ ...formData, reproducible: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reproducibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUG_REPRODUCIBLE.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flag */}
              <div className="space-y-2">
                <Label>Flag</Label>
                <Select
                  value={formData.flag}
                  onValueChange={(value) => setFormData({ ...formData, flag: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flag" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUG_FLAG.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
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
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status - Only show in edit mode */}
            {isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUG_STATUS.map((status) => {
                      const colors = BUG_STATUS_COLORS[status] || { bg: "bg-gray-500/20", text: "text-gray-500" };
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", colors.bg.replace("/20", ""))} />
                            {status}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update" : "Submit Bug"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BugDialog;
