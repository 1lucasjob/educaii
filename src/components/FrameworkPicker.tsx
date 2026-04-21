import { FRAMEWORKS, type Framework } from "@/lib/studyFrameworks";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface FrameworkPickerProps {
  onPick: (framework: Framework) => void;
  disabled?: boolean;
}

export default function FrameworkPicker({ onPick, disabled }: FrameworkPickerProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Modelos rápidos de resumo</h2>
          <p className="text-sm text-muted-foreground">
            Escolha um modelo para começar com a estrutura pronta — basta preencher os campos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FRAMEWORKS.map((fw) => {
          const Icon = fw.icon;
          const colorVar = `hsl(${fw.color})`;
          const bgVar = `hsl(${fw.color} / 0.08)`;
          return (
            <button
              key={fw.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(fw)}
              className="text-left p-4 rounded-lg border-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                borderColor: colorVar,
                background: bgVar,
                boxShadow: disabled ? undefined : `0 0 0 0 ${colorVar}`,
              }}
              onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.boxShadow = `0 8px 24px -8px ${colorVar}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" style={{ color: colorVar }} />
                <span className="font-bold text-sm" style={{ color: colorVar }}>
                  {fw.short}
                </span>
              </div>
              <p className="font-semibold text-sm">{fw.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{fw.description}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
