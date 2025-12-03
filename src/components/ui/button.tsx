import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 hover:-translate-y-0.5",
        outline:
          "border-2 border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground hover:backdrop-blur-sm",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success:
          "bg-success text-success-foreground shadow-md hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 hover:-translate-y-0.5",
        warning:
          "bg-warning text-warning-foreground shadow-md hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/25 hover:-translate-y-0.5",
        gradient:
          "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 hover:opacity-90",
        glass:
          "bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-glass hover:bg-white/20 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
