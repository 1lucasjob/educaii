## Objetivo
Critérios (descrição + dica/progresso) de uma conquista desbloqueada só aparecem para o **dono** dela. Outros usuários veem apenas o título. Admin continua vendo tudo.

## Mudanças

### 1. `src/components/AchievementsGrid.tsx`
- Adicionar prop `isOwner?: boolean` (default `false`).
- Definir `const showCriteria = revealSecrets || (isOwner && a.unlocked);`
- Trocar as duas condições atuais `{!isHiddenSecret && revealSecrets && (...)}` (descrição e hint) por `{!isHiddenSecret && showCriteria && (...)}`.

### 2. `src/pages/Progresso.tsx`
- Passar `isOwner={true}` em todas as renderizações de `<AchievementsGrid />` (sempre é o próprio usuário).

### 3. `src/pages/Configuracoes.tsx`
- Se houver uso de `<AchievementsGrid />`, passar `isOwner={true}`.

### 4. `src/pages/Ranking.tsx`
- No diálogo, passar `isOwner={selectedId === user?.id}` para que apenas o próprio usuário veja os critérios das próprias conquistas.

## Resultado
| Quem vê | Conquista desbloqueada do dono | Conquista desbloqueada de outro | Bloqueada | Secreta bloqueada |
|---|---|---|---|---|
| Dono | Título + critérios | — | Só título | Oculta (`?`) |
| Outro usuário | Só título | Só título | Só título | Oculta (`?`) |
| Admin | Tudo | Tudo | Tudo | Tudo |