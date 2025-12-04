import { useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ViewToggle, ViewMode } from "@/components/project-management/ViewToggle";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import { SeverityBadge } from "@/components/project-management/PriorityBadge";
import KanbanBoard from "@/components/project-management/KanbanBoard";
import BugDialog from "@/components/project-management/BugDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Plus, Search, MoreVertical, Edit, Trash2, Bug } from "lucide-react";

const BugList = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => { const r = await projectServices.getProjects({ limit: 100 }); return r.data.data; },
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: ["bugs", search, statusFilter, projectFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { page: pageParam, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (projectFilter !== "all") params.project_id = projectFilter;
      return (await projectServices.getBugs(params)).data;
    },
    getNextPageParam: (lastPage) => lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined,
    initialPageParam: 1,
    enabled: view === "list",
  });

  const { data: kanbanData, isLoading: kanbanLoading } = useQuery({
    queryKey: ["bugs-kanban", projectFilter],
    queryFn: async () => {
      const params: any = {};
      if (projectFilter !== "all") params.project_id = projectFilter;
      return (await projectServices.getBugsKanban(params)).data.data;
    },
    enabled: view === "kanban",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteBug(id),
    onSuccess: () => { toast({ title: "Bug deleted" }); queryClient.invalidateQueries({ queryKey: ["bugs"] }); },
    onError: () => { toast({ title: "Failed to delete bug", variant: "destructive" }); },
  });

  const { loadMoreRef } = useInfiniteScroll({ hasMore: !!hasNextPage, isLoading: isFetchingNextPage, onLoadMore: fetchNextPage });
  const bugs = data?.pages.flatMap((p) => p.data) || [];

  const kanbanColumns = kanbanData ? [
    { id: "open", title: "Open", items: kanbanData["Open"] || [], color: "red" },
    { id: "in-progress", title: "In Progress", items: kanbanData["In Progress"] || [], color: "blue" },
    { id: "testing", title: "Testing", items: kanbanData["Testing"] || [], color: "yellow" },
    { id: "uat", title: "Moved to UAT", items: kanbanData["Moved to UAT"] || [], color: "purple" },
    { id: "ready", title: "Ready for Production", items: kanbanData["Ready for Production"] || [], color: "cyan" },
    { id: "closed", title: "Closed", items: kanbanData["Closed"] || [], color: "green" },
  ] : [];

  return (
    <DashboardLayout title="Bugs">
      <div className="h-full flex flex-col">
        <div className="glass-card border-b border-border/30 p-3 sm:p-4 flex-shrink-0 rounded-t-xl flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search bugs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projectsData?.map((p: any) => <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Testing">Testing</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <ViewToggle view={view} onViewChange={setView} />
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Bug</Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-card/50 backdrop-blur-sm rounded-b-xl p-4">
        {view === "list" ? (
          isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bug</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bugs.map((bug: any) => (
                    <TableRow key={bug._id}>
                      <TableCell><div><p className="font-medium">{bug.title}</p><p className="text-xs text-muted-foreground">{bug.bug_id}</p></div></TableCell>
                      <TableCell><span className="text-sm">{bug.project_id?.title}</span></TableCell>
                      <TableCell>{bug.reporter && <span className="text-sm">{bug.reporter.first_name}</span>}</TableCell>
                      <TableCell>{bug.assignee && <span className="text-sm">{bug.assignee.first_name}</span>}</TableCell>
                      <TableCell><StatusBadge status={bug.status} /></TableCell>
                      <TableCell><SeverityBadge severity={bug.severity} /></TableCell>
                      <TableCell>{bug.due_date && <span className="text-sm text-muted-foreground">{format(new Date(bug.due_date), "MMM d, yyyy")}</span>}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedBug(bug); setDialogOpen(true); }}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirm("Delete?") && deleteMutation.mutate(bug._id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : kanbanLoading ? <div className="flex gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 w-80" />)}</div> : (
          <KanbanBoard columns={kanbanColumns} type="bug" onItemClick={(b) => { setSelectedBug(b); setDialogOpen(true); }} />
        )}

        {view === "list" && <div ref={loadMoreRef} className="h-10 flex items-center justify-center">{isFetchingNextPage && <span className="text-sm text-muted-foreground">Loading...</span>}</div>}
        
        {!isLoading && bugs.length === 0 && view === "list" && (
          <div className="text-center py-12">
            <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bugs found</h3>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Report Bug</Button>
          </div>
        )}
        </div>
      </div>
      <BugDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedBug(null); }} bug={selectedBug} onSuccess={() => { setDialogOpen(false); setSelectedBug(null); refetch(); queryClient.invalidateQueries({ queryKey: ["bugs-kanban"] }); }} />
    </DashboardLayout>
  );
};

export default BugList;
