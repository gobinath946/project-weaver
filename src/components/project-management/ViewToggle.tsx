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
    <div className={cn("flex items-center gap-1 bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/50", className)}>
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className={cn(
          "h-8 px-3 rounded-lg transition-all duration-200",
          view === "list" && "shadow-sm"
        )}
      >
        <List className="h-4 w-4 mr-1.5" />
        List
      </Button>
      <Button
        variant={view === "kanban" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("kanban")}
        className={cn(
          "h-8 px-3 rounded-lg transition-all duration-200",
          view === "kanban" && "shadow-sm"
        )}
      >
        <Kanban className="h-4 w-4 mr-1.5" />
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
