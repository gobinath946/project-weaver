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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { projectServices } from "@/api/services";
import { BUG_STATUS, BUG_STATUS_COLORS, BUG_SEVERITY, BUG_CLASSIFICATION, BUG_REPRODUCIBLE, BUG_FLAG } from "@/constants/bugConstants";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { 
  ChevronDown, Maximize2, Minimize2, 
  MessageSquare, Clock, Paperclip, Link2, ListTodo, Activity, 
  Plus, Edit2, Check, CalendarIcon, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BugDetailModalProps {
  open: boolean;
  onClose: () => void;
  bugId: string | null;
}

const BugDetailModal = ({ open, onClose, bugId }: BugDetailModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBugId, setSelectedBugId] = useState<string | null>(bugId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    setSelectedBugId(bugId);
  }, [bugId]);

  // Fetch bug details
  const { data: bugData, isLoading: bugLoading } = useQuery({
    queryKey: ["bug-detail", selectedBugId],
    queryFn: async () => {
      if (!selectedBugId) return null;
      const response = await projectServices.getBug(selectedBugId);
      return response.data.data;
    },
    enabled: !!selectedBugId && open,
  });

  // Fetch related bugs from same project
  const { data: relatedBugsData } = useQuery({
    queryKey: ["related-bugs", bugData?.project_id?._id],
    queryFn: async () => {
      if (!bugData?.project_id?._id) return [];
      const response = await projectServices.getBugsByProject(bugData.project_id._id, { limit: 50 });
      return response.data.data;
    },
    enabled: !!bugData?.project_id?._id && open,
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
    mutationFn: (data: any) => projectServices.updateBug(selectedBugId!, data),
    onSuccess: () => {
      toast({ title: "Bug updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["bug-detail", selectedBugId] });
      queryClient.invalidateQueries({ queryKey: ["bugs"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Failed to update bug", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (bugData && isEditing) {
      setEditData({
        status: bugData.status,
        severity: bugData.severity,
        classification: bugData.classification,
        reproducible: bugData.reproducible,
        flag: bugData.flag,
        module: bugData.module || '',
        assignee: bugData.assignee?._id || '',
        due_date: bugData.due_date ? new Date(bugData.due_date) : null,
      });
    }
  }, [bugData, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const bug = bugData;
  const relatedBugs = relatedBugsData?.filter((b: any) => b._id !== selectedBugId) || [];
  const linkedBugs = bug?.linked_bugs || [];
  const associatedTasks = bug?.associated_tasks || [];

  const statusColors = bug ? BUG_STATUS_COLORS[bug.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' } : {};

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
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Bug</Badge>
            <Badge variant="outline" className="font-mono">{bug?.bug_id}</Badge>
            <DialogTitle className="text-base font-medium">{bug?.title}</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mr-8">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Bug List */}
          <div className="w-[20%] border-r flex flex-col">
            <div className="px-3 py-2 border-b bg-muted/30">
              <h3 className="text-sm font-medium">All Bugs</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {relatedBugs.map((b: any) => {
                  const bColors = BUG_STATUS_COLORS[b.status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
                  const isSelected = b._id === selectedBugId;
                  
                  return (
                    <Card 
                      key={b._id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-sm",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedBugId(b._id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[9px] px-1", bColors.bg, bColors.text)}>
                            {b.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{b.bug_id}</span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{b.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {b.reporter && (
                            <span>{b.reporter.first_name}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Bug Details */}
          <div className="w-[80%] flex flex-col overflow-hidden">
            {bugLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : bug ? (
              <>
                {/* Bug Header */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{bug.bug_id}</Badge>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-sm text-muted-foreground">{bug.project_id?.title}</span>
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
                  
                  <h2 className="text-lg font-semibold mb-2">{bug.title}</h2>
                  <p className="text-sm text-muted-foreground mb-3">By {bug.reporter?.first_name} {bug.reporter?.last_name}</p>
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                        <SelectTrigger className="w-[200px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUG_STATUS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn("text-xs", statusColors.bg, statusColors.text)}>
                        {bug.status}
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {bug.description || 'NO DESCRIPTION AVAILABLE'}
                      </p>
                    </div>

                    <Separator />

                    {/* Bug Information */}
                    <div>
                      <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <ChevronDown className="h-4 w-4" /> Bug Information
                      </h4>
                      
                      <div className="grid grid-cols-4 gap-4">
                        {/* Assignee */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Assignee</Label>
                          {isEditing ? (
                            <Select value={editData.assignee} onValueChange={(v) => setEditData({ ...editData, assignee: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {usersData?.map((u: any) => (
                                  <SelectItem key={u._id} value={u._id}>{u.first_name} {u.last_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1">
                              {bug.assignee ? (
                                <Badge variant="secondary" className="gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px]">{bug.assignee.first_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {bug.assignee.first_name} {bug.assignee.last_name}
                                </Badge>
                              ) : <span className="text-sm">Not Assigned</span>}
                            </div>
                          )}
                        </div>

                        {/* Last Closed Time */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Last Closed Time</Label>
                          <p className="text-sm mt-1">{bug.last_closed_time ? format(new Date(bug.last_closed_time), "dd/MM/yyyy HH:mm") : '-'}</p>
                        </div>

                        {/* Due Date */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Due Date</Label>
                          {isEditing ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("w-full justify-start mt-1", !editData.due_date && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {editData.due_date ? format(editData.due_date, "dd/MM/yyyy") : "Pick date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={editData.due_date || undefined} onSelect={(d) => setEditData({ ...editData, due_date: d })} />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <p className="text-sm mt-1">{bug.due_date ? format(new Date(bug.due_date), "dd/MM/yyyy") : '-'}</p>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge className={cn("text-xs", statusColors.bg, statusColors.text)}>
                              {bug.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Severity */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Severity</Label>
                          {isEditing ? (
                            <Select value={editData.severity} onValueChange={(v) => setEditData({ ...editData, severity: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUG_SEVERITY.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{bug.severity}</p>
                          )}
                        </div>

                        {/* Release Milestone */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Release Milestone</Label>
                          <p className="text-sm mt-1">{bug.release_milestone || 'None'}</p>
                        </div>

                        {/* Affected Milestone */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Affected Milestone</Label>
                          <p className="text-sm mt-1">{bug.affected_milestone || 'None'}</p>
                        </div>

                        {/* Module */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Module</Label>
                          {isEditing ? (
                            <Input
                              value={editData.module}
                              onChange={(e) => setEditData({ ...editData, module: e.target.value })}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="text-sm mt-1">{bug.module || 'None'}</p>
                          )}
                        </div>

                        {/* Classification */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Classification</Label>
                          {isEditing ? (
                            <Select value={editData.classification} onValueChange={(v) => setEditData({ ...editData, classification: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUG_CLASSIFICATION.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{bug.classification}</p>
                          )}
                        </div>

                        {/* Reproducible */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Reproducible</Label>
                          {isEditing ? (
                            <Select value={editData.reproducible} onValueChange={(v) => setEditData({ ...editData, reproducible: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUG_REPRODUCIBLE.map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{bug.reproducible}</p>
                          )}
                        </div>

                        {/* Flag */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Flag</Label>
                          {isEditing ? (
                            <Select value={editData.flag} onValueChange={(v) => setEditData({ ...editData, flag: v })}>
                              <SelectTrigger className="h-8 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BUG_FLAG.map((f) => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm mt-1">{bug.flag}</p>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {bug.tags?.length > 0 ? bug.tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            )) : '-'}
                          </div>
                        </div>

                        {/* Completion Percentage */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Completion Percentage</Label>
                          <p className="text-sm mt-1">{bug.completion_percentage || 0}%</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tabs Section */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-7 w-full">
                        <TabsTrigger value="comments" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" /> Comments
                        </TabsTrigger>
                        <TabsTrigger value="attachments" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" /> Attachments
                        </TabsTrigger>
                        <TabsTrigger value="loghours" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Log Hours
                        </TabsTrigger>
                        <TabsTrigger value="linkbug" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" /> Link Bug
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="text-xs">
                          <ListTodo className="h-3 w-3 mr-1" /> Tasks
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

                      <TabsContent value="attachments" className="mt-4">
                        <div className="text-center py-8 text-muted-foreground">
                          <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No attachments</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Plus className="h-3 w-3 mr-1" /> Add Attachment
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="loghours" className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex gap-4 text-sm">
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
                              <TableHead>Hours</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No time logs recorded
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TabsContent>

                      <TabsContent value="linkbug" className="mt-4">
                        <div className="flex justify-end mb-2">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" /> Link Bug
                          </Button>
                        </div>
                        {linkedBugs.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Bug Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Severity</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {linkedBugs.map((lb: any) => (
                                <TableRow key={lb._id}>
                                  <TableCell className="font-mono text-xs">{lb.bug_id}</TableCell>
                                  <TableCell>{lb.title}</TableCell>
                                  <TableCell>
                                    <Badge className={cn("text-xs", BUG_STATUS_COLORS[lb.status]?.bg, BUG_STATUS_COLORS[lb.status]?.text)}>
                                      {lb.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{lb.severity}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No linked bugs</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="tasks" className="mt-4">
                        <div className="flex justify-end mb-2">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" /> Associate Tasks
                          </Button>
                        </div>
                        {associatedTasks.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Task Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Duration</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {associatedTasks.map((task: any) => (
                                <TableRow key={task._id}>
                                  <TableCell className="font-mono text-xs">{task.task_id}</TableCell>
                                  <TableCell>{task.name}</TableCell>
                                  <TableCell>{task.status}</TableCell>
                                  <TableCell>{task.current_owner?.first_name || '-'}</TableCell>
                                  <TableCell>{task.start_date ? format(new Date(task.start_date), "dd/MM/yyyy") : '-'}</TableCell>
                                  <TableCell>{task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : '-'}</TableCell>
                                  <TableCell>{task.duration || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No associated tasks</p>
                          </div>
                        )}
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
                                <span className="font-medium">{bug.created_by?.first_name}</span> created this bug
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bug.created_at ? format(new Date(bug.created_at), "dd/MM/yyyy HH:mm") : ''}
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
                Select a bug to view details
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BugDetailModal;
