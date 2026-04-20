import type { AccessPlan } from "@/contexts/AuthContext";
import { Crown, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: Record<AccessPlan, { label: string; cls: string; Icon: typeof Crown } | null> = {
  free: null,
  days_30: {
    label: "30 DAYS",
    cls: "bg-muted text-muted-foreground border-muted-foreground/30",
    Icon: Clock,
  },
  days_90: {
    label: "90 DAYS",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40",
    Icon: Star,
  },
  premium: {
    label: "PREMIUM",
    cls: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/40",
    Icon: Crown,
  },
};

interface Props {
  plan: AccessPlan;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export default function PlanBadge({ plan, size = "sm", showIcon = true, className }: Props) {
  const s = STYLES[plan];
  if (!s) return null;
  const { Icon } = s;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        s.cls,
        className
      )}
      aria-label={`Plano ${s.label}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />}
      {s.label}
    </span>
  );
}
