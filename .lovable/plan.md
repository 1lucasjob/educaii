## Migrar aba Ouvir para Edge-TTS (vozes neurais Microsoft)

### Backend
**Criar** `supabase/functions/text-to-speech/index.ts`:
- POST público (sem JWT). CORS completo (incluir em respostas de erro).
- Body validado com Zod: `text` (1–5000 chars), `voice` enum: `pt-BR-FranciscaNeural`, `pt-BR-AntonioNeural`, `en-US-JennyNeural`, `en-US-GuyNeural`.
- Conecta via `WebSocket` nativo do Deno em `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`.
- Envia mensagem `speech.config` pedindo formato `audio-24khz-48kbitrate-mono-mp3`.
- Envia SSML com voz e texto escolhidos.
- Recebe frames binários (cada um com header `Path:audio\r\n` + payload MP3), concatena.
- Fecha ao receber `Path:turn.end`. Timeout de 30s.
- Devolve `audio/mpeg` como `ArrayBuffer`.

### Frontend
**Editar** `src/pages/Ouvir.tsx`:
- Remover `speechSynthesis`, `voices`, `pickVoice`, slider de **Tom**.
- Manter: textarea, contadores, detecção PT/EN automática, seletor de voz (Feminina/Masculina), seletor de idioma (Auto/PT/EN), slider de velocidade (0.5x–2x via `playbackRate`).
- Mapear gênero+idioma → nome da voz Edge-TTS.
- Botão **Ouvir**: chama `supabase.functions.invoke("text-to-speech", { body: { text, voice } })`, recebe Blob MP3, cria `URL.createObjectURL`, atribui ao `<audio ref>` e `play()`.
- Estados: `loading` (spinner no botão), `playing`, `paused`. Pausar/Continuar/Parar agem no `<audio>`.
- Slider de velocidade ajusta `audio.playbackRate` em tempo real.
- Erro: toast com mensagem clara + botão **Tentar novamente**.
- Atualizar card de aviso: "vozes neurais da Microsoft (Edge-TTS) — qualidade muito superior, ainda em BETA". Manter badge BETA.
- Liberar `URL.revokeObjectURL` ao trocar áudio/desmontar.

### Arquivos
**Criados:** `supabase/functions/text-to-speech/index.ts`
**Editados:** `src/pages/Ouvir.tsx`
**Banco/secrets/config:** nenhuma alteração.
