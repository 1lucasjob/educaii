# Atualizar avatares prontos (nova grade 4×10)

## Objetivo
Substituir os 22 avatares humanos existentes (`preset-1` a `preset-25`, exceto os de plano/alien) usando a nova captura `Captura_de_tela_2026-04-24_192547.png`, garantindo:
- Sem bordas brancas (PNG transparente, sem fundo).
- Cabeça centralizada e com zoom adequado (rosto ocupa ~70% do frame).
- Resolução final 512×512 px.

## Como será feito (script Python/PIL)
1. **Detecção do círculo**: cada card da grade tem o avatar dentro de um círculo branco com fundo colorido. Detectar a área do círculo por amostragem de cor (pixels brancos vs. fundo) e calcular o bounding box real do círculo.
2. **Crop centralizado no rosto**: usar a metade superior do círculo (onde está a cabeça) e dar zoom ~1.4× para o rosto preencher o frame, mantendo a cabeça centralizada horizontalmente.
3. **Máscara circular + alpha**: aplicar máscara circular suave (anti-alias) e salvar como PNG com canal alfa transparente — elimina qualquer borda branca/quadrada em qualquer tema.
4. **Saída 512×512** em todos os arquivos.

## Mapeamento (grade 4 linhas × 10 colunas)
Cada célula referenciada como (linha, coluna). Mapeamento proposto preservando os IDs/labels atuais:

| Arquivo destino | Origem (l,c) | Descrição |
|---|---|---|
| preset-1-homem-negro.png | (1,1) | homem negro |
| preset-2-mulher-negra.png | (1,2) | mulher negra |
| preset-3-homem-japones.png | (1,3) | homem asiático |
| preset-4-mulher-japonesa.png | (1,4) | mulher asiática |
| preset-5-homem-branco-sem-barba.png | (1,5) | homem branco s/ barba |
| preset-6-homem-branco-com-barba.png | (1,6) | homem branco c/ barba |
| preset-7-mulher-branca.png | (1,7) | mulher branca |
| preset-9-homem-loiro.png | (1,8) | homem loiro |
| preset-10-mulher-loira.png | (1,9) | mulher loira |
| preset-13-mulher-branca-cabelo-cacheado.png | (2,4) | mulher cabelo cacheado |
| preset-14-homem-dreads.png | (2,5) | homem com dreads |
| preset-15-mulher-afro.png | (2,6) | mulher afro |
| preset-16-homem-oculos.png | (2,7) | homem de óculos |
| preset-17-homem-indiano.png | (3,1) | homem indiano |
| preset-18-mulher-indiana.png | (3,2) | mulher indiana |
| preset-19-mulher-turbante-vermelho.png | (3,3) | mulher turbante vermelho |
| preset-20-mulher-turbante-laranja.png | (4,5) | mulher turbante laranja |
| preset-21-homem-asiatico-oculos.png | (4,1) | homem asiático de óculos |
| preset-22-mulher-loira-longa.png | (4,2) | mulher loira cabelo longo |
| preset-23-mulher-ruiva.png | (4,3) | mulher ruiva |
| preset-24-homem-negro-barba.png | (4,4) | homem negro c/ barba |
| preset-25-mulher-asiatica.png | (3,4) | mulher asiática alternativa |

> Mapeamento será ajustado automaticamente após inspeção real da imagem (a grade pode variar em ordem) — a regra fixa é: mesma quantidade de avatares, mesmos IDs, mesma temática por slot.

## Arquivos impactados
- **Sobrescritos** (22 PNGs em `src/assets/avatars/`):
  preset-1, 2, 3, 4, 5, 6, 7, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25.
- **Não alterados**: `src/lib/presetAvatars.ts` (IDs e imports continuam iguais), avatares de conquista, admin e plano (alien/premium).

## QA
Após gerar, abrir miniaturas em mosaico de QA e checar visualmente:
- Nenhum borda branca / quadrada visível.
- Rosto centralizado e com zoom suficiente.
- Transparência funcionando (testando sobre fundo escuro).

Se algum avatar ficar mal recortado, ajustar o offset/zoom apenas daquele índice e regerar.
