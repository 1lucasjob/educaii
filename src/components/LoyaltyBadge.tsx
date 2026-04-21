import { useMemo } from "react";
import { LOYALTY_TIERS } from "@/components/LoyaltyProgram";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function monthsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
}

interface Props {
  startDate?: string | Date | null;
  size?: "xs" | "sm";
}

export default function LoyaltyBadge({ startDate, size = "xs" }: Props) {
  const userMonths = useMemo(() => {
    if (!startDate) return 0;
    const d = typeof startDate === "string" ? new Date(startDate) : startDate;
    if (!d || isNaN(d.getTime())) return 0;
    return monthsBetween(d, new Date());
  }, [startDate]);

  const tier = useMemo(() => {
    return [...LOYALTY_TIERS].reverse().find((t) => t.months <= userMonths) ?? null;
  }, [userMonths]);

  if (!tier || userMonths < 1) return null;

  const Icon = tier.Icon;
  const dim = size === "sm" ? "w-6 h-6" : "w-5 h-5";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-3 h-3";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={`Fidelidade: ${tier.title} (${tier.months} ${tier.months === 1 ? "mês" : "meses"})`}
            className={cn(
              "inline-flex items-center justify-center rounded-full shrink-0",
              dim,
              tier.bgClass,
              tier.glowClass,
              tier.pulse && "animate-pulse",
            )}
          >
            <Icon className={cn(iconSize, tier.iconClass)} strokeWidth={2.2} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <span className="font-semibold">{tier.title}</span>
          <span className="text-muted-foreground"> · {tier.months} {tier.months === 1 ? "mês" : "meses"}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
