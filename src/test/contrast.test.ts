import { describe, it, expect } from "vitest";

/**
 * Verificação de contraste WCAG para o card "Observações do Professor"
 * em todos os temas disponíveis no login.
 *
 * WCAG 2.1:
 * - AA texto normal: ≥ 4.5:1
 * - AA texto grande (≥18pt ou 14pt bold): ≥ 3:1
 * - AA componentes de UI / borders: ≥ 3:1
 *
 * Os tokens abaixo espelham src/index.css. Mantenha sincronizado quando
 * o design system mudar.
 */

type HSL = { h: number; s: number; l: number };

function parseHsl(str: string): HSL {
  const [h, s, l] = str.replace(/%/g, "").split(/\s+/).map(Number);
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lN - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Mistura fg sobre bg considerando alpha (0..1). */
function blend(fg: HSL, bg: HSL, alpha: number): [number, number, number] {
  const [fr, fg_, fb] = hslToRgb(fg);
  const [br, bg_, bb] = hslToRgb(bg);
  return [
    fr * alpha + br * (1 - alpha),
    fg_ * alpha + bg_ * (1 - alpha),
    fb * alpha + bb * (1 - alpha),
  ];
}

function contrast(fgRgb: [number, number, number], bgRgb: [number, number, number]): number {
  const L1 = relLuminance(fgRgb);
  const L2 = relLuminance(bgRgb);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// Tokens espelhados de src/index.css
const THEMES = {
  "dark-yellow": {
    background: "0 0% 4%",
    foreground: "48 100% 96%",
    accent: "48 96% 53%",
  },
  "light-blue": {
    background: "0 0% 100%",
    foreground: "222 47% 11%",
    accent: "217 91% 55%",
  },
  "light-green": {
    background: "0 0% 100%",
    foreground: "152 30% 12%",
    accent: "142 71% 38%",
  },
  "light-orange": {
    background: "0 0% 100%",
    foreground: "24 40% 12%",
    accent: "24 95% 53%",
  },
} as const;

describe("WCAG contrast — Observações do Professor card", () => {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    const bg = parseHsl(tokens.background);
    const fg = parseHsl(tokens.foreground);
    const accent = parseHsl(tokens.accent);

    // bg-accent/15 sobre o background da página
    const cardBg = blend(accent, bg, 0.15);
    const fgRgb = hslToRgb(fg);
    const accentRgb = hslToRgb(accent);

    describe(`theme: ${theme}`, () => {
      it("texto (foreground) sobre card (accent/15) ≥ 4.5:1 (AA normal)", () => {
        const ratio = contrast(fgRgb, cardBg);
        expect(ratio, `contrast=${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      });

      it("ícone/borda (accent) sobre card (accent/15) ≥ 3:1 (AA UI)", () => {
        const ratio = contrast(accentRgb, cardBg);
        expect(ratio, `contrast=${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
      });

      it("borda (accent) sobre background da página ≥ 3:1 (AA UI)", () => {
        const ratio = contrast(accentRgb, hslToRgb(bg));
        expect(ratio, `contrast=${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
