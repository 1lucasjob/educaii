## Objetivo
Adicionar uma galeria de **8 avatares prontos** na página de Configurações, permitindo que o aluno escolha uma imagem oficial com um clique — sem passar pela fila de aprovação do admin.

## Avatares (8 opções)
1. Homem negro
2. Mulher negra
3. Homem japonês
4. Mulher japonesa
5. Homem branco sem barba
6. Homem branco com barba
7. Mulher branca
8. Alienígena (amigável, estilo cartoon)

## Geração das imagens
Vou gerar as 8 imagens via IA (estilo ilustração/cartoon consistente, fundo neutro, formato quadrado 512×512 PNG) e salvá-las em `src/assets/avatars/`. Como são assets do bundle, ficam servidas pelo Vite automaticamente — não precisa de upload no Storage.

## Arquivos
**Criar:**
- `src/assets/avatars/preset-1-homem-negro.png` … `preset-8-alienigena.png` (8 imagens geradas)
- `src/lib/presetAvatars.ts` — exporta array com `{ id, label, src }` importando as imagens

**Editar:**
- `src/pages/Configuracoes.tsx` — adicionar nova seção "Ou escolha um avatar pronto" no card "Meu Perfil", logo abaixo do botão "Trocar imagem":
  - Grid responsivo `grid-cols-4 sm:grid-cols-8 gap-2`
  - Cada item: botão circular com a imagem; ring primário no avatar atualmente selecionado
  - Ao clicar: chama `selectPreset(src)` que faz `UPDATE profiles SET avatar_url = src, avatar_pending_url = null, avatar_status = 'approved'` e dá `refreshProfile()` + toast

## Lógica de seleção (presets pulam aprovação)
```tsx
const selectPreset = async (url: string) => {
  if (!profile) return;
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: url,
      avatar_pending_url: null,
      avatar_status: "approved",
      avatar_reviewed_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  if (error) {
    toast({ title: "Erro", description: error.message, variant: "destructive" });
    return;
  }
  await refreshProfile();
  toast({ title: "Avatar atualizado!" });
};
```

Justificativa: presets são imagens oficiais da plataforma — não há risco de conteúdo impróprio, então não faz sentido obrigar revisão manual.

## Sem mudanças no banco
Reaproveita a coluna `avatar_url` que já existe. Nenhuma migração necessária.