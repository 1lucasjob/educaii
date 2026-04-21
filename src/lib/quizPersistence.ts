// Helpers para persistir progresso de simulado em localStorage,
// permitindo "Retomar Simulado" caso o usuário saia da página.

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

export function saveQuiz(userId: string | undefined, payload: SavedQuiz) {
  if (!userId) return;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch {
    // storage indisponível — silencioso
  }
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
}

/**
 * Retorna o quiz salvo já com timeLeft ajustado pelo tempo decorrido desde savedAt.
 * Se o tempo já zerou, descarta automaticamente e retorna null.
 */
export function getResumableQuiz(userId: string | undefined): SavedQuiz | null {
  const saved = loadQuiz(userId);
  if (!saved) return null;
  const elapsedSec = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
  const adjustedTimeLeft = saved.timeLeft - elapsedSec;
  if (adjustedTimeLeft <= 0) {
    clearQuiz(userId);
    return null;
  }
  if (saved.answers.every((a) => a >= 0)) {
    // Já respondeu tudo — não faz sentido retomar; descarta.
    clearQuiz(userId);
    return null;
  }
  return {
    ...saved,
    timeLeft: adjustedTimeLeft,
    timeSpent: saved.timeSpent + elapsedSec,
  };
}
