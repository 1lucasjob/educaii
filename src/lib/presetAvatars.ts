import preset1 from "@/assets/avatars/preset-1-homem-negro.png";
import preset2 from "@/assets/avatars/preset-2-mulher-negra.png";
import preset3 from "@/assets/avatars/preset-3-homem-japones.png";
import preset4 from "@/assets/avatars/preset-4-mulher-japonesa.png";
import preset5 from "@/assets/avatars/preset-5-homem-branco-sem-barba.png";
import preset6 from "@/assets/avatars/preset-6-homem-branco-com-barba.png";
import preset7 from "@/assets/avatars/preset-7-mulher-branca.png";
import preset8 from "@/assets/avatars/preset-8-alienigena.png";
import achCoruja from "@/assets/avatars/achievement-coruja.png";
import achAlienCosmico from "@/assets/avatars/achievement-alienigena-cosmico.png";
import achRobo from "@/assets/avatars/achievement-robo.png";
import achPirata from "@/assets/avatars/achievement-pirata.png";
import adminCoroa from "@/assets/avatars/admin-coroa.png";
import planAlienMasc from "@/assets/avatars/plan-alien-masculino.png";
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
  /** planos mínimos elegíveis (para category "plan") */
  requiresPlanIn?: AccessPlan[];
  /** classes Tailwind extras aplicadas no ring/glow exclusivo */
  borderClass?: string;
}

const ACHIEVEMENT_BORDER =
  "ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]";
const ADMIN_BORDER =
  "ring-4 ring-slate-200 shadow-[0_0_24px_rgba(203,213,225,0.85)]";
const PLAN_PURPLE_BORDER =
  "ring-4 ring-purple-500 shadow-[0_0_22px_rgba(168,85,247,0.7)]";

/** Planos elegíveis para a borda roxa (90 dias ou superior). */
export const PURPLE_PLAN_TIERS: AccessPlan[] = ["days_90", "days_180", "premium"];

export const PRESET_AVATARS: PresetAvatar[] = [
  // ===== Humanos (livres para todos) =====
  { id: "homem-negro", label: "Homem negro", src: preset1, category: "human" },
  { id: "mulher-negra", label: "Mulher negra", src: preset2, category: "human" },
  { id: "homem-japones", label: "Homem japonês", src: preset3, category: "human" },
  { id: "mulher-japonesa", label: "Mulher japonesa", src: preset4, category: "human" },
  { id: "homem-branco-sb", label: "Homem branco sem barba", src: preset5, category: "human" },
  { id: "homem-branco-cb", label: "Homem branco com barba", src: preset6, category: "human" },
  { id: "mulher-branca", label: "Mulher branca", src: preset7, category: "human" },
  { id: "alienigena-humano", label: "Alienígena", src: preset8, category: "human" },

  // ===== Conquistas (ocultos até desbloquear) =====
  {
    id: "ach-coruja",
    label: "Coruja Noturna",
    src: achCoruja,
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
    id: "ach-robo",
    label: "Robô",
    src: achRobo,
    category: "achievement",
    requiresAchievement: "ultra_time_mage",
    borderClass: ACHIEVEMENT_BORDER,
  },
  {
    id: "ach-pirata",
    label: "Pirata",
    src: achPirata,
    category: "achievement",
    requiresAchievement: "secret_phoenix",
    borderClass: ACHIEVEMENT_BORDER,
  },

  // ===== Plano 90 dias ou superior (borda roxa exclusiva) =====
  {
    id: "plan-alien-masc",
    label: "Alienígena Humanoide",
    src: planAlienMasc,
    category: "plan",
    requiresPlanIn: PURPLE_PLAN_TIERS,
    borderClass: PLAN_PURPLE_BORDER,
  },

  // ===== Admin =====
  {
    id: "admin-coroa",
    label: "Coroa do Admin",
    src: adminCoroa,
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

/** Verifica se um plano dá direito à borda roxa. */
export function planQualifiesForPurple(plan: AccessPlan | null | undefined): boolean {
  if (!plan) return false;
  return PURPLE_PLAN_TIERS.includes(plan);
}
