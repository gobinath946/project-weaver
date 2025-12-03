import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { projectServices } from "@/api/services";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS } from "@/constants/projectConstants";

export interface ProjectFilters {
  search?: string;
  owner?: string;
  created_by?: string;
  last_modified_by?: string;
  start_date_from?: Date | null;
  start_date_to?: Date | null;
  end_date_from?: Date | null;
  end_date_to?: Date | null;
  created_from?: Date | null;
  created_to?: Date | null;
  modified_from?: Date | null;
  modified_to?: Date | null;
  project_group?: string;
  status?: string;
  visibility?: string;
  tags?: string;
  strict_project?: string;
  allocated_users?: string;
  no_of_allocated_users_min?: string;
  no_of_allocated_users_max?: string;
  filter_mode?: 'any' | 'all';
}

interface ProjectFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: ProjectFilters;
  onApply: (filters: ProjectFilters) => void;
}

const FILTER_ALL_VALUE = "__all__";

const ProjectFilterSheet = ({ open, onClose, filters, onApply }: ProjectFilterSheetProps) => {
  const [localFilters, setLocalFilters] = useState<ProjectFilters>(filters);
  const [filterSearch, setFilterSearch] = useState("");

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
    setLocalFilters(filters);
  }, [filters, open]);

  const handleReset = () => {
    setLocalFilters({ filter_mode: 'all' });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    // Convert FILTER_ALL_VALUE back to empty string for actual filter
    const actualValue = value === FILTER_ALL_VALUE ? "" : value;
    setLocalFilters((prev) => ({ ...prev, [key]: actualValue }));
  };

  // Helper to get select value (convert empty to FILTER_ALL_VALUE for display)
  const getSelectValue = (value: string | undefined) => {
    return value || FILTER_ALL_VALUE;
  };

  const filterItems = [
    { id: "search", label: "Project Name" },
    { id: "owner", label: "Owner" },
    { id: "created_time", label: "Created Time" },
    { id: "created_by", label: "Created By" },
    { id: "start_date", label: "Start Date" },
    { id: "end_date", label: "End Date" },
    { id: "last_modified_by", label: "Last Modified By" },
    { id: "modified_time", label: "Last Modified Time" },
    { id: "project_group", label: "Project Group" },
    { id: "status", label: "Status" },
    { id: "visibility", label: "Project Access" },
    { id: "tags", label: "Tags" },
    { id: "strict_project", label: "Strict Project" },
    { id: "allocated_users", label: "Allocated Users" },
    { id: "no_of_allocated_users", label: "No. of Allocated Users" },
  ];

  const filteredItems = filterItems.filter((item) =>
    item.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const DateRangePicker = ({ 
    fromKey, 
    toKey, 
    fromValue, 
    toValue 
  }: { 
    fromKey: keyof ProjectFilters; 
    toKey: keyof ProjectFilters;
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

        {/* Search */}
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
                      placeholder="Enter project name"
                      value={localFilters.search || ""}
                      onChange={(e) => updateFilter("search", e.target.value)}
                    />
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

                  {item.id === "last_modified_by" && (
                    <Select value={getSelectValue(localFilters.last_modified_by)} onValueChange={(v) => updateFilter("last_modified_by", v)}>
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

                  {item.id === "created_time" && (
                    <DateRangePicker
                      fromKey="created_from"
                      toKey="created_to"
                      fromValue={localFilters.created_from}
                      toValue={localFilters.created_to}
                    />
                  )}

                  {item.id === "start_date" && (
                    <DateRangePicker
                      fromKey="start_date_from"
                      toKey="start_date_to"
                      fromValue={localFilters.start_date_from}
                      toValue={localFilters.start_date_to}
                    />
                  )}

                  {item.id === "end_date" && (
                    <DateRangePicker
                      fromKey="end_date_from"
                      toKey="end_date_to"
                      fromValue={localFilters.end_date_from}
                      toValue={localFilters.end_date_to}
                    />
                  )}

                  {item.id === "modified_time" && (
                    <DateRangePicker
                      fromKey="modified_from"
                      toKey="modified_to"
                      fromValue={localFilters.modified_from}
                      toValue={localFilters.modified_to}
                    />
                  )}

                  {item.id === "project_group" && (
                    <Select value={getSelectValue(localFilters.project_group)} onValueChange={(v) => updateFilter("project_group", v)}>
                      <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {groupsData?.map((group: any) => (
                          <SelectItem key={group._id} value={group._id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "status" && (
                    <Select value={getSelectValue(localFilters.status)} onValueChange={(v) => updateFilter("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {PROJECT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "visibility" && (
                    <Select value={getSelectValue(localFilters.visibility)} onValueChange={(v) => updateFilter("visibility", v)}>
                      <SelectTrigger><SelectValue placeholder="Select access" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Public">Public</SelectItem>
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

                  {item.id === "strict_project" && (
                    <Select value={getSelectValue(localFilters.strict_project)} onValueChange={(v) => updateFilter("strict_project", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "allocated_users" && (
                    <Select value={getSelectValue(localFilters.allocated_users)} onValueChange={(v) => updateFilter("allocated_users", v)}>
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

                  {item.id === "no_of_allocated_users" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={localFilters.no_of_allocated_users_min || ""}
                        onChange={(e) => updateFilter("no_of_allocated_users_min", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={localFilters.no_of_allocated_users_max || ""}
                        onChange={(e) => updateFilter("no_of_allocated_users_max", e.target.value)}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>

        {/* Footer */}
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

export default ProjectFilterSheet;
