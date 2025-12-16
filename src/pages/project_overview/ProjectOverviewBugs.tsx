import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { projectServices } from "@/api/services";
import BugListView from "@/components/project-management/BugListView";
import BugDialog from "@/components/project-management/BugDialog";
import BugDetailModal from "@/components/project-management/BugDetailModal";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Bug, TrendingUp, ListCheck, Timer } from "lucide-react";

const ProjectOverviewBugs = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Find project by name/title
  const { data: projects } = useQuery({
    queryKey: ["user-projects"],
    queryFn: async () => {
      const response = await projectServices.getUserProjects();
      return response.data.data;
    },
  });

  // Find the project that matches the name in URL
  const currentProject = projects?.find((p: any) => 
    p.title?.toLowerCase().replace(/\s+/g, '-') === projectName ||
    p.project_id?.toLowerCase().replace(/\s+/g, '-') === projectName
  );

  // Get project info
  const { data: projectInfo } = useQuery({
    queryKey: ["project-overview", currentProject?._id],
    queryFn: async () => {
      const response = await projectServices.getProjectOverview(currentProject!._id);
      return response.data.data;
    },
    enabled: !!currentProject?._id,
  });

  // Build query params with project filter
  const buildQueryParams = useCallback(() => {
    return {
      page,
      limit: rowsPerPage,
      project_id: currentProject?._id, // Filter by project
    };
  }, [page, rowsPerPage, currentProject?._id]);

  // Fetch bugs for this specific project
  const {
    data: bugsData,
    isLoading: bugsLoading,
    refetch: refetchBugs,
  } = useQuery({
    queryKey: ["project-bugs", currentProject?._id, page, rowsPerPage],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await projectServices.getBugs(params);
      return response.data;
    },
    enabled: !!currentProject?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteBug(id),
    onSuccess: () => {
      toast({ title: "Bug deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["project-bugs"] });
    },
    onError: () => {
      toast({ title: "Failed to delete bug", variant: "destructive" });
    },
  });

  const bugs = bugsData?.data || [];
  const pagination = bugsData?.pagination || { total_count: 0, total_pages: 1, current_page: 1 };

  const handleEdit = (bug: any) => {
    setSelectedBug(bug);
    setBugDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bug?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (bug: any) => {
    setSelectedBugId(bug._id);
    setDetailModalOpen(true);
  };

  const projectTitle = projectInfo?.project?.title || currentProject?.title || 'Project';

  if (!projects || !currentProject) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-32" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${projectTitle} - Bugs`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="glass-card border-b border-border/30 p-3 sm:p-4 flex-shrink-0 rounded-t-xl flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/project-overview/${projectName}/dashboard`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{projectTitle} - Bugs</h1>
              <p className="text-sm text-muted-foreground">Manage bugs for this project</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setBugDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Bug
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/dashboard`)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/tasks`)}
            className="flex items-center gap-2"
          >
            <ListCheck className="h-4 w-4" />
            Tasks
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Bugs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/timesheets`)}
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            Time Logs
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-card/50 backdrop-blur-sm rounded-b-xl">
          {bugsLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <BugListView
              bugs={bugs}
              isLoading={bugsLoading}
              groupBy="none"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}

          {!bugsLoading && bugs.length === 0 && (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bugs found</h3>
              <p className="text-muted-foreground mb-4">Submit your first bug for this project</p>
              <Button onClick={() => setBugDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Bug
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Show total count */}
        <div className="glass-card border-t border-border/30 py-3 px-3 sm:px-4 flex-shrink-0 rounded-b-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total Bugs:</span>
            <Badge variant="outline">{pagination.total_count}</Badge>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BugDialog
        open={bugDialogOpen}
        onClose={() => {
          setBugDialogOpen(false);
          setSelectedBug(null);
        }}
        bug={selectedBug}
        onSuccess={() => {
          setBugDialogOpen(false);
          setSelectedBug(null);
          refetchBugs();
        }}
        defaultProjectId={currentProject?._id}
      />

      <BugDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedBugId(null);
        }}
        bugId={selectedBugId}
      />
    </DashboardLayout>
  );
};

export default ProjectOverviewBugs;