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
    <div className={cn("flex items-center gap-1 bg-muted p-1 rounded-lg", className)}>
      <Button
        variant={view === "list" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("kanban")}
        className="h-8 px-3"
      >
        <Kanban className="h-4 w-4 mr-1" />
        Kanban
      </Button>
      {showCard && (
        <Button
          variant={view === "card" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onViewChange("card")}
          className="h-8 px-3"
        >
          <LayoutGrid className="h-4 w-4 mr-1" />
          Card
        </Button>
      )}
    </div>
  );
};

export default ViewToggle;
