import preset1 from "@/assets/avatars/preset-1-homem-negro.png";
import preset2 from "@/assets/avatars/preset-2-mulher-negra.png";
import preset3 from "@/assets/avatars/preset-3-homem-japones.png";
import preset4 from "@/assets/avatars/preset-4-mulher-japonesa.png";
import preset5 from "@/assets/avatars/preset-5-homem-branco-sem-barba.png";
import preset6 from "@/assets/avatars/preset-6-homem-branco-com-barba.png";
import preset7 from "@/assets/avatars/preset-7-mulher-branca.png";
// preset-8 mantido como "alienígena neutro/clássico" (legado).
// O par M/F formal de alienígena humano é preset-11/preset-12.
import preset8 from "@/assets/avatars/preset-8-alienigena.png";
import preset9 from "@/assets/avatars/preset-9-homem-loiro.png";
import preset10 from "@/assets/avatars/preset-10-mulher-loira.png";
import preset11 from "@/assets/avatars/preset-11-alienigena-masculo.png";
import preset12 from "@/assets/avatars/preset-12-alienigena-feminina.png";
import preset13 from "@/assets/avatars/preset-13-mulher-branca-cabelo-cacheado.png";
import achCoruja from "@/assets/avatars/achievement-coruja.png";
import achAlienCosmico from "@/assets/avatars/achievement-alienigena-cosmico.png";
import achRobo from "@/assets/avatars/achievement-robo.png";
import achPirata from "@/assets/avatars/achievement-pirata.png";
import achFenix from "@/assets/avatars/achievement-fenix.png";
import achCorujaF from "@/assets/avatars/achievement-coruja-feminina.png";
import achAlienCosmicoF from "@/assets/avatars/achievement-alienigena-cosmico-feminina.png";
import achRoboF from "@/assets/avatars/achievement-robo-feminina.png";
import achPirataF from "@/assets/avatars/achievement-pirata-feminina.png";
import achFenixF from "@/assets/avatars/achievement-fenix-feminina.png";
import adminCoroa from "@/assets/avatars/admin-coroa.png";
import adminIaNeural from "@/assets/avatars/admin-ia-neural.png";
import adminIaCyber from "@/assets/avatars/admin-ia-cyber.png";
import planAlienMasc from "@/assets/avatars/plan-alien-masculino.png";
import planAlienFem from "@/assets/avatars/plan-alien-feminina.png";
import planPremiumOculosMasc from "@/assets/avatars/plan-premium-oculos-masculino.png";
import planPremiumOculosFem from "@/assets/avatars/plan-premium-oculos-feminina.png";
import type { AccessPlan } from "@/contexts/AuthContext";

export type AvatarCategory = "human" | "achievement" | "admin" | "plan";

export interface PresetAvatar {
  id: string;
  label: string;
  src: string;
  category: AvatarCategory;
  /** id da conquista necessária (de src/lib/achievements.ts) */
  requiresAchievement?: string;
  /** se true, só aparece para admins */
  requiresAdmin?: boolean;
  /** planos elegíveis (para category "plan") */
  requiresPlanIn?: AccessPlan[];
  /** classes Tailwind aplicadas no ring/glow exclusivo */
  borderClass?: string;
}

const ACHIEVEMENT_BORDER =
  "ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]";
const PHOENIX_BORDER =
  "ring-4 ring-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.75)]";
const ADMIN_BORDER =
  "ring-4 ring-slate-200 shadow-[0_0_24px_rgba(203,213,225,0.85)]";
const PLAN_PURPLE_BORDER =
  "ring-4 ring-purple-500 shadow-[0_0_22px_rgba(168,85,247,0.7)]";
const PLAN_PREMIUM_GOLD_BORDER =
  "ring-4 ring-yellow-400 shadow-[0_0_26px_rgba(250,204,21,0.85)]";

/** Planos elegíveis para a borda roxa (90 dias ou superior). */
export const PURPLE_PLAN_TIERS: AccessPlan[] = ["days_90", "days_180", "premium"];
/** Planos elegíveis para os avatares exclusivos Premium. */
export const PREMIUM_PLAN_TIERS: AccessPlan[] = ["premium"];

export const PRESET_AVATARS: PresetAvatar[] = [
  // ===== Humanos (livres para todos) — pares M/F =====
  { id: "homem-negro", label: "Homem negro", src: preset1, category: "human" },
  { id: "mulher-negra", label: "Mulher negra", src: preset2, category: "human" },
  { id: "homem-japones", label: "Homem japonês", src: preset3, category: "human" },
  { id: "mulher-japonesa", label: "Mulher japonesa", src: preset4, category: "human" },
  { id: "homem-branco-sb", label: "Homem branco sem barba", src: preset5, category: "human" },
  { id: "mulher-branca", label: "Mulher branca", src: preset7, category: "human" },
  { id: "homem-branco-cb", label: "Homem branco com barba", src: preset6, category: "human" },
  { id: "mulher-branca-cacheada", label: "Mulher branca cabelo cacheado", src: preset13, category: "human" },
  { id: "homem-loiro", label: "Homem loiro", src: preset9, category: "human" },
  { id: "mulher-loira", label: "Mulher loira", src: preset10, category: "human" },
  { id: "alienigena-masculo", label: "Alienígena másculo", src: preset11, category: "human" },
  { id: "alienigena-feminina", label: "Alienígena feminina", src: preset12, category: "human" },
  // Alienígena clássico (legado, mantido por compatibilidade com avatares já escolhidos)
  { id: "alienigena-humano", label: "Alienígena clássico", src: preset8, category: "human" },

  // ===== Conquistas (ocultos até desbloquear, exceto para admin) — pares M/F =====
  {
    id: "ach-coruja",
    label: "Coruja Noturna",
    src: achCoruja,
    category: "achievement",
    requiresAchievement: "secret_night_owl",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-coruja-f",
    label: "Coruja Noturna (feminina)",
    src: achCorujaF,
    category: "achievement",
    requiresAchievement: "secret_night_owl",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-alien-cosmico",
    label: "Alienígena Cósmico",
    src: achAlienCosmico,
    category: "achievement",
    requiresAchievement: "ultra_omniscient",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-alien-cosmico-f",
    label: "Alienígena Cósmica (feminina)",
    src: achAlienCosmicoF,
    category: "achievement",
    requiresAchievement: "ultra_omniscient",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-robo",
    label: "Robô",
    src: achRobo,
    category: "achievement",
    requiresAchievement: "ultra_time_mage",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-robo-f",
    label: "Robô (feminina)",
    src: achRoboF,
    category: "achievement",
    requiresAchievement: "ultra_time_mage",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-pirata",
    label: "Pirata",
    src: achPirata,
    category: "achievement",
    requiresAchievement: "secret_marathon",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-pirata-f",
    label: "Pirata (feminina)",
    src: achPirataF,
    category: "achievement",
    requiresAchievement: "secret_marathon",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-fenix",
    label: "Fênix",
    src: achFenix,
    category: "achievement",
    requiresAchievement: "secret_phoenix",
    borderClass: PHOENIX_BORDER,
  },
  {
    id: "ach-fenix-f",
    label: "Fênix (feminina)",
    src: achFenixF,
    category: "achievement",
    requiresAchievement: "secret_phoenix",
    borderClass: PHOENIX_BORDER,
  },

  // ===== Plano 90 dias ou superior (borda roxa exclusiva) — par M/F =====
  {
    id: "plan-alien-masc",
    label: "Alienígena Humanoide",
    src: planAlienMasc,
    category: "plan",
    requiresPlanIn: PURPLE_PLAN_TIERS,
    borderClass: PLAN_PURPLE_BORDER,
  },
  {
    id: "plan-alien-fem",
    label: "Alienígena Humanoide (feminina)",
    src: planAlienFem,
    category: "plan",
    requiresPlanIn: PURPLE_PLAN_TIERS,
    borderClass: PLAN_PURPLE_BORDER,
  },

  // ===== Plano Premium (exclusivos) — par M/F com borda dourada =====
  {
    id: "plan-premium-oculos-masc",
    label: "Premium — Homem de óculos",
    src: planPremiumOculosMasc,
    category: "plan",
    requiresPlanIn: PREMIUM_PLAN_TIERS,
    borderClass: PLAN_PREMIUM_GOLD_BORDER,
  },
  {
    id: "plan-premium-oculos-fem",
    label: "Premium — Mulher de óculos",
    src: planPremiumOculosFem,
    category: "plan",
    requiresPlanIn: PREMIUM_PLAN_TIERS,
    borderClass: PLAN_PREMIUM_GOLD_BORDER,
  },

  // ===== Admin (todos masculinos, foco em tecnologia/IA) =====
  {
    id: "admin-coroa",
    label: "Imperador da IA",
    src: adminCoroa,
    category: "admin",
    requiresAdmin: true,
    borderClass: ADMIN_BORDER,
  },
  {
    id: "admin-ia-neural",
    label: "Arquiteto Neural",
    src: adminIaNeural,
    category: "admin",
    requiresAdmin: true,
    borderClass: ADMIN_BORDER,
  },
  {
    id: "admin-ia-cyber",
    label: "Ciborgue Mestre",
    src: adminIaCyber,
    category: "admin",
    requiresAdmin: true,
    borderClass: ADMIN_BORDER,
  },
];

/** Retorna o preset cuja src bate com a URL informada (ou undefined). */
export function findPresetBySrc(url: string | null | undefined): PresetAvatar | undefined {
  if (!url) return undefined;
  return PRESET_AVATARS.find((p) => p.src === url);
}

/** Retorna o preset pelo id. */
export function findPresetById(id: string | null | undefined): PresetAvatar | undefined {
  if (!id) return undefined;
  return PRESET_AVATARS.find((p) => p.id === id);
}

/** Verifica se um plano dá direito à borda roxa. */
export function planQualifiesForPurple(plan: AccessPlan | null | undefined): boolean {
  if (!plan) return false;
  return PURPLE_PLAN_TIERS.includes(plan);
}

/**
 * Lista os presets disponíveis como BORDA exclusiva para o usuário.
 * Retorna no máximo UM preset por `borderClass` (deduplicação por tipo/cor),
 * para que a UI mostre apenas uma representação visual de cada borda.
 * Admin vê todas; demais respeitam conquista/plano.
 */
export function availableBorderPresets(opts: {
  isAdmin: boolean;
  unlockedAchievementIds: Set<string>;
  plan: AccessPlan | null | undefined;
}): PresetAvatar[] {
  const eligible = PRESET_AVATARS.filter((p) => {
    if (!p.borderClass) return false;
    if (opts.isAdmin) return true;
    if (p.category === "admin") return false;
    if (p.category === "achievement") {
      return p.requiresAchievement
        ? opts.unlockedAchievementIds.has(p.requiresAchievement)
        : true;
    }
    if (p.category === "plan") {
      return !!(p.requiresPlanIn && opts.plan && p.requiresPlanIn.includes(opts.plan));
    }
    return false;
  });

  // Dedup: 1 preset por borderClass (mantém o primeiro encontrado).
  const seen = new Set<string>();
  const unique: PresetAvatar[] = [];
  for (const p of eligible) {
    const key = p.borderClass!;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  return unique;
}
