import type { AccessPlan } from "@/contexts/AuthContext";

export const PLANS: { id: AccessPlan; label: string; days: number; description: string }[] = [
  { id: "free", label: "FREE", days: 30, description: "30 dias · sem renovação" },
  { id: "days_30", label: "30 DAYS", days: 30, description: "30 dias · renovável" },
  { id: "days_90", label: "90 DAYS", days: 90, description: "90 dias · renovável" },
  { id: "premium", label: "PREMIUM", days: 366, description: "366 dias · renovável" },
];

export const planLabel = (p: AccessPlan) => PLANS.find((x) => x.id === p)?.label ?? p;

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

/** Show the renewal banner when ≤10 days remaining. FREE has no renewal. */
export function shouldShowRenewal(plan: AccessPlan, expiresAt: string | null): boolean {
  if (plan === "free") return false;
  const d = daysUntil(expiresAt);
  return d !== null && d <= 10 && d >= 0;
}

const ADMIN_EMAIL = "1lucasjob@gmail.com";

export function buildRenewalMailto(opts: {
  userEmail: string;
  plan: AccessPlan;
  expiresAt: string | null;
}): string {
  const subject = `Renovação de acesso EducA.I. — ${planLabel(opts.plan)}`;
  const body = [
    `Olá,`,
    ``,
    `Gostaria de renovar meu acesso ao EducA.I.`,
    ``,
    `Email da conta: ${opts.userEmail}`,
    `Plano atual: ${planLabel(opts.plan)}`,
    `Expira em: ${opts.expiresAt ? new Date(opts.expiresAt).toLocaleDateString("pt-BR") : "—"}`,
    ``,
    `Obrigado!`,
  ].join("\n");
  return `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
