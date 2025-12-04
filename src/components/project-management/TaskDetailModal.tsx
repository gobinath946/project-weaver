import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { projectServices } from "@/api/services";
import { TASK_STATUS, TASK_STATUS_COLORS, TASK_PRIORITY, BILLING_TYPE } from "@/constants/taskConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { 
  ChevronDown, Maximize2, Minimize2, 
  MessageSquare, ListTodo, Clock, FileText, GitBranch, 
  Bug, Activity, Plus, Edit2, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  projectId?: string;
}

const TaskDetailModal = ({ open, onClose, taskId, projectId }: TaskDetailModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    setSelectedTaskId(taskId);
  }, [taskId]);

  // Fetch task details
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ["task-detail", selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId) return null;
      const response = await projectServices.getTask(selectedTaskId);
      return response.data.data;
    },
    enabled: !!selectedTaskId && open,
  });

  // Fetch related tasks from same project
  const { data: relatedTasksData } = useQuery({
    queryKey: ["related-tasks", taskData?.project_id?._id],
    queryFn: async () => {
      if (!taskData?.project_id?._id) return [];
      const response = await projectServices.getTasksByProject(taskData.project_id._id, { limit: 50 });
      return response.data.data;
    },
    enabled: !!taskData?.project_id?._id && open,
  });

  // Fetch users for editing
  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => {
      const response = await projectServices.getProjectUsers();
      return response.data.data;
    },
    enabled: open && isEditing,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectServices.updateTask(selectedTaskId!, data),
    onSuccess: () => {
      toast({ title: "Task updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["task-detail", selectedTaskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (taskData && isEditing) {
      setEditData({
        status: taskData.status,
        priority: taskData.priority,
        billing_type: taskData.billing_type,
        outcome: taskData.outcome || '',
      });
    }
  }, [taskData, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const task = taskData;
  const relatedTasks = relatedTasksData?.filter((t: any) => t._id !== selectedTaskId) || [];
  const subtasks = task?.subtasks || [];

  const statusColors = task ? TASK_STATUS_COLORS[task.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' } : {};

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 flex flex-col",
          isExpanded ? "max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh]" : "max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh]"
        )}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">{task?.task_id}</Badge>
            <DialogTitle className="text-base font-medium">{task?.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mr-8">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Task List */}
          <div className="w-[20%] border-r flex flex-col">
            <div className="px-3 py-2 border-b bg-muted/30">
              <h3 className="text-sm font-medium">{task?.task_list_id?.name || 'Tasks'}</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {relatedTasks.map((t: any) => {
                  const tColors = TASK_STATUS_COLORS[t.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
                  const isSelected = t._id === selectedTaskId;
                  
                  return (
                    <Card 
                      key={t._id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-sm",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedTaskId(t._id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[9px] px-1", tColors.bg, tColors.text)}>
                            {t.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{t.task_id}</span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{t.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {t.current_owner && (
                            <span>{t.current_owner.first_name}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Task Details */}
          <div className="w-[80%] flex flex-col overflow-hidden">
            {taskLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : task ? (
              <>
                {/* Task Header */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{task.task_id}</Badge>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-sm text-muted-foreground">{task.project_id?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSave}>
                            <Check className="h-3 w-3 mr-1" /> Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <h2 className="text-lg font-semibold mb-2">{task.name}</h2>
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                        <SelectTrigger className="w-[200px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn("text-xs", statusColors.bg, statusColors.text)}>
                        {task.status}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">CURRENT STATUS</span>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" /> Description
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {task.description || 'NO DESCRIPTION AVAILABLE'}
                      </p>
                    </div>

                    <Separator />

                    {/* Task Information */}
                    <div>
                      <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" /> Task Information
                      </h4>
                      
                      <div className="grid grid-cols-6 gap-4">
                        {/* Owners */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Owner</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(task.owners?.length ? task.owners : (task.current_owner ? [task.current_owner] : [])).map((owner: any) => (
                              <Badge key={owner._id} variant="secondary" className="gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">{owner.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {owner.first_name} {owner.last_name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Current Owner */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Current Owner</Label>
                          <div className="mt-1">
                            {task.current_owner ? (
                              <Badge variant="secondary" className="gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">{task.current_owner.first_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {task.current_owner.first_name} {task.current_owner.last_name}
                              </Badge>
                            ) : '-'}
                          </div>
                        </div>

                        {/* Estimates */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Integration Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.integration_estimate || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Web Dev Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.web_dev_estimate || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">SFDC Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.sfdc_estimate || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Testing Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.testing_estimate || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">BI Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.bi_estimate || 0}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Infra & Devops Estimate</Label>
                          <p className="text-sm mt-1">{task.estimation_split?.infra_devops_estimate || 0}</p>
                        </div>

                        {/* Work Hours */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Work Hours</Label>
                          <p className="text-sm mt-1">{task.work_hours || '0:00'}</p>
                        </div>

                        {/* Dates */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Start Date</Label>
                          <p className="text-sm mt-1">{task.start_date ? format(new Date(task.start_date), "dd/MM/yyyy") : '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Due Date</Label>
                          <p className="text-sm mt-1">{task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : '-'}</p>
                        </div>

                        {/* Duration & Status */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Duration</Label>
                          <p className="text-sm mt-1">{task.duration || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge className={cn("text-xs", statusColors.bg, statusColors.text)}>
                              {task.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Priority & Completion */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Priority</Label>
                          {isEditing ? (
                            <Select value={editData.priority} onValueChange={(v) => setEditData({ ...editData, priority: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_PRIORITY.map((p) => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{task.priority}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Completion Percentage</Label>
                          <p className="text-sm mt-1">{task.completion_percentage}%</p>
                        </div>

                        {/* Tags */}
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags?.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            )) || '-'}
                          </div>
                        </div>

                        {/* Billing Type */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Billing Type</Label>
                          {isEditing ? (
                            <Select value={editData.billing_type} onValueChange={(v) => setEditData({ ...editData, billing_type: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BILLING_TYPE.map((b) => (
                                  <SelectItem key={b} value={b}>{b}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{task.billing_type || 'None'}</p>
                          )}
                        </div>

                        {/* Outcome */}
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Outcome</Label>
                          {isEditing ? (
                            <Textarea
                              value={editData.outcome}
                              onChange={(e) => setEditData({ ...editData, outcome: e.target.value })}
                              className="mt-1"
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm mt-1">{task.outcome || '-'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tabs Section */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-8 w-full">
                        <TabsTrigger value="comments" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" /> Comments
                        </TabsTrigger>
                        <TabsTrigger value="subtasks" className="text-xs">
                          <ListTodo className="h-3 w-3 mr-1" /> Subtasks
                        </TabsTrigger>
                        <TabsTrigger value="timelogs" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Log Hours
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" /> Documents
                        </TabsTrigger>
                        <TabsTrigger value="dependency" className="text-xs">
                          <GitBranch className="h-3 w-3 mr-1" /> Dependency
                        </TabsTrigger>
                        <TabsTrigger value="bugs" className="text-xs">
                          <Bug className="h-3 w-3 mr-1" /> Bugs
                        </TabsTrigger>
                        <TabsTrigger value="timeline" className="text-xs">
                          Status Timeline
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" /> Activity
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="comments" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No comments yet</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Plus className="h-3 w-3 mr-1" /> Add Comment
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="subtasks" className="mt-4">
                        <div className="flex justify-end mb-2">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" /> Add Subtask
                          </Button>
                        </div>
                        {subtasks.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Task Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Priority</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subtasks.map((st: any) => (
                                <TableRow key={st._id}>
                                  <TableCell className="font-mono text-xs">{st.task_id}</TableCell>
                                  <TableCell>{st.name}</TableCell>
                                  <TableCell>
                                    <Badge className={cn("text-xs", TASK_STATUS_COLORS[st.status]?.bg, TASK_STATUS_COLORS[st.status]?.text)}>
                                      {st.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{st.current_owner?.first_name || '-'}</TableCell>
                                  <TableCell>{st.due_date ? format(new Date(st.due_date), "dd/MM/yyyy") : '-'}</TableCell>
                                  <TableCell>{st.priority}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No subtasks</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="timelogs" className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex gap-4 text-sm">
                            <span>Billable: <span className="text-green-500 font-medium">00:00 h</span></span>
                            <span>Non-Billable: <span className="text-red-500 font-medium">00:00 h</span></span>
                            <span>Total: <span className="font-medium">00:00 h</span></span>
                          </div>
                          <Button size="sm">
                            <Plus className="h-3 w-3 mr-1" /> Add Time Log
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Daily Log Hours</TableHead>
                              <TableHead>Time Period</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Billing Type</TableHead>
                              <TableHead>Approval Status</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No time logs recorded
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>

                      <TabsContent value="documents" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No documents attached</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="dependency" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No dependencies</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="bugs" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No bugs associated</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="timeline" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No status changes recorded</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="activity" className="mt-4">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                            <div>
                              <p className="text-sm">
                                <span className="font-medium">{task.created_by?.first_name}</span> created this task
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.created_at ? format(new Date(task.created_at), "dd/MM/yyyy HH:mm") : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a task to view details
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
