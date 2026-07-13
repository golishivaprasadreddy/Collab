import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skillBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent/10 text-accent",
        success: "bg-success/10 text-success",
        muted: "bg-muted text-muted-foreground",
        outline: "border border-border bg-transparent text-foreground",
      },
      size: {
        sm: "text-xs px-2 py-1",
        default: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
      },
      selected: {
        true: "ring-2 ring-primary ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      selected: false,
    },
  }
);

interface SkillBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof skillBadgeVariants> {
  level?: "Beginner" | "Intermediate" | "Advanced" | "beginner" | "intermediate" | "advanced";
}

const levelColors: Record<string, string> = {
  Beginner: "bg-success/10 text-success",
  Intermediate: "bg-warning/10 text-warning",
  Advanced: "bg-accent/10 text-accent",
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-accent/10 text-accent",
};

export function SkillBadge({
  className,
  variant,
  size,
  selected,
  level,
  children,
  ...props
}: SkillBadgeProps) {
  return (
    <span
      className={cn(
        skillBadgeVariants({ variant, size, selected }),
        level && levelColors[level],
        className
      )}
      {...props}
    >
      {children}
      {level && (
        <span className="ml-1.5 opacity-70 text-[0.7em]">• {level.charAt(0).toUpperCase() + level.slice(1)}</span>
      )}
    </span>
  );
}
