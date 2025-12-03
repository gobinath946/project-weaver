import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "glass" | "filled"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border border-input bg-background hover:border-primary/50",
      glass: "bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-slate-900/70",
      filled: "bg-muted border-transparent hover:bg-muted/80",
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg px-4 py-2 text-sm ring-offset-background transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
