import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Kanban } from "lucide-react";

export type ViewMode = "list" | "kanban" | "card";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  showCard?: boolean;
  className?: string;
}

export const ViewToggle = ({
  view,
  onViewChange,
  showCard = false,
  className
}: ViewToggleProps) => {
  return (
    <div className="flex items-center border rounded-md">

      <Button
        variant={view === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3 rounded-r-none"
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-3 rounded-l-none"
        onClick={() => onViewChange("kanban")}
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Kanban
      </Button>

      {showCard && (
        <Button
          variant={view === "card" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("card")}
          className={cn(
            "h-8 px-3 rounded-lg transition-all duration-200",
            view === "card" && "shadow-sm"
          )}
        >
          <LayoutGrid className="h-4 w-4 mr-1.5" />
          Card
        </Button>
      )}

    </div>
  );
};

export default ViewToggle;
