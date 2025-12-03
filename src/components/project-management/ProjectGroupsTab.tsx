import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { projectServices } from "@/api/services";
import { useToast } from "@/components/ui/use-toast";
import { Plus, MoreVertical, Edit, Trash2, Loader2, FolderKanban } from "lucide-react";

interface ProjectGroup {
  _id: string;
  name: string;
  description?: string;
  color: string;
  project_count: number;
}

const ProjectGroupsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProjectGroup | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#6366f1" });

  const { data, isLoading } = useQuery({
    queryKey: ["project-groups"],
    queryFn: async () => {
      const response = await projectServices.getProjectGroups();
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => projectServices.createProjectGroup(data),
    onSuccess: () => {
      toast({ title: "Project group created successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-groups"] });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to create project group", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateProjectGroup(selectedGroup!._id, data),
    onSuccess: () => {
      toast({ title: "Project group updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-groups"] });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Failed to update project group", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteProjectGroup(id),
    onSuccess: () => {
      toast({ title: "Project group deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-groups"] });
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
    },
    onError: () => {
      toast({ title: "Failed to delete project group", variant: "destructive" });
    },
  });

  const handleOpenDialog = (group?: ProjectGroup) => {
    if (group) {
      setSelectedGroup(group);
      setFormData({ name: group.name, description: group.description || "", color: group.color });
    } else {
      setSelectedGroup(null);
      setFormData({ name: "", description: "", color: "#6366f1" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGroup(null);
    setFormData({ name: "", description: "", color: "#6366f1" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (group: ProjectGroup) => {
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Project Groups</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        {data?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No project groups</h3>
            <p className="text-muted-foreground mb-4">Create groups to organize your projects</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.map((group: ProjectGroup) => (
              <Card key={group._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                      style={{ backgroundColor: group.color }}
                    >
                      {getInitials(group.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium truncate">{group.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {group.project_count} project{group.project_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(group)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(group)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGroup ? "Edit Group" : "New Group"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Group <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-transform ${
                      formData.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedGroup ? "Update" : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedGroup?.name}"? Projects in this group will be ungrouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedGroup && deleteMutation.mutate(selectedGroup._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectGroupsTab;
