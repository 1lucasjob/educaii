import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Headphones, Play, Pause, Square, RotateCcw, Volume2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { requestTextToSpeechAudio } from "@/lib/textToSpeech";

type Lang = "pt" | "en" | "auto";

const PT_HINTS = /[áàâãéêíóôõúç]|\b(de|que|não|você|para|com|uma|por|isso|mas|este|esta|aqui|então|também|porque|sobre|muito|quando|como)\b/i;

function detectLanguage(text: string): "pt-BR" | "en-US" {
  const sample = text.slice(0, 600);
  return PT_HINTS.test(sample) ? "pt-BR" : "en-US";
}

const VOICE_MAP: Record<string, string> = {
  "pt-BR": "pt-BR-FranciscaNeural",
  "en-US": "en-US-JennyNeural",
};

const VOICE_LABELS: Record<string, string> = {
  "pt-BR-FranciscaNeural": "Voz padrão (PT-BR)",
  "en-US-JennyNeural": "Voz padrão (EN-US)",
};

export default function Ouvir() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<Lang>("auto");
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const detectedLang = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "en") return "en-US";
    return text.trim() ? detectLanguage(text) : "pt-BR";
  }, [text, lang]);

  const selectedVoice = VOICE_MAP[detectedLang];

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply rate live
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  const generateAndPlay = async () => {
    if (!text.trim()) {
      toast.warning("Cole ou digite um texto para ouvir.");
      return;
    }
    if (text.length > 5000) {
      toast.error("Texto muito longo. Limite de 5000 caracteres por vez.");
      return;
    }

    setLoading(true);
    setLastError(null);
    try {
      const blob = await requestTextToSpeechAudio({ text, voice: selectedVoice });

      // Cleanup previous URL
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Wait for ref then play
      requestAnimationFrame(() => {
        const a = audioRef.current;
        if (a) {
          a.src = url;
          a.playbackRate = rate;
          a.play().catch((e) => {
            toast.error("Não foi possível tocar o áudio: " + e.message);
          });
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setLastError(msg);
      toast.error("Erro ao gerar áudio", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPaused) {
      a.play();
    } else if (isPlaying) {
      a.pause();
    } else if (audioUrl) {
      a.play();
    } else {
      generateAndPlay();
    }
  };

  const handleStop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    handleStop();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setText("");
    setRate(1);
    setLastError(null);
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Headphones className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ouvir</h1>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/30">BETA</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Aqui você não precisa ler — apenas ouvir. Coloque seu texto, feche os olhos e preste atenção.
          </p>
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 text-sm space-y-2">
          <p className="font-semibold text-foreground">🔊 Áudio em servidor (BETA)</p>
          <p className="text-muted-foreground">
            O áudio agora é gerado no servidor e tocado como MP3 — qualidade superior à leitura nativa do navegador.
            Em breve trocaremos por vozes neurais ainda melhores. Textos longos podem demorar alguns segundos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seu texto</CardTitle>
          <CardDescription>
            Cole ou digite o conteúdo (até 5000 caracteres). A leitura detecta automaticamente português ou inglês.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui o texto que você quer ouvir..."
            className="min-h-[220px] resize-y"
            maxLength={5000}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{wordCount} palavras</Badge>
            <Badge variant="secondary">{charCount}/5000 caracteres</Badge>
            <Badge variant="outline">
              Idioma: {detectedLang === "pt-BR" ? "Português" : "Inglês"}
              {lang === "auto" && " (auto)"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Volume2 className="w-3 h-3" />
              {VOICE_LABELS[selectedVoice]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voz e ajustes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Voz</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Feminina</SelectItem>
                  <SelectItem value="male">Masculina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático</SelectItem>
                  <SelectItem value="pt">Português (PT-BR)</SelectItem>
                  <SelectItem value="en">Inglês (EN-US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Velocidade</Label>
              <span className="text-xs text-muted-foreground">{rate.toFixed(1)}x</span>
            </div>
            <Slider value={[rate]} min={0.5} max={2} step={0.1} onValueChange={(v) => setRate(v[0])} />
          </div>

          <audio
            ref={audioRef}
            onPlay={() => {
              setIsPlaying(true);
              setIsPaused(false);
            }}
            onPause={() => {
              setIsPlaying(false);
              setIsPaused(audioRef.current ? audioRef.current.currentTime > 0 && !audioRef.current.ended : false);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setIsPaused(false);
            }}
            className="w-full"
            controls
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={generateAndPlay} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando áudio...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {audioUrl ? "Gerar novamente" : "Ouvir"}
                </>
              )}
            </Button>
            {audioUrl && (
              <Button onClick={handlePlayPause} variant="secondary" className="gap-2" disabled={loading}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Tocar"}
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="gap-2" disabled={!audioUrl}>
              <Square className="w-4 h-4" />
              Parar
            </Button>
            <Button onClick={handleReset} variant="ghost" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          {lastError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-2">
              <p className="text-destructive font-medium">Falha ao gerar áudio</p>
              <p className="text-muted-foreground text-xs">{lastError}</p>
              <Button size="sm" variant="outline" onClick={generateAndPlay} className="gap-2" disabled={loading}>
                <RefreshCw className="w-3 h-3" />
                Tentar novamente
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            Dica: textos longos demoram mais para gerar. Para ouvir mais rápido, divida em partes de até 1000 caracteres.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
