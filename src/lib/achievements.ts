import { Trophy, Flame, Star, Target, Award, Crown, Zap, BookOpen, Medal, Rocket, Timer, Sparkles, Moon, Sun, Diamond, Ghost, Infinity as InfinityIcon, Swords, Gem, Atom, Wand2 } from "lucide-react";

export interface AttemptLite {
  topic: string;
  difficulty: string;
  score: number;
  created_at: string;
  time_spent_seconds?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress: number; // 0-100
  hint: string;
  secret?: boolean;
  ultra?: boolean;
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

  // Speedster
  const speedsterCount = hardAttempts.filter(
    (a) => a.score >= 80 && (a.time_spent_seconds ?? Infinity) < 300,
  ).length;
  const bestHardTime = hardAttempts
    .filter((a) => a.score >= 80 && a.time_spent_seconds && a.time_spent_seconds > 0)
    .reduce((m, a) => Math.min(m, a.time_spent_seconds!), Infinity);

  // ===== Secret achievements helpers =====
  const perfectHard = hardAttempts.filter((a) => a.score === 100);
  const perfectHardCount = perfectHard.length;

  // Perfect hard streak (consecutive)
  let perfectHardStreak = 0;
  for (const a of sorted) {
    if (a.score === 100) perfectHardStreak++;
    else break;
  }

  // Night owl: hard 80+ between 00:00 and 04:59 local
  const nightOwlCount = hardAttempts.filter((a) => {
    if (a.score < 80) return false;
    const h = new Date(a.created_at).getHours();
    return h >= 0 && h < 5;
  }).length;

  // Early bird: hard 80+ between 05:00 and 06:59 local
  const earlyBirdCount = hardAttempts.filter((a) => {
    if (a.score < 80) return false;
    const h = new Date(a.created_at).getHours();
    return h >= 5 && h < 7;
  }).length;

  // Marathonist: 5+ hard 80+ in the same calendar day
  const hardPerDay = new Map<string, number>();
  hardAttempts.forEach((a) => {
    if (a.score < 80) return;
    const d = new Date(a.created_at).toDateString();
    hardPerDay.set(d, (hardPerDay.get(d) ?? 0) + 1);
  });
  const maxHardOneDay = Array.from(hardPerDay.values()).reduce((m, v) => Math.max(m, v), 0);

  // Lightning: hard 100 in under 3 minutes
  const lightningCount = hardAttempts.filter(
    (a) => a.score === 100 && (a.time_spent_seconds ?? Infinity) < 180,
  ).length;

  // Polymath: aprovação no difícil (80+) em 10 temas distintos
  const hardPassedTopics = new Set(
    hardAttempts.filter((a) => a.score >= 80).map((a) => a.topic.toLowerCase().trim()),
  ).size;

  // Iron will: 30 dias distintos de estudo
  const ironWillDays = uniqueDays;

  // Phoenix: aprovação no difícil (80+) imediatamente após uma reprovação no difícil (<80) — em ordem cronológica
  const chronoHard = [...hardAttempts].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  let phoenix = false;
  for (let i = 1; i < chronoHard.length; i++) {
    if (chronoHard[i - 1].score < 80 && chronoHard[i].score >= 80) {
      phoenix = true;
      break;
    }
  }

  // ===== ULTRA RARE helpers =====
  // Centurião: 100 simulados completados
  const centurion = total >= 100;

  // Onisciente: aprovação no difícil (80+) em 20 temas distintos
  const omniscientTopics = hardPassedTopics; // já calculado acima como Set().size
  // Mago do Tempo: 10 simulados difíceis com 100 pontos em menos de 4 minutos cada
  const timeMageCount = hardAttempts.filter(
    (a) => a.score === 100 && (a.time_spent_seconds ?? Infinity) < 240,
  ).length;

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
      id: "speedster",
      title: "Velocista",
      description: "Termine um simulado difícil em menos de 5 min com 80+",
      icon: Timer,
      unlocked: speedsterCount >= 1,
      progress: speedsterCount >= 1 ? 100 : (bestHardTime !== Infinity ? Math.min(99, Math.round((300 / bestHardTime) * 100)) : 0),
      hint: bestHardTime !== Infinity ? `Melhor tempo: ${Math.floor(bestHardTime / 60)}m ${String(bestHardTime % 60).padStart(2, "0")}s` : "Sem tempos válidos",
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

    // ============ SECRET ACHIEVEMENTS ============
    {
      id: "secret_perfect_master",
      title: "Lenda Imaculada",
      description: "Tire 100 pontos em 5 simulados difíceis",
      icon: Diamond,
      unlocked: perfectHardCount >= 5,
      progress: pct(perfectHardCount, 5),
      hint: `${perfectHardCount}/5 perfeitos no difícil`,
      secret: true,
    },
    {
      id: "secret_perfect_streak",
      title: "Combo Perfeito",
      description: "3 simulados difíceis com 100 pontos em sequência",
      icon: Sparkles,
      unlocked: perfectHardStreak >= 3,
      progress: pct(perfectHardStreak, 3),
      hint: `Sequência perfeita: ${perfectHardStreak}/3`,
      secret: true,
    },
    {
      id: "secret_night_owl",
      title: "Coruja Noturna",
      description: "Passe em 3 simulados difíceis entre 00h e 05h",
      icon: Moon,
      unlocked: nightOwlCount >= 3,
      progress: pct(nightOwlCount, 3),
      hint: `${nightOwlCount}/3 madrugadas vitoriosas`,
      secret: true,
    },
    {
      id: "secret_early_bird",
      title: "Madrugador",
      description: "Passe em 3 simulados difíceis entre 05h e 07h",
      icon: Sun,
      unlocked: earlyBirdCount >= 3,
      progress: pct(earlyBirdCount, 3),
      hint: `${earlyBirdCount}/3 amanheceres vitoriosos`,
      secret: true,
    },
    {
      id: "secret_marathon",
      title: "Maratonista",
      description: "5 aprovações no difícil em um único dia",
      icon: InfinityIcon,
      unlocked: maxHardOneDay >= 5,
      progress: pct(maxHardOneDay, 5),
      hint: `Recorde do dia: ${maxHardOneDay}/5`,
      secret: true,
    },
    {
      id: "secret_lightning",
      title: "Relâmpago",
      description: "Tire 100 em um simulado difícil em menos de 3 minutos",
      icon: Zap,
      unlocked: lightningCount >= 1,
      progress: lightningCount >= 1 ? 100 : 0,
      hint: lightningCount >= 1 ? "Conquistado" : "Velocidade + perfeição",
      secret: true,
    },
    {
      id: "secret_phoenix",
      title: "Fênix",
      description: "Volte por cima: aprove no difícil logo após uma reprovação no difícil",
      icon: Ghost,
      unlocked: phoenix,
      progress: phoenix ? 100 : 0,
      hint: phoenix ? "Renasceu das cinzas" : "Caia e levante-se",
      secret: true,
    },

    // ============ ULTRA RARE (também secretas — só admin vê bloqueadas) ============
    {
      id: "ultra_centurion",
      title: "Centurião",
      description: "Complete 100 simulados",
      icon: Gem,
      unlocked: centurion,
      progress: pct(total, 100),
      hint: `${total}/100 simulados`,
      secret: true,
    },
    {
      id: "ultra_omniscient",
      title: "Onisciente",
      description: "Aprovação no difícil (80+) em 20 temas distintos",
      icon: Atom,
      unlocked: omniscientTopics >= 20,
      progress: pct(omniscientTopics, 20),
      hint: `${omniscientTopics}/20 temas dominados`,
      secret: true,
    },
    {
      id: "ultra_time_mage",
      title: "Mago do Tempo",
      description: "10 simulados difíceis com 100 pontos em menos de 4 minutos cada",
      icon: Wand2,
      unlocked: timeMageCount >= 10,
      progress: pct(timeMageCount, 10),
      hint: `${timeMageCount}/10 perfeições relâmpago`,
      secret: true,
    },
  ];
}
