import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "glass" | "filled"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border border-input bg-background hover:border-primary/50",
      glass: "bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-900/70",
      filled: "bg-muted border-transparent hover:bg-muted/80",
    }

    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-lg px-4 py-3 text-sm",
          "ring-offset-background transition-all duration-200",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
