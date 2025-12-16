import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { projectServices } from "@/api/services";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { StatusBadge } from "@/components/project-management/StatusBadge";
import TimeLogDialog from "@/components/project-management/TimeLogDialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { format } from "date-fns";
import { ArrowLeft, Plus, MoreVertical, Edit, Trash2, Timer, Check, X, Clock, TrendingUp, ListCheck, Bug } from "lucide-react";

const ProjectOverviewTimesheets = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === "company_super_admin";

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: ["project-timelogs", currentProject?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { 
        page: pageParam, 
        limit: 20,
        project_id: currentProject?._id // Filter by project
      };
      return (await projectServices.getTimeLogs(params)).data;
    },
    getNextPageParam: (lastPage) => lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!currentProject?._id,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => projectServices.approveTimeLog(id),
    onSuccess: () => { toast({ title: "Time log approved" }); queryClient.invalidateQueries({ queryKey: ["project-timelogs"] }); },
    onError: () => { toast({ title: "Failed", variant: "destructive" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => projectServices.rejectTimeLog(id),
    onSuccess: () => { toast({ title: "Time log rejected" }); queryClient.invalidateQueries({ queryKey: ["project-timelogs"] }); },
    onError: () => { toast({ title: "Failed", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectServices.deleteTimeLog(id),
    onSuccess: () => { toast({ title: "Deleted" }); queryClient.invalidateQueries({ queryKey: ["project-timelogs"] }); },
    onError: () => { toast({ title: "Failed", variant: "destructive" }); },
  });

  const { loadMoreRef } = useInfiniteScroll({ hasMore: !!hasNextPage, isLoading: isFetchingNextPage, onLoadMore: fetchNextPage });
  const logs = data?.pages.flatMap((p) => p.data) || [];
  const aggregates = data?.pages[0]?.aggregates;

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
    <DashboardLayout title={`${projectTitle} - Time Logs`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="glass-card border-b border-border/30 p-3 sm:p-4 flex-shrink-0 rounded-t-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/project-overview/${projectName}/dashboard`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{projectTitle} - Time Logs</h1>
                <p className="text-sm text-muted-foreground">Manage time logs for this project</p>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Log
            </Button>
          </div>

          {/* Summary Cards */}
          {aggregates && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billable Hours</p>
                    <p className="text-2xl font-bold">{aggregates.billable_hours?.toFixed(1) || 0}h</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Non-Billable Hours</p>
                    <p className="text-2xl font-bold">{aggregates.non_billable_hours?.toFixed(1) || 0}h</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{aggregates.total_hours?.toFixed(1) || 0}h</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project-overview/${projectName}/bugs`)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            Bugs
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            Time Logs
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden bg-card/50 backdrop-blur-sm rounded-b-xl p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.title || "Time Log"}</p>
                          <p className="text-xs text-muted-foreground">{log.log_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{format(new Date(log.date), "MMM d, yyyy")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.daily_log_hours}h</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{log.start_time} - {log.end_time}</span>
                      </TableCell>
                      <TableCell>
                        {log.user_id && <span className="text-sm">{log.user_id.first_name}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.billing_type === "Billable" ? "default" : "secondary"}>
                          {log.billing_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.approval_status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isSuperAdmin && log.approval_status === "Pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => approveMutation.mutate(log._id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => rejectMutation.mutate(log._id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedLog(log); setDialogOpen(true); }}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => confirm("Delete?") && deleteMutation.mutate(log._id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <span className="text-sm text-muted-foreground">Loading...</span>}
          </div>

          {!isLoading && logs.length === 0 && (
            <div className="text-center py-12">
              <Timer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No time logs found</h3>
              <p className="text-muted-foreground mb-4">Add your first time log for this project</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Time Log
              </Button>
            </div>
          )}
        </div>
      </div>

      <TimeLogDialog 
        open={dialogOpen} 
        onClose={() => { setDialogOpen(false); setSelectedLog(null); }} 
        timeLog={selectedLog} 
        onSuccess={() => { setDialogOpen(false); setSelectedLog(null); refetch(); }}
        defaultProjectId={currentProject?._id}
      />
    </DashboardLayout>
  );
};

export default ProjectOverviewTimesheets;