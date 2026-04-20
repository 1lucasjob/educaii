interface Props {
  className?: string;
  title?: string;
}

/**
 * Logo EducA.I. — cérebro com chapéu de formatura.
 * Fundo preenchido com a cor de background do tema e contorno na cor primária (amarelo/azul/verde/laranja).
 */
export function EducAILogo({ className, title = "EducA.I." }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      {/* Cérebro */}
      <path
        d="M22 26c-4 0-7 3-7 7 0 3 2 5 4 6-1 3 1 6 5 6 1 2 4 3 7 2 1 2 4 3 7 1 3 1 6-1 6-4 3 0 5-3 4-6 2-1 4-3 4-6 0-4-3-7-7-7 0-4-3-6-7-6-2-2-5-2-7 0-2-1-5-1-7 1-1-1-2 0-2 1z"
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Linhas internas (circuitos/sulcos) */}
      <path
        d="M32 24v22M26 30c2 1 3 3 3 5M38 30c-2 1-3 3-3 5M24 38c2 0 3 1 4 3M40 38c-2 0-3 1-4 3"
        stroke="hsl(var(--primary))"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Chapéu de formatura — base */}
      <path
        d="M14 18l18-8 18 8-18 8-18-8z"
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Borla */}
      <path
        d="M50 18v8"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="28" r="2" fill="hsl(var(--primary))" />
    </svg>
  );
}

export default EducAILogo;
