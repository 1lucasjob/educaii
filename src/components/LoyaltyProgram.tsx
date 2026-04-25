import { useMemo } from "react";
import { Lock, Trophy } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };
type IconCmp = ComponentType<IconProps>;

/* ============================================================
   12 CRISTAIS ÚNICOS — cada tier é uma gema diferente.
   Formatos crescem em complexidade conforme o tempo.
   currentColor + facetas internas para profundidade.
   ============================================================ */

// 1m — Cristal bruto (lasca simples)
const CrystalShard: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M9 3 7 11l5 10 5-10-2-8H9Z" fill="currentColor" fillOpacity={0.18} />
    <path d="M9 3l3 8 3-8M7 11h10M12 11v10" />
  </svg>
);

// 2m — Cristal triangular bipiramidal
const CrystalBiPyramid: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 2 4 12l8 10 8-10L12 2Z" fill="currentColor" fillOpacity={0.18} />
    <path d="M4 12h16M12 2v20M7 12l5-6 5 6-5 6-5-6Z" />
  </svg>
);

// 3m — Esmeralda (corte retangular com facetas)
const CrystalEmerald: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M7 4h10l3 4-8 14L4 8l3-4Z" fill="currentColor" fillOpacity={0.2} />
    <path d="M7 4l-3 4h16l-3-4M4 8l8 4 8-4M12 12v10" />
  </svg>
);

// 4m — Cristal hexagonal alongado (prisma)
const CrystalHexPrism: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M8 3h8l3 5-3 13H8L5 8l3-5Z" fill="currentColor" fillOpacity={0.2} />
    <path d="M5 8h14M8 3l-1 5 5 13 5-13-1-5M12 8v13" />
  </svg>
);

// 6m — Diamante brilhante (round brilliant)
const CrystalBrilliant: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M5 9 12 2l7 7-7 13L5 9Z" fill="currentColor" fillOpacity={0.22} />
    <path d="M5 9h14M12 2l-3 7 3 13 3-13-3-7M9 9l3-7M15 9l-3-7" />
  </svg>
);

// 8m — Marquise (oval pontiagudo)
const CrystalMarquise: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 2C7 7 4 10 2 12c2 2 5 5 10 10 5-5 8-8 10-10-2-2-5-5-10-10Z" fill="currentColor" fillOpacity={0.2} />
    <path d="M2 12h20M12 2v20M6 8l12 8M18 8 6 16" />
  </svg>
);

// 10m — Coração facetado
const CrystalHeart: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 21 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6l-8 9Z" fill="currentColor" fillOpacity={0.22} />
    <path d="M4 12h16M12 6v15M8 8l4 6 4-6" />
  </svg>
);

// 12m — Estrela de 5 pontas facetada (escudo de cristal)
const CrystalStar5: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 2 14.5 9H22l-6 4.5L18.5 21 12 16.8 5.5 21 8 13.5 2 9h7.5L12 2Z" fill="currentColor" fillOpacity={0.25} />
    <path d="M12 9.5 9.5 13l2.5 2 2.5-2L12 9.5ZM2 9l10 4 10-4M12 2v11" />
  </svg>
);

// 15m — Estrela de 6 pontas (hexagrama de ouro)
const CrystalStar6: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 2 4 16h16L12 2Z" fill="currentColor" fillOpacity={0.25} />
    <path d="M12 22 4 8h16L12 22Z" fill="currentColor" fillOpacity={0.25} />
    <path d="M12 2 4 16h16zM12 22 4 8h16z" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// 18m — Cristal octogonal com núcleo radiante
const CrystalOctagon: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className} {...p}>
    <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8l6-6Z" fill="currentColor" fillOpacity={0.22} />
    <path d="M2 8h20M2 16h20M8 2v20M16 2v20" />
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);

// 21m — Rosa cristalina (pétalas facetadas)
const CrystalRose: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" className={className} {...p}>
    <path d="M12 3 7 7l-4 5 4 5 5 4 5-4 4-5-4-5-5-4Z" fill="currentColor" fillOpacity={0.22} />
    <path d="M12 3v18M3 12h18M7 7l10 10M17 7 7 17" />
    <path d="M12 8a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4Z" fill="currentColor" fillOpacity={0.3} />
  </svg>
);

// 24m — Cristal lendário: dodecágono com coroa de raios
const CrystalLegend: IconCmp = ({ className, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" className={className} {...p}>
    {/* raios externos */}
    <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l1.4 1.4M18.6 18.6 20 20M4 20l1.4-1.4M18.6 5.4 20 4" />
    {/* dodecágono */}
    <path d="M12 3 16 4.5l3 3L20.5 12 19 16.5l-3 3L12 21l-4-1.5-3-3L3.5 12 5 7.5l3-3L12 3Z" fill="currentColor" fillOpacity={0.25} />
    {/* facetas internas */}
    <path d="M12 3v18M3.5 12h17M5 7.5l14 9M19 7.5l-14 9" />
    <path d="M12 8.5 15.5 12 12 15.5 8.5 12 12 8.5Z" fill="currentColor" fillOpacity={0.4} />
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
}

export const LOYALTY_TIERS: Tier[] = [
  { months: 1,  title: "Recruta",                 short: "Recruta",      Icon: CrystalShard,      iconClass: "text-zinc-200",                                                       bgClass: "bg-gradient-to-br from-zinc-700 to-zinc-900",                                       ringClass: "ring-1 ring-zinc-500/40",                          glowClass: "shadow-[0_0_10px_rgba(161,161,170,0.45)]" },
  { months: 2,  title: "Estudante",               short: "Estudante",    Icon: CrystalBiPyramid,  iconClass: "text-slate-100",                                                      bgClass: "bg-gradient-to-br from-slate-400 to-slate-600",                                     ringClass: "ring-1 ring-slate-300/50",                         glowClass: "shadow-[0_0_10px_rgba(226,232,240,0.5)]" },
  { months: 3,  title: "Prevencionista Júnior",   short: "Prev. Jr.",    Icon: CrystalEmerald,    iconClass: "text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.85)]",        bgClass: "bg-gradient-to-br from-emerald-700 to-emerald-950",                                  ringClass: "ring-1 ring-emerald-400/40",                       glowClass: "shadow-[0_0_12px_rgba(52,211,153,0.55)]" },
  { months: 4,  title: "Inspetor de Risco",       short: "Inspetor",     Icon: CrystalHexPrism,   iconClass: "text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.9)]",          bgClass: "bg-gradient-to-br from-yellow-700 to-amber-950",                                     ringClass: "ring-1 ring-yellow-400/45",                        glowClass: "shadow-[0_0_12px_rgba(250,204,21,0.55)]" },
  { months: 6,  title: "Analista de Segurança",   short: "Analista",     Icon: CrystalBrilliant,  iconClass: "text-blue-300 drop-shadow-[0_0_4px_rgba(59,130,246,0.95)]",           bgClass: "bg-gradient-to-br from-blue-700 to-blue-950",                                        ringClass: "ring-1 ring-blue-400/50",                          glowClass: "shadow-[0_0_14px_rgba(59,130,246,0.6)]" },
  { months: 8,  title: "Estrategista de SESMT",   short: "Estrategista", Icon: CrystalMarquise,   iconClass: "text-red-300 drop-shadow-[0_0_4px_rgba(239,68,68,0.95)]",             bgClass: "bg-gradient-to-br from-red-700 to-red-950",                                          ringClass: "ring-1 ring-red-400/50",                           glowClass: "shadow-[0_0_14px_rgba(239,68,68,0.6)]" },
  { months: 10, title: "Especialista em NRs",     short: "Especialista", Icon: CrystalHeart,      iconClass: "text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.95)]",         bgClass: "bg-gradient-to-br from-purple-700 to-purple-950",                                    ringClass: "ring-1 ring-purple-400/50",                        glowClass: "shadow-[0_0_14px_rgba(168,85,247,0.6)]" },
  { months: 12, title: "Guardião da Vida",        short: "Guardião",     Icon: CrystalStar5,      iconClass: "text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,1)]",           bgClass: "bg-gradient-to-br from-emerald-600 to-emerald-950",                                  ringClass: "ring-2 ring-emerald-300/55",                       glowClass: "shadow-[0_0_16px_rgba(16,185,129,0.7)]" },
  { months: 15, title: "Auditor de Ouro",         short: "Auditor",      Icon: CrystalStar6,      iconClass: "text-amber-300 drop-shadow-[0_0_5px_rgba(251,191,36,1)]",             bgClass: "bg-gradient-to-br from-amber-500 via-yellow-700 to-amber-950",                       ringClass: "ring-2 ring-amber-300/60",                         glowClass: "shadow-[0_0_16px_rgba(251,191,36,0.75)]" },
  { months: 18, title: "Mestre SST",              short: "Mestre",       Icon: CrystalOctagon,    iconClass: "text-cyan-200 drop-shadow-[0_0_6px_rgba(103,232,249,1)]",             bgClass: "bg-gradient-to-br from-cyan-600 to-sky-950",                                         ringClass: "ring-2 ring-cyan-300/60",                          glowClass: "shadow-[0_0_18px_rgba(103,232,249,0.75)]" },
  { months: 21, title: "Visionário da Prevenção", short: "Visionário",   Icon: CrystalRose,       iconClass: "text-pink-200 drop-shadow-[0_0_6px_rgba(236,72,153,1)]",              bgClass: "bg-gradient-to-br from-purple-600 via-pink-600 to-red-700",                          ringClass: "ring-2 ring-pink-300/60",                          glowClass: "shadow-[0_0_20px_rgba(236,72,153,0.8)]", titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 font-bold" },
  { months: 24, title: "Lenda da Segurança",      short: "Lenda",        Icon: CrystalLegend,     iconClass: "text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,1)]",              bgClass: "bg-gradient-to-br from-cyan-500 via-emerald-500 to-blue-700",                        ringClass: "ring-2 ring-cyan-200/70",                          glowClass: "shadow-[0_0_22px_rgba(34,211,238,0.9),0_0_32px_rgba(16,185,129,0.7)]", pulse: true, titleClass: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 font-extrabold" },
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
