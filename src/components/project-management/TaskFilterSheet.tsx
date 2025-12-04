import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { projectServices } from "@/api/services";
import { TASK_STATUS, TASK_PRIORITY, BILLING_TYPE, TIME_SPAN_OPTIONS } from "@/constants/taskConstants";
import { PROJECT_STATUS } from "@/constants/projectConstants";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskFilters {
  search?: string;
  project_id?: string;
  project_status?: string;
  status?: string;
  owner?: string;
  current_owner?: string;
  created_by?: string;
  task_list_id?: string;
  billing_type?: string;
  priority?: string;
  tags?: string;
  start_date_from?: Date | null;
  start_date_to?: Date | null;
  due_date_from?: Date | null;
  due_date_to?: Date | null;
  created_from?: Date | null;
  created_to?: Date | null;
  time_span?: string;
  completion_min?: string;
  completion_max?: string;
  filter_mode?: 'any' | 'all';
}

interface TaskFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: TaskFilters;
  onApply: (filters: TaskFilters) => void;
}

const FILTER_ALL_VALUE = "__all__";

const TaskFilterSheet = ({ open, onClose, filters, onApply }: TaskFilterSheetProps) => {
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);
  const [filterSearch, setFilterSearch] = useState("");

  const { data: usersData } = useQuery({
    queryKey: ["project-users"],
    queryFn: async () => {
      const response = await projectServices.getProjectUsers();
      return response.data.data;
    },
    enabled: open,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const response = await projectServices.getProjects({ limit: 100 });
      return response.data.data;
    },
    enabled: open,
  });

  const { data: taskListsData } = useQuery({
    queryKey: ["all-task-lists"],
    queryFn: async () => {
      const response = await projectServices.getAllTaskLists({ limit: 100 });
      return response.data.data;
    },
    enabled: open,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, open]);

  const handleReset = () => {
    setLocalFilters({ filter_mode: 'all' });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    const actualValue = value === FILTER_ALL_VALUE ? "" : value;
    setLocalFilters((prev) => ({ ...prev, [key]: actualValue }));
  };

  const getSelectValue = (value: string | undefined) => {
    return value || FILTER_ALL_VALUE;
  };

  const filterItems = [
    { id: "search", label: "Task Name" },
    { id: "project", label: "Project" },
    { id: "project_status", label: "Project Status" },
    { id: "status", label: "Status" },
    { id: "completion", label: "Completion Percentage" },
    { id: "owner", label: "Owner" },
    { id: "priority", label: "Priority" },
    { id: "start_date", label: "Start Date" },
    { id: "due_date", label: "Due Date" },
    { id: "time_span", label: "Time Span" },
    { id: "recurrence", label: "Recurrence" },
    { id: "created_time", label: "Created Time" },
    { id: "created_by", label: "Created By" },
    { id: "task_list", label: "Task List" },
    { id: "billing_type", label: "Billing Type" },
    { id: "tags", label: "Tags" },
  ];

  const filteredItems = filterItems.filter((item) =>
    item.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const DateRangePicker = ({ 
    fromKey, toKey, fromValue, toValue 
  }: { 
    fromKey: keyof TaskFilters; 
    toKey: keyof TaskFilters;
    fromValue: Date | null | undefined;
    toValue: Date | null | undefined;
  }) => (
    <div className="grid grid-cols-2 gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !fromValue && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3 w-3" />
            {fromValue ? format(fromValue, "dd/MM/yy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={fromValue || undefined} onSelect={(date) => updateFilter(fromKey, date)} />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !toValue && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3 w-3" />
            {toValue ? format(toValue, "dd/MM/yy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={toValue || undefined} onSelect={(date) => updateFilter(toKey, date)} />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between">
          <SheetTitle className="text-base">Filter</SheetTitle>
          <Button variant="link" size="sm" onClick={handleReset} className="text-primary h-auto p-0">
            Reset
          </Button>
        </SheetHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter Search"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <Accordion type="multiple" className="w-full">
            {filteredItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-b">
                <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
                  {item.label}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {item.id === "search" && (
                    <Input
                      placeholder="Enter task name"
                      value={localFilters.search || ""}
                      onChange={(e) => updateFilter("search", e.target.value)}
                    />
                  )}

                  {item.id === "project" && (
                    <Select value={getSelectValue(localFilters.project_id)} onValueChange={(v) => updateFilter("project_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {projectsData?.map((p: any) => (
                          <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "project_status" && (
                    <Select value={getSelectValue(localFilters.project_status)} onValueChange={(v) => updateFilter("project_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {PROJECT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "status" && (
                    <Select value={getSelectValue(localFilters.status)} onValueChange={(v) => updateFilter("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {TASK_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "completion" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min %"
                        value={localFilters.completion_min || ""}
                        onChange={(e) => updateFilter("completion_min", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max %"
                        value={localFilters.completion_max || ""}
                        onChange={(e) => updateFilter("completion_max", e.target.value)}
                      />
                    </div>
                  )}

                  {item.id === "owner" && (
                    <Select value={getSelectValue(localFilters.owner)} onValueChange={(v) => updateFilter("owner", v)}>
                      <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {usersData?.map((user: any) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "priority" && (
                    <Select value={getSelectValue(localFilters.priority)} onValueChange={(v) => updateFilter("priority", v)}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {TASK_PRIORITY.map((priority) => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "start_date" && (
                    <DateRangePicker
                      fromKey="start_date_from"
                      toKey="start_date_to"
                      fromValue={localFilters.start_date_from}
                      toValue={localFilters.start_date_to}
                    />
                  )}

                  {item.id === "due_date" && (
                    <DateRangePicker
                      fromKey="due_date_from"
                      toKey="due_date_to"
                      fromValue={localFilters.due_date_from}
                      toValue={localFilters.due_date_to}
                    />
                  )}

                  {item.id === "time_span" && (
                    <Select value={getSelectValue(localFilters.time_span)} onValueChange={(v) => updateFilter("time_span", v)}>
                      <SelectTrigger><SelectValue placeholder="Select time span" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {TIME_SPAN_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "created_time" && (
                    <DateRangePicker
                      fromKey="created_from"
                      toKey="created_to"
                      fromValue={localFilters.created_from}
                      toValue={localFilters.created_to}
                    />
                  )}

                  {item.id === "created_by" && (
                    <Select value={getSelectValue(localFilters.created_by)} onValueChange={(v) => updateFilter("created_by", v)}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {usersData?.map((user: any) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "task_list" && (
                    <Select value={getSelectValue(localFilters.task_list_id)} onValueChange={(v) => updateFilter("task_list_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select task list" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {taskListsData?.map((tl: any) => (
                          <SelectItem key={tl._id} value={tl._id}>
                            {tl.name} ({tl.project_id?.title})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "billing_type" && (
                    <Select value={getSelectValue(localFilters.billing_type)} onValueChange={(v) => updateFilter("billing_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select billing type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {BILLING_TYPE.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "tags" && (
                    <Input
                      placeholder="Enter tags (comma separated)"
                      value={localFilters.tags || ""}
                      onChange={(e) => updateFilter("tags", e.target.value)}
                    />
                  )}

                  {item.id === "recurrence" && (
                    <Input
                      placeholder="Enter recurrence pattern"
                      value={(localFilters as any).recurrence || ""}
                      onChange={(e) => updateFilter("recurrence" as any, e.target.value)}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>

        <div className="p-4 border-t space-y-4">
          <RadioGroup
            value={localFilters.filter_mode || "all"}
            onValueChange={(v) => updateFilter("filter_mode", v as 'any' | 'all')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any" className="cursor-pointer">Any of these</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">All of these</Label>
            </div>
          </RadioGroup>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">Find</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskFilterSheet;
