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
import { projectServices } from "@/api/services";
import { Search } from "lucide-react";
import { BUG_STATUS, BUG_SEVERITY, BUG_CLASSIFICATION, BUG_FLAG } from "@/constants/bugConstants";

export interface BugFilters {
  search?: string;
  project_id?: string;
  project_group?: string;
  assignee?: string;
  reporter?: string;
  classification?: string;
  tags?: string;
  flag?: string;
  severity?: string;
  status?: string;
  filter_mode?: 'any' | 'all';
}

interface BugFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: BugFilters;
  onApply: (filters: BugFilters) => void;
}

const FILTER_ALL_VALUE = "__all__";

const BugFilterSheet = ({ open, onClose, filters, onApply }: BugFilterSheetProps) => {
  const [localFilters, setLocalFilters] = useState<BugFilters>(filters);
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

  const updateFilter = (key: keyof BugFilters, value: any) => {
    const actualValue = value === FILTER_ALL_VALUE ? "" : value;
    setLocalFilters((prev) => ({ ...prev, [key]: actualValue }));
  };

  const getSelectValue = (value: string | undefined) => {
    return value || FILTER_ALL_VALUE;
  };

  const filterItems = [
    { id: "project_id", label: "Project" },
    { id: "project_group", label: "Project Group" },
    { id: "assignee", label: "Assignee" },
    { id: "reporter", label: "Reporter" },
    { id: "classification", label: "Classification" },
    { id: "tags", label: "Tags" },
    { id: "flag", label: "Flag" },
    { id: "severity", label: "Severity" },
    { id: "status", label: "Status" },
  ];

  const filteredItems = filterItems.filter((item) =>
    item.label.toLowerCase().includes(filterSearch.toLowerCase())
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
                  {item.id === "project_id" && (
                    <Select value={getSelectValue(localFilters.project_id)} onValueChange={(v) => updateFilter("project_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {projectsData?.map((project: any) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {item.id === "assignee" && (
                    <Select value={getSelectValue(localFilters.assignee)} onValueChange={(v) => updateFilter("assignee", v)}>
                      <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
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

                  {item.id === "reporter" && (
                    <Select value={getSelectValue(localFilters.reporter)} onValueChange={(v) => updateFilter("reporter", v)}>
                      <SelectTrigger><SelectValue placeholder="Select reporter" /></SelectTrigger>
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

                  {item.id === "classification" && (
                    <Select value={getSelectValue(localFilters.classification)} onValueChange={(v) => updateFilter("classification", v)}>
                      <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {BUG_CLASSIFICATION.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
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

                  {item.id === "flag" && (
                    <Select value={getSelectValue(localFilters.flag)} onValueChange={(v) => updateFilter("flag", v)}>
                      <SelectTrigger><SelectValue placeholder="Select flag" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {BUG_FLAG.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "severity" && (
                    <Select value={getSelectValue(localFilters.severity)} onValueChange={(v) => updateFilter("severity", v)}>
                      <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {BUG_SEVERITY.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {item.id === "status" && (
                    <Select value={getSelectValue(localFilters.status)} onValueChange={(v) => updateFilter("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
                        {BUG_STATUS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

export default BugFilterSheet;
