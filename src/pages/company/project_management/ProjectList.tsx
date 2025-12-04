import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { projectServices } from "@/api/services";
import type { ViewMode } from "@/components/project-management/ViewToggle";
import ProjectDialog from "@/components/project-management/ProjectDialog";
import ProjectFilterSheet, { ProjectFilters } from "@/components/project-management/ProjectFilterSheet";
import ProjectListView from "@/components/project-management/ProjectListView";
import ProjectKanbanView from "@/components/project-management/ProjectKanbanView";
import ProjectGroupsTab from "@/components/project-management/ProjectGroupsTab";
import { useToast } from "@/components/ui/use-toast";
import { PROJECT_TABS, ProjectTab } from "@/constants/projectConstants";
import {
  Plus,
  Filter,
  FolderKanban,
  List,
  LayoutGrid,
} from "lucide-react";

const ProjectList = () => {
  const [activeTab, setActiveTab] = useState<ProjectTab>("active");
  const [view, setView] = useState<ViewMode>("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filters, setFilters] = useState<ProjectFilters>({ filter_mode: 'all' });

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [goToPage, setGoToPage] = useState("");

  // Sort state
  const [sortField, setSortField] = useState("-created_at");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params: any = {
      page: paginationEnabled ? page : 1,
      limit: paginationEnabled ? rowsPerPage : 1000,
      sort: sortField,
    };

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params[key] = value.toISOString();
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  }, [page, rowsPerPage, paginationEnabled, sortField, filters]);

  // Fetch projects based on active tab
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["projects", activeTab, buildQueryParams()],
    queryFn: async () => {
      if (activeTab === "groups") {
        return null; // Groups tab has its own data fetching
      }
      const params = buildQueryParams();
      const response = await projectServices.getProjectsByTab(activeTab, params);
      return response.data;
    },
    enabled: activeTab !== "groups",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteProject(id),
    onSuccess: () => {
      toast({ title: "Project deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const projects = data?.data || [];
  const pagination = data?.pagination || { total_count: 0, total_pages: 1, current_page: 1 };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProject(null);
  };

  const handleApplyFilters = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortField(`-${field}`);
    } else if (sortField === `-${field}`) {
      setSortField(field);
    } else {
      setSortField(field);
    }
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage);
    if (pageNum >= 1 && pageNum <= pagination.total_pages) {
      setPage(pageNum);
      setGoToPage("");
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'filter_mode' && value && value !== ''
  ).length;

  return (
    <DashboardLayout title="Projects">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b bg-background">
          {/* Left - Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ProjectTab); setPage(1); }}>
            <TabsList className="h-9">
              {PROJECT_TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {activeTab !== "groups" && (
              <>
                {/* View Toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-3 rounded-r-none"
                    onClick={() => setView("list")}
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={view === "kanban" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-3 rounded-l-none"
                    onClick={() => setView("kanban")}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Kanban
                  </Button>
                </div>

                {/* Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterOpen(true)}
                  className="h-8 relative"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </>
            )}

            {/* New Project Button */}
            <Button size="sm" className="h-8" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "groups" ? (
            <ProjectGroupsTab />
          ) : view === "kanban" ? (
            <ProjectKanbanView onProjectClick={handleEdit} />
          ) : (
            <ProjectListView
              projects={projects}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              sortField={sortField.replace('-', '')}
              sortOrder={sortField.startsWith('-') ? 'desc' : 'asc'}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Footer - Pagination */}
        {activeTab !== "groups" && view === "list" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-background">
            {/* Left - Pagination Toggle & Rows */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pagination"
                  checked={paginationEnabled}
                  onCheckedChange={(checked) => {
                    setPaginationEnabled(checked as boolean);
                    setPage(1);
                  }}
                />
                <Label htmlFor="pagination" className="text-sm cursor-pointer">
                  Pagination
                </Label>
              </div>

              {paginationEnabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Rows:</Label>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(v) => {
                      setRowsPerPage(parseInt(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Center - Pagination */}
            {paginationEnabled && pagination.total_pages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && setPage(page - 1)}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < pagination.total_pages && setPage(page + 1)}
                      className={page >= pagination.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {/* Right - Go to & Total */}
            <div className="flex items-center gap-4">
              {paginationEnabled && pagination.total_pages > 1 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Go to:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={pagination.total_pages}
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                    className="h-8 w-16"
                    placeholder={page.toString()}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Count:</span>
                <Badge variant="outline">{pagination.total_count}</Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProjectDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        project={selectedProject}
        onSuccess={() => {
          handleDialogClose();
          refetch();
        }}
      />

      <ProjectFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </DashboardLayout>
  );
};

export default ProjectList;
