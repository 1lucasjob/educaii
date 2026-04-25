import { useMemo } from "react";
import { Lock, Trophy } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };
type IconCmp = ComponentType<IconProps>;

/* ============================================================
   Custom crafted icons — each tier gets a UNIQUE silhouette.
   Designed to scale from simple (early tiers) to ornate (late).
   All use currentColor so glow/drop-shadow utilities apply.
   ============================================================ */

// 1 mês — Recruta: capacete básico (linha simples)
const HelmetIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M4 15a8 8 0 0 1 16 0v1H4v-1Z" />
    <path d="M3 16h18v2H3z" />
    <path d="M12 7v4" />
  </svg>
);

// 2 meses — Estudante: livro aberto
const BookIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M3 5.5C3 5 3.4 4.5 4 4.5h6c1.1 0 2 .9 2 2V20c0-1.1-.9-2-2-2H3V5.5Z" />
    <path d="M21 5.5c0-.5-.4-1-1-1h-6c-1.1 0-2 .9-2 2V20c0-1.1.9-2 2-2h7V5.5Z" />
  </svg>
);

// 3 meses — Prevencionista Jr: cone de sinalização
const ConeIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M10 4h4l4 14H6L10 4Z" />
    <path d="M8 11h8" />
    <path d="M7 14.5h10" />
    <path d="M4 19h16" />
  </svg>
);

// 4 meses — Inspetor: triângulo de alerta com exclamação
const AlertTriangleIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M12 3.5 22 20H2L12 3.5Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="17" r=".8" fill="currentColor" />
  </svg>
);

// 6 meses — Analista: lupa sobre gráfico
const AnalystIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <circle cx="10.5" cy="10.5" r="5.5" />
    <path d="m20 20-4.5-4.5" />
    <path d="M8 12.5 10 10l2 2 2.5-3" />
  </svg>
);

// 8 meses — Estrategista SESMT: peça de xadrez (cavalo)
const KnightIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M7 20h11" />
    <path d="M8 20v-2c0-.7.3-1.3.8-1.7L11 15c.6-.5 1-1.2 1-2v-1l-2 1-1-1.5L11 9c0-3 2-5.5 5-5.5 1 2 1.5 4 1.5 6.5 0 4-1.5 6.5-4 8" />
    <path d="M9.5 8.5c.5.3 1 .3 1.5 0" />
  </svg>
);

// 10 meses — Especialista em NRs: pasta com selo
const NRBadgeIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M4 6.5C4 5.7 4.7 5 5.5 5H10l2 2h6.5c.8 0 1.5.7 1.5 1.5V18c0 .8-.7 1.5-1.5 1.5h-13C4.7 19.5 4 18.8 4 18V6.5Z" />
    <circle cx="15" cy="13" r="2.6" />
    <path d="m13.6 15.4-1 2.4 2.4-1.2 2.4 1.2-1-2.4" />
  </svg>
);

// 12 meses — Guardião: escudo com cruz/check
const ShieldGuardianIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.4 8 9 4.6-.6 8-4.5 8-9V6l-8-3Z" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);

// 15 meses — Auditor de Ouro: medalha com fitas
const MedalIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M8 3 6 9" />
    <path d="m16 3 2 6" />
    <path d="M9 3h6" />
    <circle cx="12" cy="15" r="5.5" />
    <path d="M12 12.5 13 14.5l2.2.3-1.6 1.5.4 2.2L12 17.5l-2 1 .4-2.2L8.8 14.8l2.2-.3L12 12.5Z" fill="currentColor" stroke="none" />
  </svg>
);

// 18 meses — Mestre SST: estrela octogonal com núcleo
const MasterStarIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M12 2 14.2 7.5 20 8.3l-4.2 3.9L17 18l-5-3-5 3 1.2-5.8L4 8.3l5.8-.8L12 2Z" />
    <path d="m12 6.5 1.4 3.5 3.6.5-2.6 2.4.7 3.6L12 14.5l-3.1 2 .7-3.6L7 10.5l3.6-.5L12 6.5Z" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

// 21 meses — Visionário: olho radiante / iris com raios
const VisionaryIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4" />
  </svg>
);

// 24 meses — Lenda: escudo laureado com coroa + circuito (ornamentado)
const LegendIcon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...p}>
    {/* coroa */}
    <path d="M6 5.5 8 7l2-2.5L12 7l2-2.5L16 7l2-1.5-.6 3H6.6L6 5.5Z" />
    {/* escudo */}
    <path d="M12 9c-3 0-5 .5-5 .5v4c0 3.5 2.2 6.4 5 7 2.8-.6 5-3.5 5-7v-4S15 9 12 9Z" />
    {/* loureiros laterais */}
    <path d="M5 13c-1 .5-1.6 1.5-1.6 2.6.9.2 1.8-.1 2.5-.7" />
    <path d="M3.8 16.4c-.3.9-.1 1.9.6 2.6.9-.2 1.6-.9 1.9-1.8" />
    <path d="M19 13c1 .5 1.6 1.5 1.6 2.6-.9.2-1.8-.1-2.5-.7" />
    <path d="M20.2 16.4c.3.9.1 1.9-.6 2.6-.9-.2-1.6-.9-1.9-1.8" />
    {/* núcleo / circuito */}
    <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
    <path d="M12 12.6V11M12 17v-1.2M10.6 14H9.2M14.8 14h-1.4" />
  </svg>
);

interface Tier {
  months: number;
  title: string;
  short: string;
  Icon: IconCmp;
  iconClass: string;
  bgClass: string;
  ringClass: string;
  glowClass: string;
  titleClass?: string;
  pulse?: boolean;
  ornate?: boolean; // adds laurel/dotted ring for upper tiers
}

export const LOYALTY_TIERS: Tier[] = [
  { months: 1,  title: "Recruta",                 short: "Recruta",      Icon: HelmetIcon,        iconClass: "text-zinc-200",                                                       bgClass: "bg-gradient-to-br from-zinc-700 to-zinc-900",                                       ringClass: "ring-1 ring-zinc-500/40",                          glowClass: "shadow-[0_0_10px_rgba(161,161,170,0.45)]" },
  { months: 2,  title: "Estudante",               short: "Estudante",    Icon: BookIcon,          iconClass: "text-slate-100",                                                      bgClass: "bg-gradient-to-br from-slate-400 to-slate-600",                                     ringClass: "ring-1 ring-slate-300/50",                         glowClass: "shadow-[0_0_10px_rgba(226,232,240,0.5)]" },
  { months: 3,  title: "Prevencionista Júnior",   short: "Prev. Jr.",    Icon: ConeIcon,          iconClass: "text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.85)]",        bgClass: "bg-gradient-to-br from-emerald-700 to-emerald-950",                                  ringClass: "ring-1 ring-emerald-400/40",                       glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.55)]" },
  { months: 4,  title: "Inspetor de Risco",       short: "Inspetor",     Icon: AlertTriangleIcon, iconClass: "text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.9)]",          bgClass: "bg-gradient-to-br from-yellow-700 to-amber-950",                                     ringClass: "ring-1 ring-yellow-400/45",                        glowClass: "shadow-[0_0_12px_rgba(250,204,21,0.55)]" },
  { months: 6,  title: "Analista de Segurança",   short: "Analista",     Icon: AnalystIcon,       iconClass: "text-blue-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.95)]",           bgClass: "bg-gradient-to-br from-blue-700 to-blue-950",                                        ringClass: "ring-1 ring-blue-400/50",                          glowClass: "shadow-[0_0_14px_rgba(59,130,246,0.6)]" },
  { months: 8,  title: "Estrategista de SESMT",   short: "Estrategista", Icon: KnightIcon,        iconClass: "text-red-300 drop-shadow-[0_0_4px_rgba(239,68,68,0.95)]",             bgClass: "bg-gradient-to-br from-red-700 to-red-950",                                          ringClass: "ring-1 ring-red-400/50",                           glowClass: "shadow-[0_0_14px_rgba(239,68,68,0.6)]" },
  { months: 10, title: "Especialista em NRs",     short: "Especialista", Icon: NRBadgeIcon,       iconClass: "text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.95)]",         bgClass: "bg-gradient-to-br from-purple-700 to-purple-950",                                    ringClass: "ring-1 ring-purple-400/50",                        glowClass: "shadow-[0_0_14px_rgba(168,85,247,0.6)]" },
  { months: 12, title: "Guardião da Vida",        short: "Guardião",     Icon: ShieldGuardianIcon,iconClass: "text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,1)]",           bgClass: "bg-gradient-to-br from-emerald-600 to-emerald-950",                                  ringClass: "ring-2 ring-emerald-300/55",                       glowClass: "shadow-[0_0_16px_rgba(16,185,129,0.7)]", ornate: true },
  { months: 15, title: "Auditor de Ouro",         short: "Auditor",      Icon: MedalIcon,         iconClass: "text-amber-300 drop-shadow-[0_0_5px_rgba(251,191,36,1)]",             bgClass: "bg-gradient-to-br from-amber-500 via-yellow-700 to-amber-950",                       ringClass: "ring-2 ring-amber-300/60",                         glowClass: "shadow-[0_0_16px_rgba(251,191,36,0.75)]", ornate: true },
  { months: 18, title: "Mestre SST",              short: "Mestre",       Icon: MasterStarIcon,    iconClass: "text-cyan-200 drop-shadow-[0_0_6px_rgba(103,232,249,1)]",             bgClass: "bg-gradient-to-br from-cyan-600 to-sky-950",                                         ringClass: "ring-2 ring-cyan-300/60",                          glowClass: "shadow-[0_0_18px_rgba(103,232,249,0.75)]", ornate: true },
  { months: 21, title: "Visionário da Prevenção", short: "Visionário",   Icon: VisionaryIcon,     iconClass: "text-pink-200 drop-shadow-[0_0_6px_rgba(236,72,153,1)]",              bgClass: "bg-gradient-to-br from-purple-600 via-pink-600 to-red-700",                          ringClass: "ring-2 ring-pink-300/60",                          glowClass: "shadow-[0_0_20px_rgba(236,72,153,0.8)]", ornate: true, titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-bold" },
  { months: 24, title: "Lenda da Segurança",      short: "Lenda",        Icon: LegendIcon,        iconClass: "text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,1)]",              bgClass: "bg-gradient-to-br from-cyan-500 via-emerald-500 to-blue-700",                        ringClass: "ring-2 ring-cyan-200/70",                          glowClass: "shadow-[0_0_22px_rgba(34,211,238,0.9),0_0_32px_rgba(16,185,129,0.7)]", pulse: true, ornate: true, titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 font-extrabold" },
];

function monthsBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
}

interface Props {
  startDate: string | Date;
  className?: string;
}

export default function LoyaltyProgram({ startDate, className }: Props) {
  const userMonths = useMemo(() => {
    const d = typeof startDate === "string" ? new Date(startDate) : startDate;
    if (!d || isNaN(d.getTime())) return 0;
    return monthsBetween(d, new Date());
  }, [startDate]);

  const nextTier = LOYALTY_TIERS.find((t) => t.months > userMonths) ?? null;
  const prevReached = [...LOYALTY_TIERS].reverse().find((t) => t.months <= userMonths) ?? null;

  let progressPct = 100;
  let progressLabel = "Você atingiu o nível máximo da fidelidade!";
  if (nextTier) {
    const base = prevReached?.months ?? 0;
    const span = nextTier.months - base;
    const done = userMonths - base;
    progressPct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
    const remaining = nextTier.months - userMonths;
    progressLabel = `Faltam ${remaining} ${remaining === 1 ? "mês" : "meses"} para "${nextTier.title}"`;
  }

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Trophy className="w-4 h-4 text-primary" />
        <h2 className="font-bold text-base">Programa de Fidelidade</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {userMonths} {userMonths === 1 ? "mês" : "meses"}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{progressLabel}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
        {LOYALTY_TIERS.map((tier) => {
          const unlocked = tier.months <= userMonths;
          const Icon = tier.Icon;
          return (
            <div
              key={tier.months}
              aria-label={`${tier.title} — ${tier.months} ${tier.months === 1 ? "mês" : "meses"} — ${unlocked ? "desbloqueado" : "bloqueado"}`}
              className={cn(
                "shrink-0 w-[72px] sm:w-[78px] flex flex-col items-center gap-1 text-center",
                !unlocked && "opacity-40 grayscale",
              )}
            >
              <div
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center",
                  tier.bgClass,
                  tier.ringClass,
                  unlocked ? tier.glowClass : "shadow-none",
                  unlocked && tier.pulse && "animate-pulse",
                )}
              >
                {/* Ornate dotted halo for upper tiers */}
                {unlocked && tier.ornate && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-[-3px] rounded-full pointer-events-none",
                      "border border-dashed border-white/25",
                    )}
                  />
                )}
                <Icon className={cn("w-6 h-6", tier.iconClass)} />
                {!unlocked && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                  </span>
                )}
              </div>
              <p className={cn("text-[10px] leading-tight truncate w-full", unlocked ? tier.titleClass ?? "font-medium text-foreground" : "text-muted-foreground")}>
                {tier.short}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
