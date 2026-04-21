import type { AccessPlan } from "@/contexts/AuthContext";
import { Crown, Star, Clock, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES: Record<AccessPlan, { label: string; cls: string; Icon: typeof Crown }> = {
  free: {
    label: "FREE",
    cls: "bg-white text-zinc-700 border-zinc-300 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-300",
    Icon: Sparkles,
  },
  days_30: {
    label: "30 DAYS",
    // Cobre
    cls: "bg-gradient-to-r from-orange-300 to-amber-600 text-amber-950 border-amber-700 dark:from-orange-400 dark:to-amber-700 dark:text-amber-50 dark:border-amber-700",
    Icon: Clock,
  },
  days_60: {
    label: "60 DAYS",
    // Prateado
    cls: "bg-gradient-to-r from-zinc-200 to-zinc-400 text-zinc-800 border-zinc-400 dark:from-zinc-300 dark:to-zinc-500 dark:text-zinc-900 dark:border-zinc-400",
    Icon: Clock,
  },
  days_90: {
    label: "90 DAYS",
    // Prata escuro
    cls: "bg-gradient-to-r from-zinc-300 to-zinc-500 text-zinc-900 border-zinc-500 dark:from-zinc-300 dark:to-zinc-500 dark:text-zinc-900 dark:border-zinc-500",
    Icon: Star,
  },
  days_180: {
    label: "180 DAYS",
    // Dourado
    cls: "bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 border-amber-500 dark:from-amber-300 dark:to-amber-500 dark:text-amber-950 dark:border-amber-500",
    Icon: Star,
  },
  premium: {
    label: "PREMIUM",
    // Roxo com borda dourada
    cls: "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-2 border-amber-400 shadow-[0_0_0_1px_hsl(45_90%_55%/0.4)]",
    Icon: Crown,
  },
};

const ADMIN_STYLE = {
  label: "ADMIN",
  // Dourado com bordas roxas
  cls: "bg-gradient-to-r from-amber-300 to-amber-500 text-purple-900 border-2 border-purple-600 dark:text-purple-950",
  Icon: ShieldCheck,
};

interface Props {
  plan: AccessPlan;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
  isAdmin?: boolean;
}

export default function PlanBadge({ plan, size = "sm", showIcon = true, className, isAdmin = false }: Props) {
  const s = isAdmin ? ADMIN_STYLE : STYLES[plan];
  if (!s) return null;
  const { Icon } = s;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide shadow-sm",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        s.cls,
        className
      )}
      aria-label={isAdmin ? "Administrador" : `Plano ${s.label}`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />}
      {s.label}
    </span>
  );
}
