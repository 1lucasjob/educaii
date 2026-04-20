

## Plano: Reordenar seções do resumo - Normas no final

### Alteração no SYSTEM_PROMPT

Atualizar `supabase/functions/generate-summary/index.ts` para mover a seção **"Normas Regulamentadoras aplicáveis ao caso"** para o final do resumo, junto com as **"Observações do Professor"**.

**Nova estrutura obrigatória:**

1. **Visão geral do tema apresentado**
2. **Conceitos-chave presentes no texto**
3. **Aplicação prática no contexto descrito**
4. **Riscos e medidas de controle pertinentes**
5. **Pontos críticos para prova/concurso**
6. **Normas Regulamentadoras aplicáveis ao caso** — movida para o final antes das observações
7. **🎓 Observações do Professor** — permanece no final

**Arquivo a editar:**
- `supabase/functions/generate-summary/index.ts` — atualizar as linhas 15-26 do SYSTEM_PROMPT para refletir a nova ordem das seções.

