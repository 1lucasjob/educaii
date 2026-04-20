import type { AccessPlan } from "@/contexts/AuthContext";

const DAY_MS = 86_400_000;
const CHAT_HARD_TRIAL_DAYS = 15;
const BASE_TRIAL_DAYS = 30;

// days_60 plan: chat = 15 days, hard simulado = 10 days from activation
const DAYS_60_CHAT_DAYS = 15;
const DAYS_60_HARD_DAYS = 10;
const DAYS_60_TOTAL = 60;

export interface FreeTrialStatus {
  isFree: boolean;
  daysSinceSignup: number;
  chatDaysLeft: number;   // chat + simulado difícil
  baseDaysLeft: number;   // resumo + simulado fácil
  freeChatActive: boolean;
  freeHardActive: boolean;
  freeBaseActive: boolean;
}

export function computeFreeTrial(opts: {
  plan: AccessPlan | null | undefined;
  createdAt: string | null | undefined;
}): FreeTrialStatus {
  const isFree = opts.plan === "free";
  const created = opts.createdAt ? new Date(opts.createdAt).getTime() : Date.now();
  const daysSinceSignup = Math.floor((Date.now() - created) / DAY_MS);
  const chatDaysLeft = Math.max(0, CHAT_HARD_TRIAL_DAYS - daysSinceSignup);
  const baseDaysLeft = Math.max(0, BASE_TRIAL_DAYS - daysSinceSignup);
  return {
    isFree,
    daysSinceSignup,
    chatDaysLeft,
    baseDaysLeft,
    freeChatActive: isFree && chatDaysLeft > 0,
    freeHardActive: isFree && chatDaysLeft > 0,
    freeBaseActive: isFree && baseDaysLeft > 0,
  };
}

export interface PlanWindowStatus {
  applies: boolean;       // true se o plano usa janelas (atualmente só days_60)
  chatDaysLeft: number;
  hardDaysLeft: number;
  chatActive: boolean;
  hardActive: boolean;
}

/**
 * Janela de funcionalidades para planos com benefícios temporários (days_60).
 * Para outros planos, retorna applies=false; o gating padrão deve ser usado.
 */
export function computePlanWindows(opts: {
  plan: AccessPlan | null | undefined;
  accessExpiresAt: string | null | undefined;
}): PlanWindowStatus {
  if (opts.plan !== "days_60" || !opts.accessExpiresAt) {
    return { applies: false, chatDaysLeft: 0, hardDaysLeft: 0, chatActive: false, hardActive: false };
  }
  const expires = new Date(opts.accessExpiresAt).getTime();
  const start = expires - DAYS_60_TOTAL * DAY_MS;
  const daysSinceStart = Math.floor((Date.now() - start) / DAY_MS);
  const chatDaysLeft = Math.max(0, DAYS_60_CHAT_DAYS - daysSinceStart);
  const hardDaysLeft = Math.max(0, DAYS_60_HARD_DAYS - daysSinceStart);
  return {
    applies: true,
    chatDaysLeft,
    hardDaysLeft,
    chatActive: chatDaysLeft > 0,
    hardActive: hardDaysLeft > 0,
  };
}

/**
 * Acesso ao Simulado Expert.
 * Liberado para planos premium e days_90, ou se houver liberação ADM temporária ativa.
 */
export function expertActive(opts: {
  plan: AccessPlan | null | undefined;
  expertUnlockedUntil: string | null | undefined;
}): boolean {
  if (opts.plan === "premium" || opts.plan === "days_90") return true;
  if (opts.expertUnlockedUntil) {
    return new Date(opts.expertUnlockedUntil).getTime() > Date.now();
  }
  return false;
}
