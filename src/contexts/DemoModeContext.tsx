import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { AttemptLite } from "@/lib/achievements";

export interface DemoLeaderboardRow {
  user_id: string;
  display_name: string;
  total_score: number;
  hard_passed: number;
  attempts: number;
  avg_score: number;
  composite_score: number;
  attempts_data: AttemptLite[];
}

export interface DemoAttempt {
  id: string;
  topic: string;
  difficulty: "easy" | "hard";
  score: number;
  created_at: string;
  time_spent_seconds: number;
  counts_for_ranking: boolean;
}

interface DemoCtx {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  fakeLeaderboard: DemoLeaderboardRow[];
  fakeAttempts: DemoAttempt[];
}

const DemoContext = createContext<DemoCtx | undefined>(undefined);

const DEMO_TOPICS = [
  "NR-10 Segurança em Eletricidade",
  "NR-35 Trabalho em Altura",
  "NR-06 EPIs",
  "NR-12 Máquinas e Equipamentos",
  "NR-33 Espaços Confinados",
  "NR-23 Proteção Contra Incêndios",
];
const DEMO_NAMES = [
  "ana.silva", "joao.pereira", "carla.souza", "rafael.lima", "patricia.alves",
  "marcos.rocha", "juliana.dias", "felipe.castro", "beatriz.nunes", "thiago.melo",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildFakeLeaderboard(seed = 1): DemoLeaderboardRow[] {
  // deterministic-ish based on seed
  let s = seed;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const ri = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;

  const now = Date.now();
  return DEMO_NAMES.map((name, idx) => {
    const attemptsCount = ri(4, 14);
    const attempts_data: AttemptLite[] = Array.from({ length: attemptsCount }).map(() => {
      const difficulty = r() > 0.45 ? "hard" : "easy";
      const score = difficulty === "hard" ? ri(55, 100) : ri(60, 100);
      const daysAgo = ri(0, 25);
      return {
        topic: DEMO_TOPICS[ri(0, DEMO_TOPICS.length - 1)],
        difficulty,
        score,
        created_at: new Date(now - daysAgo * 86400000 - ri(0, 86400) * 1000).toISOString(),
        time_spent_seconds: ri(140, 600),
      };
    });
    const total_score = attempts_data.reduce((a, b) => a + b.score, 0);
    const hard_passed = attempts_data.filter((a) => a.difficulty === "hard" && a.score >= 80).length;
    const avg = total_score / attemptsCount;
    return {
      user_id: `demo-${idx}-${name}`,
      display_name: name,
      total_score,
      hard_passed,
      attempts: attemptsCount,
      avg_score: +avg.toFixed(1),
      composite_score: +(hard_passed * 10 + avg).toFixed(1),
      attempts_data,
    };
  });
}

function buildFakeAttempts(seed = 7): DemoAttempt[] {
  let s = seed;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const ri = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
  const now = Date.now();
  return Array.from({ length: 12 }).map((_, i) => {
    const difficulty = r() > 0.4 ? "hard" : "easy";
    const score = difficulty === "hard" ? ri(60, 100) : ri(65, 100);
    const time = ri(80, 500);
    return {
      id: `demo-att-${i}`,
      topic: DEMO_TOPICS[ri(0, DEMO_TOPICS.length - 1)],
      difficulty,
      score,
      created_at: new Date(now - i * 86400000 - ri(0, 50000) * 1000).toISOString(),
      time_spent_seconds: time,
      counts_for_ranking: time >= 120 && r() > 0.2,
    };
  });
}

const STORAGE_KEY = "admin_demo_mode";

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [fakeLeaderboard] = useState(() => buildFakeLeaderboard());
  const [fakeAttempts] = useState(() => buildFakeAttempts());

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    try {
      sessionStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  // Auto-disable if user closes tab — sessionStorage handles it
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <DemoContext.Provider value={{ enabled, setEnabled, fakeLeaderboard, fakeAttempts }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoMode must be inside DemoModeProvider");
  return ctx;
}
