export type ThemeName = "dark-yellow" | "light-blue" | "light-green" | "light-orange";

export const THEMES: { id: ThemeName; label: string; emoji: string; description: string }[] = [
  { id: "dark-yellow", label: "Preto + Amarelo", emoji: "🌑", description: "Tema escuro (padrão)" },
  { id: "light-blue", label: "Branco + Azul", emoji: "☀️", description: "Tema claro azul" },
  { id: "light-green", label: "Branco + Verde", emoji: "🌿", description: "Tema claro verde" },
  { id: "light-orange", label: "Branco + Laranja", emoji: "🍊", description: "Tema claro laranja" },
];

const THEME_CLASSES: Record<ThemeName, string> = {
  "dark-yellow": "",
  "light-blue": "theme-light-blue",
  "light-green": "theme-light-green",
  "light-orange": "theme-light-orange",
};

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  Object.values(THEME_CLASSES).forEach((c) => c && root.classList.remove(c));
  const cls = THEME_CLASSES[theme];
  if (cls) root.classList.add(cls);
  localStorage.setItem("app_theme", theme);
}

export function getStoredTheme(): ThemeName {
  const t = localStorage.getItem("app_theme") as ThemeName | null;
  return t && THEMES.some((x) => x.id === t) ? t : "dark-yellow";
}
