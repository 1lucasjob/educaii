interface Props {
  className?: string;
  title?: string;
  glow?: boolean;
}

/**
 * Logo EducA.I. — cérebro com chapéu de formatura, estilo neon.
 * Preenchimento usa --background do tema; traços usam --primary (amarelo/azul/verde/laranja).
 */
export function EducAILogo({ className, title = "EducA.I.", glow = true }: Props) {
  const stroke = "hsl(var(--primary))";
  const bg = "hsl(var(--background))";
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      <defs>
        {glow && (
          <filter id="educai-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g
        filter={glow ? "url(#educai-glow)" : undefined}
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Chapéu de formatura — losango (mortarboard) */}
        <path
          d="M100 38 L168 62 L100 86 L32 62 Z"
          fill={bg}
        />
        {/* Linha interna do losango (espessura) */}
        <path d="M100 50 L154 70 L100 90 L46 70 Z" fill={bg} />

        {/* Base do chapéu (faixa) */}
        <path
          d="M70 80 Q70 96 100 100 Q130 96 130 80"
          fill={bg}
        />
        <path d="M70 80 L70 86 Q70 102 100 106 Q130 102 130 86 L130 80" fill={bg} />

        {/* Borla — fio + pompom */}
        <path d="M168 62 L168 95" />
        <path d="M168 95 q-3 4 0 8 q3 -4 0 -8" fill={stroke} />
        <path d="M165 102 l3 6 l3 -6" />

        {/* Cérebro — silhueta principal */}
        <path
          d="M100 96
             C 78 96 60 108 56 124
             C 44 126 38 138 42 150
             C 36 158 40 170 50 174
             C 52 184 64 188 74 184
             C 80 192 96 192 100 184
             C 104 192 120 192 126 184
             C 136 188 148 184 150 174
             C 160 170 164 158 158 150
             C 162 138 156 126 144 124
             C 140 108 122 96 100 96 Z"
          fill={bg}
        />

        {/* Sulco central */}
        <path d="M100 100 L100 184" />

        {/* Sulcos/giros — lado esquerdo */}
        <path d="M88 110 q-10 6 -8 18 q2 8 -4 12" />
        <path d="M76 130 q-12 2 -12 14 q0 8 6 12" />
        <path d="M70 156 q-8 4 -6 14" />
        <path d="M92 130 q-8 6 -6 16 q2 8 -2 14" />
        <path d="M84 152 q-6 6 -2 16" />
        <path d="M96 142 q-6 8 -2 18 q4 8 0 16" />

        {/* Sulcos/giros — lado direito */}
        <path d="M112 110 q10 6 8 18 q-2 8 4 12" />
        <path d="M124 130 q12 2 12 14 q0 8 -6 12" />
        <path d="M130 156 q8 4 6 14" />
        <path d="M108 130 q8 6 6 16 q-2 8 2 14" />
        <path d="M116 152 q6 6 2 16" />
        <path d="M104 142 q6 8 2 18 q-4 8 0 16" />

        {/* Cerebelo (canto inferior direito) */}
        <path d="M132 168 q10 2 14 10 q-6 4 -10 10" />
        <path d="M138 174 q4 0 6 4" />

        {/* Tronco encefálico */}
        <path d="M100 184 q0 8 4 14" />
      </g>
    </svg>
  );
}

export default EducAILogo;
