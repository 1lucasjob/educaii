import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, GraduationCap, Lightbulb, Sparkles, Eraser, Lock, PlayCircle } from "lucide-react";
import { FRAMEWORKS, type Framework } from "@/lib/studyFrameworks";
import FrameworkPicker from "@/components/FrameworkPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { modelQuizAdvancedActive, modelQuizEasyActive } from "@/lib/freeTrial";

export default function Modelos() {
  const [selected, setSelected] = useState<Framework | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="text-primary shrink-0" /> Modelos de Estudo
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Aprenda e treine ferramentas clássicas de organização de ideias e planos de ação.
        </p>
      </div>

      {!selected && (
        <>
          <Card className="p-5 bg-primary/5 border-primary/30">
            <p className="text-sm text-foreground">
              Cada modelo abaixo tem um <strong>resumo explicativo</strong>, um <strong>exemplo prático</strong> e um <strong>modo de treino</strong> com feedback da IA. Ao final, você pode gerar um <strong>simulado específico</strong> do modelo escolhido.
            </p>
          </Card>
          <FrameworkPicker onPick={(fw) => setSelected(fw)} />
        </>
      )}

      {selected && <FrameworkDetail framework={selected} onBack={() => setSelected(null)} />}
    </div>
  );
}

function FrameworkDetail({ framework, onBack }: { framework: Framework; onBack: () => void }) {
  const Icon = framework.icon;
  const colorVar = `hsl(${framework.color})`;
  const bgVar = `hsl(${framework.color} / 0.1)`;

  return (
    <div className="space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Voltar aos modelos
      </Button>

      <Card className="p-6 border-2" style={{ borderColor: colorVar, background: bgVar }}>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `hsl(${framework.color} / 0.2)` }}
          >
            <Icon className="w-7 h-7" style={{ color: colorVar }} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: colorVar }}>
              {framework.label}
            </h2>
            <p className="text-sm text-muted-foreground">{framework.description}</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about" className="gap-1.5">
            <Lightbulb className="w-4 h-4" /> O que é
          </TabsTrigger>
          <TabsTrigger value="train" className="gap-1.5">
            <GraduationCap className="w-4 h-4" /> Treinar
          </TabsTrigger>
          <TabsTrigger value="use" className="gap-1.5">
            <Sparkles className="w-4 h-4" /> Gerar Simulado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Sobre o modelo</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {framework.explanation}
            </p>
          </Card>
          <Card className="p-6 border-2" style={{ borderColor: `hsl(${framework.color} / 0.3)` }}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" style={{ color: colorVar }} /> Exemplo prático
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
              {framework.example}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="train" className="mt-4">
          <FrameworkTrainer framework={framework} />
        </TabsContent>

        <TabsContent value="use" className="mt-4">
          <GenerateFrameworkQuiz framework={framework} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FrameworkTrainer({ framework }: { framework: Framework }) {
  const { toast } = useToast();
  const colorVar = `hsl(${framework.color})`;
  const [topic, setTopic] = useState("");
  const initialFields = framework.fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = "";
    return acc;
  }, {});
  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const clearAll = () => {
    setTopic("");
    setFields(initialFields);
    setFeedback(null);
  };

  const submit = async () => {
    const filledCount = Object.values(fields).filter((v) => v.trim().length > 0).length;
    if (topic.trim().length < 5) {
      toast({ title: "Tema muito curto", description: "Informe um tema com pelo menos 5 caracteres.", variant: "destructive" });
      return;
    }
    if (filledCount === 0) {
      toast({ title: "Preencha ao menos um campo", description: "Escreva algo nos campos do modelo antes de pedir feedback.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setFeedback(null);
    const { data, error } = await supabase.functions.invoke("framework-feedback", {
      body: { frameworkId: framework.id, topic: topic.trim(), fields },
    });
    setLoading(false);
    if (error || data?.error) {
      toast({
        title: "Erro ao gerar feedback",
        description: data?.error ?? error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
      return;
    }
    setFeedback(String(data?.feedback ?? ""));
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="train-topic">Tema do exercício</Label>
          <Input
            id="train-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="Ex.: Reduzir acidentes na obra X / Implantar PPRA na unidade Y"
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          {framework.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`fw-${f.key}`} style={{ color: colorVar }} className="font-semibold">
                {f.label}
              </Label>
              <Textarea
                id={`fw-${f.key}`}
                value={fields[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                disabled={loading}
                className="min-h-20"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={submit}
            disabled={loading}
            className="gradient-primary text-primary-foreground shadow-glow flex-1 min-w-[200px]"
          >
            {loading ? "Analisando…" : (<><Sparkles className="mr-2" /> Receber feedback da IA</>)}
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={loading}>
            <Eraser className="mr-2 w-4 h-4" /> Limpar
          </Button>
        </div>
      </Card>

      {feedback && (
        <Card className="p-6 animate-fade-in border-2" style={{ borderColor: `hsl(${framework.color} / 0.4)` }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: colorVar }} /> Feedback da IA
          </h3>
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {feedback}
          </div>
        </Card>
      )}
    </div>
  );
}

function GenerateFrameworkQuiz({ framework }: { framework: Framework }) {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const colorVar = `hsl(${framework.color})`;
  const [difficulty, setDifficulty] = useState<"easy" | "hard" | "expert">("easy");
  const easyAllowed = modelQuizEasyActive({
    plan: profile?.plan,
    createdAt: profile?.created_at,
    modelQuizUnlockedUntil: profile?.model_quiz_unlocked_until,
    isAdmin,
  });
  const advancedAllowed = modelQuizAdvancedActive({
    plan: profile?.plan,
    modelQuizUnlockedUntil: profile?.model_quiz_unlocked_until,
    isAdmin,
  });
  const allowed = difficulty === "easy" ? easyAllowed : advancedAllowed;
  const topic = `Simulado sobre o modelo ${framework.label} aplicado à Segurança do Trabalho`;
  const goToQuiz = () => {
    navigate(`/app/simulado?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&framework=${framework.id}`);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `hsl(${framework.color} / 0.15)` }}
        >
          <Sparkles className="w-5 h-5" style={{ color: colorVar }} />
        </div>
        <div>
          <h3 className="font-semibold">Gerar Simulado do Modelo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha o nível e gere um simulado com no mínimo 10 questões baseado no modelo {framework.label}.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([
          ["easy", "Fácil"],
          ["hard", "Difícil"],
          ["expert", "Expert"],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={difficulty === value ? "default" : "outline"}
            onClick={() => setDifficulty(value)}
            className={difficulty === value ? "gradient-primary text-primary-foreground shadow-glow" : ""}
          >
            {label}
          </Button>
        ))}
      </div>
      {!allowed && (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm flex items-start gap-2">
          <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p>
              {difficulty === "easy"
                ? "O simulado fácil dos modelos exige FREE ativo nos 30 dias, plano 60 DAYS ou superior, ou liberação do admin."
                : "Simulados difícil e expert dos modelos exigem plano 90 DAYS ou superior, ou liberação do admin por 30 dias."}
            </p>
            <Link to="/app/planos" className="text-primary underline underline-offset-2 text-xs font-medium">
              Ver planos disponíveis
            </Link>
          </div>
        </div>
      )}
      <Button
        onClick={goToQuiz}
        disabled={!allowed}
        className="w-full gradient-primary text-primary-foreground shadow-glow"
      >
        <PlayCircle className="mr-2" /> Gerar Simulado {framework.label}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Os simulados normais continuam disponíveis no <Link to="/app/estudar" className="text-primary underline underline-offset-2">Módulo de Estudos</Link>.
      </p>
    </Card>
  );
}
