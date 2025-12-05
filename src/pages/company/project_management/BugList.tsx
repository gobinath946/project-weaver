import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import BugListView from "@/components/project-management/BugListView";
import BugKanbanView from "@/components/project-management/BugKanbanView";
import BugDialog from "@/components/project-management/BugDialog";
import BugFilterSheet, { BugFilters } from "@/components/project-management/BugFilterSheet";
import BugDetailModal from "@/components/project-management/BugDetailModal";
import { BUG_GROUP_BY_OPTIONS } from "@/constants/bugConstants";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Filter, Bug, ChevronDown, LayoutList, List, LayoutGrid } from "lucide-react";

type ViewMode = "list" | "kanban";

const BugList = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<'project' | 'none'>('none');
  const [filters, setFilters] = useState<BugFilters>({ filter_mode: 'all' });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [bugDialogOpen, setBugDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [goToPage, setGoToPage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query params from filters
  const buildQueryParams = useCallback(() => {
    const params: any = {
      page: paginationEnabled ? page : 1,
      limit: paginationEnabled ? rowsPerPage : 1000,
    };

    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.severity) params.severity = filters.severity;
    if (filters.project_id) params.project_id = filters.project_id;
    if (filters.project_group) params.project_group = filters.project_group;
    if (filters.assignee) params.assignee = filters.assignee;
    if (filters.reporter) params.reporter = filters.reporter;
    if (filters.classification) params.classification = filters.classification;
    if (filters.flag) params.flag = filters.flag;
    if (filters.tags) params.tags = filters.tags;

    return params;
  }, [page, rowsPerPage, paginationEnabled, filters]);

  // Fetch bugs for list view
  const {
    data: bugsData,
    isLoading: bugsLoading,
    refetch: refetchBugs,
  } = useQuery({
    queryKey: ["bugs", filters, groupBy, page, rowsPerPage, paginationEnabled],
    queryFn: async () => {
      const params = buildQueryParams();
      if (groupBy !== 'none') {
        params.group_by = groupBy;
        const response = await projectServices.getBugsGrouped(params);
        return response.data;
      }
      const response = await projectServices.getBugs(params);
      return response.data;
    },
    enabled: view === "list",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteBug(id),
    onSuccess: () => {
      toast({ title: "Bug deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["bugs"] });
    },
    onError: () => {
      toast({ title: "Failed to delete bug", variant: "destructive" });
    },
  });

  // Process bugs data
  const bugs = groupBy === 'none' ? bugsData?.data || [] : [];
  const groupedBugs = groupBy !== 'none' ? bugsData?.data : undefined;
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

  const handleApplyFilters = (newFilters: BugFilters) => {
    setFilters(newFilters);
    setPage(1);
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
    <DashboardLayout title="Bugs">
      <div className="h-full flex flex-col">
        {/* Header Actions */}
        <div className="glass-card border-b border-border/30 p-3 sm:p-4 flex-shrink-0 rounded-t-xl flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
            {/* Group By Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LayoutList className="h-4 w-4" />
                  Group By: {BUG_GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label || 'None'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {BUG_GROUP_BY_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option.value} onClick={() => setGroupBy(option.value as any)}>
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterSheetOpen(true)}
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

            <Button size="sm" className="h-8" onClick={() => setBugDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Submit Bug
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-card/50 backdrop-blur-sm">
          {view === "list" ? (
            bugsLoading ? (
              <div className="space-y-2 p-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <BugListView
                bugs={bugs}
                groupedBugs={groupedBugs}
                isLoading={bugsLoading}
                groupBy={groupBy}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            )
          ) : (
            <BugKanbanView
              onBugClick={handleView}
              projectFilter={filters.project_id}
            />
          )}

          {!bugsLoading && bugs.length === 0 && !groupedBugs && view === "list" && (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bugs found</h3>
              <p className="text-muted-foreground mb-4">Submit your first bug to get started</p>
              <Button onClick={() => setBugDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Bug
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Pagination */}
        {view === "list" && groupBy === 'none' && (
          <div className="glass-card border-t border-border/30 py-3 px-3 sm:px-4 flex-shrink-0 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
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
          queryClient.invalidateQueries({ queryKey: ["bugs-kanban"] });
        }}
      />

      <BugFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
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

export default BugList;
