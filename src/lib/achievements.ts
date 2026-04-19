import { Trophy, Flame, Star, Target, Award, Crown, Zap, BookOpen, Medal, Rocket } from "lucide-react";

export interface AttemptLite {
  topic: string;
  difficulty: string;
  score: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress: number; // 0-100
  hint: string;
}

export function computeAchievements(attempts: AttemptLite[]): Achievement[] {
  const total = attempts.length;
  const hardAttempts = attempts.filter((a) => a.difficulty === "hard");
  const hardPassed = hardAttempts.filter((a) => a.score >= 80).length;
  const perfect = attempts.filter((a) => a.score === 100).length;
  const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
  const uniqueTopics = new Set(attempts.map((a) => a.topic.toLowerCase().trim())).size;

  // Streak: consecutive hard passes from most recent backwards
  const sorted = [...hardAttempts].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  let streak = 0;
  for (const a of sorted) {
    if (a.score >= 80) streak++;
    else break;
  }

  // Daily activity: unique days
  const uniqueDays = new Set(attempts.map((a) => new Date(a.created_at).toDateString())).size;

  const pct = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));

  return [
    {
      id: "first_step",
      title: "Primeiro Passo",
      description: "Conclua seu primeiro simulado",
      icon: Rocket,
      unlocked: total >= 1,
      progress: pct(total, 1),
      hint: `${total}/1 simulados`,
    },
    {
      id: "approved",
      title: "Aprovado",
      description: "Passe em um simulado difícil com 80+",
      icon: Trophy,
      unlocked: hardPassed >= 1,
      progress: pct(hardPassed, 1),
      hint: `${hardPassed}/1 aprovações`,
    },
    {
      id: "perfectionist",
      title: "Perfeccionista",
      description: "Tire 100 pontos em um simulado",
      icon: Star,
      unlocked: perfect >= 1,
      progress: best >= 100 ? 100 : pct(best, 100),
      hint: `Melhor: ${best}/100`,
    },
    {
      id: "scholar",
      title: "Estudioso",
      description: "Complete 10 simulados",
      icon: BookOpen,
      unlocked: total >= 10,
      progress: pct(total, 10),
      hint: `${total}/10 simulados`,
    },
    {
      id: "specialist",
      title: "Especialista",
      description: "Domine 5 temas diferentes (aprovação no difícil)",
      icon: Award,
      unlocked: hardPassed >= 5,
      progress: pct(hardPassed, 5),
      hint: `${hardPassed}/5 aprovações`,
    },
    {
      id: "explorer",
      title: "Explorador",
      description: "Estude 5 temas distintos",
      icon: Target,
      unlocked: uniqueTopics >= 5,
      progress: pct(uniqueTopics, 5),
      hint: `${uniqueTopics}/5 temas`,
    },
    {
      id: "streak3",
      title: "Em Chamas",
      description: "3 aprovações no difícil em sequência",
      icon: Flame,
      unlocked: streak >= 3,
      progress: pct(streak, 3),
      hint: `Sequência atual: ${streak}`,
    },
    {
      id: "streak5",
      title: "Imparável",
      description: "5 aprovações no difícil em sequência",
      icon: Zap,
      unlocked: streak >= 5,
      progress: pct(streak, 5),
      hint: `Sequência atual: ${streak}`,
    },
    {
      id: "dedicated",
      title: "Dedicado",
      description: "Estude em 7 dias diferentes",
      icon: Medal,
      unlocked: uniqueDays >= 7,
      progress: pct(uniqueDays, 7),
      hint: `${uniqueDays}/7 dias`,
    },
    {
      id: "master",
      title: "Mestre da Segurança",
      description: "Complete 25 simulados",
      icon: Crown,
      unlocked: total >= 25,
      progress: pct(total, 25),
      hint: `${total}/25 simulados`,
    },
  ];
}
