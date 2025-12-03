import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-elevated group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:bg-success/95 group-[.toaster]:text-success-foreground group-[.toaster]:border-success/50",
          error: "group-[.toaster]:bg-destructive/95 group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive/50",
          warning: "group-[.toaster]:bg-warning/95 group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning/50",
          info: "group-[.toaster]:bg-info/95 group-[.toaster]:text-info-foreground group-[.toaster]:border-info/50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
