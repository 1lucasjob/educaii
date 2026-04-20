import type { AccessPlan } from "@/contexts/AuthContext";

const DAY_MS = 86_400_000;
const CHAT_HARD_TRIAL_DAYS = 15;
const BASE_TRIAL_DAYS = 30;

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
