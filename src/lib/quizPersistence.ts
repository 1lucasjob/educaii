// Helpers para persistir progresso de simulado em localStorage e no banco,
// permitindo "Retomar Simulado" mesmo após refresh, troca de dispositivo
// ou limpeza do localStorage.

import { supabase } from "@/integrations/supabase/client";

export interface SavedQuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

export interface SavedQuiz {
  topic: string;
  difficulty: "easy" | "hard" | "expert";
  questions: SavedQuizQuestion[];
  answers: number[];
  current: number;
  timeLeft: number;
  timeSpent: number;
  savedAt: number;
  timeLimit: number;
}

const keyFor = (userId: string) => `quiz_in_progress:${userId}`;

// ---------- LocalStorage (rápido, sem latência) ----------

export function saveQuiz(userId: string | undefined, payload: SavedQuiz) {
  if (!userId) return;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch {
    // storage indisponível — silencioso
  }
  // Dispara save remoto debounced em background
  scheduleRemoteSave(userId, payload);
}

export function loadQuiz(userId: string | undefined): SavedQuiz | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedQuiz;
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuiz(userId: string | undefined) {
  if (!userId) return;
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {}
  // Limpa também no banco
  void clearQuizRemote(userId);
}

/**
 * Retorna o quiz salvo localmente já com timeLeft ajustado pelo tempo decorrido desde savedAt.
 * Se o tempo já zerou, descarta automaticamente e retorna null.
 */
export function getResumableQuiz(userId: string | undefined): SavedQuiz | null {
  const saved = loadQuiz(userId);
  if (!saved) return null;
  return adjustResumable(saved, () => clearQuiz(userId));
}

function adjustResumable(saved: SavedQuiz, discard: () => void): SavedQuiz | null {
  const elapsedSec = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
  const adjustedTimeLeft = saved.timeLeft - elapsedSec;
  if (adjustedTimeLeft <= 0) {
    discard();
    return null;
  }
  if (saved.answers.length > 0 && saved.answers.every((a) => a >= 0)) {
    discard();
    return null;
  }
  return {
    ...saved,
    timeLeft: adjustedTimeLeft,
    timeSpent: saved.timeSpent + elapsedSec,
  };
}

// ---------- Remote (Supabase) ----------

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: { userId: string; payload: SavedQuiz } | null = null;
const DEBOUNCE_MS = 3000;

function scheduleRemoteSave(userId: string, payload: SavedQuiz) {
  pendingPayload = { userId, payload };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (pendingPayload) {
      const { userId: uid, payload: p } = pendingPayload;
      pendingPayload = null;
      void saveQuizRemote(uid, p);
    }
  }, DEBOUNCE_MS);
}

export async function saveQuizRemote(userId: string, payload: SavedQuiz): Promise<void> {
  try {
    await supabase.from("quiz_in_progress").upsert(
      {
        user_id: userId,
        topic: payload.topic,
        difficulty: payload.difficulty,
        questions: payload.questions as any,
        answers: payload.answers as any,
        current_index: payload.current,
        time_left: payload.timeLeft,
        time_spent: payload.timeSpent,
        time_limit: payload.timeLimit,
        saved_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch {
    // silencioso — local storage continua funcionando
  }
}

export async function loadQuizRemote(userId: string): Promise<SavedQuiz | null> {
  try {
    const { data, error } = await supabase
      .from("quiz_in_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const questions = (data.questions as unknown as SavedQuizQuestion[]) ?? [];
    if (!Array.isArray(questions) || questions.length === 0) return null;
    return {
      topic: data.topic,
      difficulty: data.difficulty as SavedQuiz["difficulty"],
      questions,
      answers: ((data.answers as unknown as number[]) ?? []),
      current: data.current_index ?? 0,
      timeLeft: data.time_left ?? 0,
      timeSpent: data.time_spent ?? 0,
      timeLimit: data.time_limit ?? 0,
      savedAt: new Date(data.saved_at).getTime(),
    };
  } catch {
    return null;
  }
}

export async function clearQuizRemote(userId: string): Promise<void> {
  try {
    await supabase.from("quiz_in_progress").delete().eq("user_id", userId);
  } catch {}
}

export async function getResumableQuizRemote(userId: string | undefined): Promise<SavedQuiz | null> {
  if (!userId) return null;
  const saved = await loadQuizRemote(userId);
  if (!saved) return null;
  return adjustResumable(saved, () => {
    void clearQuizRemote(userId);
  });
}

/**
 * Retorna o resumable mais recente entre local e remoto.
 * Útil no mount da página de estudo para hidratar o botão "Retomar Simulado".
 */
export async function getResumableQuizMerged(userId: string | undefined): Promise<SavedQuiz | null> {
  if (!userId) return null;
  const local = getResumableQuiz(userId);
  const remote = await getResumableQuizRemote(userId);
  if (local && remote) {
    return local.savedAt >= remote.savedAt ? local : remote;
  }
  return local ?? remote;
}
