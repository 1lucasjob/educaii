

## Objetivo

Duas funcionalidades novas:

1. **Recorte de imagem de perfil** — antes de enviar o avatar, abrir um editor para o aluno cortar/posicionar a imagem em formato quadrado.
2. **Modelos de Resumos (Frameworks)** — uma nova área na página **Estudar** com cards coloridos de assuntos pré-prontos (começando por **5W2H** e **SWOT**), cada um com sua cor temática. Ao clicar, preenche o formulário com um template do framework já estruturado, pronto para o aluno preencher e gerar o resumo.

---

## Parte 1 — Recorte de avatar

### Dependência
- Adicionar **`react-easy-crop`** (~30 KB, MIT, mantém pinch/zoom/drag e funciona em mobile).

### Novo componente `src/components/AvatarCropDialog.tsx`
- Recebe `file: File`, `open`, `onOpenChange`, `onCropped(blob: Blob)`.
- Usa `Dialog` (já existente) + `Cropper` do `react-easy-crop` em proporção **1:1**.
- Controles: **slider de zoom**, arrastar imagem, botões **Cancelar** / **Cortar e enviar**.
- Ao confirmar, gera um `Blob` PNG/JPEG quadrado de até **512×512** via `canvas.toBlob` (qualidade 0.9), preservando o `contentType` original quando possível.

### Edição em `src/pages/Configuracoes.tsx`
- `handleAvatarSelected`: em vez de enviar direto, **guarda o `File` em estado** e abre o `AvatarCropDialog`.
- Novo handler `handleCroppedBlob(blob)` faz o upload para o bucket `avatars` (mesma lógica atual) e segue o fluxo: admin → `avatar_url` direto; aluno → `avatar_pending_url` + `avatar_status: pending`.
- Mantém validação prévia de tipo (PNG/JPEG/WebP) e tamanho (≤ 2 MB) antes de abrir o crop.

### Banco / Storage
- **Sem mudanças** — o bucket `avatars` já existe e é público; o fluxo de aprovação já está implementado.

---

## Parte 2 — Modelos de Resumo (Frameworks)

### Novo arquivo `src/lib/studyFrameworks.ts`
Define os modelos disponíveis com cor e template (texto inicial que vai para o `topic`):

```ts
export type Framework = {
  id: "5w2h" | "swot";
  label: string;
  short: string;          // "5W2H", "SWOT"
  description: string;    // "Plano de ação detalhado…"
  color: string;          // hsl token (ex.: "210 90% 55%")
  icon: LucideIcon;
  titleSuggestion: string;
  template: string;       // texto pré-formatado p/ o textarea
};

export const FRAMEWORKS: Framework[];
```

Inicialmente:
- **5W2H** — cor azul (`210 90% 55%`), ícone `ListChecks`. Template com seções: What, Why, Where, When, Who, How, How much.
- **SWOT** — cor roxa (`280 75% 60%`), ícone `LayoutGrid`. Template com Forças, Fraquezas, Oportunidades, Ameaças.

Cada template é um texto plano (sem markdown) com placeholders, seguindo o padrão limpo do `stripMarkdown`. Estrutura para já entrar com bons separadores e instruções curtas para o aluno preencher.

### Novo componente `src/components/FrameworkPicker.tsx`
- Grid responsivo (`grid-cols-2 sm:grid-cols-2 md:grid-cols-4`) de cards.
- Cada card usa `style={{ borderColor: hsl(...), background: hsl(... / 0.08) }}` para a cor própria do framework, ícone colorido, título e descrição curta.
- Hover: `shadow-glow` na cor do framework.
- Prop `onPick(framework)`.

### Integração em `src/pages/Estudar.tsx`
- Acima do card de criação de tema, nova `Card` "Modelos rápidos de resumo".
- Texto de apoio: "Escolha um modelo para começar com a estrutura pronta — basta preencher os campos."
- Ao clicar num framework:
  - Preenche `setTitle(framework.titleSuggestion)` (se `title` estiver vazio) e `setTopic(framework.template)`.
  - Faz scroll suave até o textarea e foca nele.
  - Toast: "Modelo {label} carregado — preencha e clique em Gerar Estudo."
- Não muda nada do fluxo de geração; o template apenas alimenta o `topic` e segue o caminho normal de `generate-summary`.

### Estética
- Reaproveita `Card`, `Badge` e tokens existentes (`shadow-glow`, `gradient-primary`).
- Cores definidas inline via HSL para permitir adicionar novos frameworks (PDCA, 5 Porquês, Ishikawa, etc.) facilmente no futuro.

---

## Arquivos afetados

### Novos
- `src/components/AvatarCropDialog.tsx` — modal de recorte 1:1 com zoom.
- `src/components/FrameworkPicker.tsx` — grid de cards coloridos.
- `src/lib/studyFrameworks.ts` — definições + templates de 5W2H e SWOT.

### Editados
- `package.json` — adiciona `react-easy-crop`.
- `src/pages/Configuracoes.tsx` — abre o crop antes do upload do avatar.
- `src/pages/Estudar.tsx` — renderiza `FrameworkPicker` e preenche o formulário ao escolher.

### Banco
- Sem migrações.

