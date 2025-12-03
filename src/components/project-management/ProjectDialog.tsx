import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
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

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project?: any;
  onSuccess?: () => void;
}

const ProjectDialog = ({ open, onClose, project, onSuccess }: ProjectDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!project;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    owner: "",
    status: "Active",
    visibility: "Private",
    strict_project: false,
    project_group: "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    tags: [] as string[],
    allocated_users: [] as string[],
    allocated_time: 0,
  });

  const [tagInput, setTagInput] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => {
      const response = await projectServices.getProjectUsers();
      return response.data.data;
    },
    enabled: open,
  });

  const { data: groupsData } = useQuery({
    queryKey: ["project-groups"],
    queryFn: async () => {
      const response = await projectServices.getProjectGroups();
      return response.data.data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        owner: project.owner?._id || "",
        status: project.status || "Active",
        visibility: project.visibility || "Private",
        strict_project: project.strict_project || false,
        project_group: project.project_group?._id || "",
        start_date: project.start_date ? new Date(project.start_date) : null,
        end_date: project.end_date ? new Date(project.end_date) : null,
        tags: project.tags || [],
        allocated_users: project.allocated_users?.map((u: any) => u._id) || [],
        allocated_time: project.allocated_time || 0,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        owner: "",
        status: "Active",
        visibility: "Private",
        strict_project: false,
        project_group: "",
        start_date: null,
        end_date: null,
        tags: [],
        allocated_users: [],
        allocated_time: 0,
      });
    }
    setTagInput("");
  }, [project, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createProject(data),
    onSuccess: () => {
      toast({ title: "Project created successfully" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateProject(project._id, data),
    onSuccess: () => {
      toast({ title: "Project updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      project_group: formData.project_group || undefined,
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

  const handleToggleUser = (userId: string) => {
    const newUsers = formData.allocated_users.includes(userId)
      ? formData.allocated_users.filter((id) => id !== userId)
      : [...formData.allocated_users, userId];
    setFormData({ ...formData, allocated_users: newUsers });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const selectedUsers = usersData?.filter((u: any) => formData.allocated_users.includes(u._id)) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? "Edit Project" : "New Project"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Project Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter project title"
                required
              />
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={formData.owner}
                onValueChange={(value) => setFormData({ ...formData, owner: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? format(formData.start_date, "dd/MM/yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, "dd/MM/yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Strict Project */}
            <div className="flex items-center justify-between">
              <Label htmlFor="strict">Make this a strict project</Label>
              <Switch
                id="strict"
                checked={formData.strict_project}
                onCheckedChange={(checked) => setFormData({ ...formData, strict_project: checked })}
              />
            </div>

            {/* Project Group */}
            <div className="space-y-2">
              <Label>Project Group</Label>
              <Select
                value={formData.project_group || "none"}
                onValueChange={(value) => setFormData({ ...formData, project_group: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Group</SelectItem>
                  {groupsData?.map((group: any) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                rows={4}
              />
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

            {/* Allocated Time & Users Count */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allocated_time">Allocated Time (Hours)</Label>
                <Input
                  id="allocated_time"
                  type="number"
                  min="0"
                  value={formData.allocated_time}
                  onChange={(e) => setFormData({ ...formData, allocated_time: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>No. of Allocated Users</Label>
                <Input
                  value={formData.allocated_users.length}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Allocated Users */}
            <div className="space-y-2">
              <Label>Allocated Users</Label>
              <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} user(s) selected`
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
                            onSelect={() => handleToggleUser(user._id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.allocated_users.includes(user._id)
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
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user: any) => (
                    <Badge key={user._id} variant="secondary" className="gap-1">
                      {user.first_name} {user.last_name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleToggleUser(user._id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Project Access */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-medium">Project Access</Label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.visibility === "Private"}
                    onChange={() => setFormData({ ...formData, visibility: "Private" })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">Private</p>
                    <p className="text-xs text-muted-foreground">
                      Only project users can view and access this project.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={formData.visibility === "Public"}
                    onChange={() => setFormData({ ...formData, visibility: "Public" })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">Public</p>
                    <p className="text-xs text-muted-foreground">
                      Portal users can only view, follow, and comment whereas project users will have complete access.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update" : "Add"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectDialog;
