import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skillBadgeVariants = cva(
  "inline-flex items-center rounded-full font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/12 text-primary border border-primary/20 hover:bg-primary/20",
        secondary: "bg-accent/12 text-accent border border-accent/20 hover:bg-accent/20",
        accent: "bg-accent/12 text-accent border border-accent/20",
        success: "bg-success/12 text-success border border-success/20",
        muted: "bg-muted text-muted-foreground border border-border/60",
        outline: "border border-border/60 bg-transparent text-foreground hover:border-primary/40 hover:bg-primary/5",
        warning: "bg-warning/12 text-warning border border-warning/20",
      },
      size: {
        sm: "text-[11px] px-2 py-0.5 gap-1",
        default: "text-xs px-2.5 py-1 gap-1.5",
        lg: "text-sm px-3.5 py-1.5 gap-2",
      },
      selected: {
        true: "ring-2 ring-primary ring-offset-1 ring-offset-background",
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

const levelVariants: Record<string, string> = {
  Beginner: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
  beginner: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
  Intermediate: "bg-violet-500/12 text-violet-500 border-violet-500/25",
  intermediate: "bg-violet-500/12 text-violet-500 border-violet-500/25",
  Advanced: "bg-amber-500/12 text-amber-500 border-amber-500/25",
  advanced: "bg-amber-500/12 text-amber-500 border-amber-500/25",
};

const levelDots: Record<string, string> = {
  Beginner: "bg-emerald-500",
  beginner: "bg-emerald-500",
  Intermediate: "bg-violet-500",
  intermediate: "bg-violet-500",
  Advanced: "bg-amber-500",
  advanced: "bg-amber-500",
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
        "border",
        level && levelVariants[level],
        className
      )}
      {...props}
    >
      {level && (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", levelDots[level])} />
      )}
      {children}
    </span>
  );
}
