import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Headphones, Play, Pause, Square, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";

type Gender = "female" | "male";
type Lang = "pt" | "en" | "auto";

const PT_HINTS = /[áàâãéêíóôõúç]|\b(de|que|não|você|para|com|uma|por|isso|mas|este|esta|aqui|então|também|porque|sobre|muito|quando|como)\b/i;

function detectLanguage(text: string): "pt-BR" | "en-US" {
  const sample = text.slice(0, 600);
  const ptMatches = sample.match(PT_HINTS);
  return ptMatches ? "pt-BR" : "en-US";
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, gender: Gender): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const langPrefix = lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = sameLang.length ? sameLang : voices;

  const femaleHints = /female|fem|woman|mulher|maria|luciana|joana|helena|francisca|samantha|victoria|zira|google.*(feminin|female)/i;
  const maleHints = /male|man|homem|ricardo|daniel|felipe|diego|paulo|google.*(mascul|male)/i;
  const hint = gender === "female" ? femaleHints : maleHints;

  const matched = pool.find((v) => hint.test(v.name));
  if (matched) return matched;

  // Heuristic fallback: most systems list female voice first
  if (gender === "female") return pool[0];
  return pool[pool.length - 1] || pool[0];
}

export default function Ouvir() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [gender, setGender] = useState<Gender>("female");
  const [lang, setLang] = useState<Lang>("auto");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const detectedLang = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "en") return "en-US";
    return text.trim() ? detectLanguage(text) : "pt-BR";
  }, [text, lang]);

  const selectedVoice = useMemo(() => pickVoice(voices, detectedLang, gender), [voices, detectedLang, gender]);

  const handlePlay = () => {
    if (!supported) {
      toast.error("Seu navegador não suporta leitura de voz.");
      return;
    }
    if (!text.trim()) {
      toast.warning("Cole ou digite um texto para ouvir.");
      return;
    }

    if (isPaused && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = detectedLang;
    utter.rate = rate;
    utter.pitch = pitch;
    if (selectedVoice) utter.voice = selectedVoice;

    utter.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utter.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utter.onerror = (e) => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (e.error !== "canceled" && e.error !== "interrupted") {
        toast.error("Erro ao reproduzir o áudio.");
      }
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const handlePause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    handleStop();
    setText("");
    setRate(1);
    setPitch(1);
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Headphones className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ouvir</h1>
          <p className="text-muted-foreground mt-1">
            Aqui você não precisa ler — apenas ouvir. Coloque seu texto, feche os olhos e preste atenção.
          </p>
        </div>
      </div>

      {!supported && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            Seu navegador não suporta a leitura por voz. Tente o Chrome, Edge ou Safari atualizados.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seu texto</CardTitle>
          <CardDescription>
            Cole ou digite o conteúdo. A leitura detecta automaticamente português ou inglês.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui o texto que você quer ouvir..."
            className="min-h-[220px] resize-y"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{wordCount} palavras</Badge>
            <Badge variant="secondary">{charCount} caracteres</Badge>
            <Badge variant="outline">
              Idioma: {detectedLang === "pt-BR" ? "Português" : "Inglês"}
              {lang === "auto" && " (auto)"}
            </Badge>
            {selectedVoice && (
              <Badge variant="outline" className="gap-1">
                <Volume2 className="w-3 h-3" />
                {selectedVoice.name}
              </Badge>
            )}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tom</Label>
              <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
            </div>
            <Slider value={[pitch]} min={0.5} max={2} step={0.1} onValueChange={(v) => setPitch(v[0])} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {!isSpeaking || isPaused ? (
              <Button onClick={handlePlay} className="gap-2">
                <Play className="w-4 h-4" />
                {isPaused ? "Continuar" : "Ouvir"}
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" className="gap-2">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="gap-2" disabled={!isSpeaking && !isPaused}>
              <Square className="w-4 h-4" />
              Parar
            </Button>
            <Button onClick={handleReset} variant="ghost" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Limpar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Dica: as vozes disponíveis dependem do seu navegador e sistema. No Chrome/Edge as vozes do Google
            costumam ser as mais naturais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
