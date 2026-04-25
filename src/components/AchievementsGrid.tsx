import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { Lock, HelpCircle, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  items: Achievement[];
  /** When true, locked secret achievements are revealed (admin view). */
  revealSecrets?: boolean;
  /** When true, the viewer is the owner of these achievements — show criteria for unlocked ones. */
  isOwner?: boolean;
}

export function AchievementsGrid({ items, revealSecrets = false, isOwner = false }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((a) => {
        const Icon = a.icon;
        const isHiddenSecret = !!a.secret && !a.unlocked && !revealSecrets;
        const showSecretBadge = !!a.secret && (a.unlocked || revealSecrets);
        const showCriteria = revealSecrets || (isOwner && a.unlocked);

        return (
          <Card
            key={a.id}
            className={cn(
              "p-4 flex flex-col items-center text-center gap-2 transition-all relative",
              a.unlocked
                ? "border-primary/40 bg-primary/5 shadow-sm hover:shadow-md"
                : "opacity-70 hover:opacity-100",
              a.secret && a.unlocked && !a.ultra && "ring-1 ring-primary/40",
              a.ultra && a.unlocked && "ring-2 ring-purple-500/60 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]",
              isHiddenSecret && "border-dashed",
            )}
          >
            {showSecretBadge && (
              a.ultra ? (
                <Badge
                  variant="outline"
                  className="absolute top-1 right-1 px-1.5 py-0 text-[9px] gap-1 border-purple-500/50 text-purple-500 dark:text-purple-400 bg-purple-500/10"
                  title="Conquista ultra rara"
                >
                  <Sparkles className="w-2.5 h-2.5" /> Ultra rara
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="absolute top-1 right-1 px-1.5 py-0 text-[9px] gap-1 border-primary/40 text-primary"
                  title="Conquista secreta"
                >
                  <Eye className="w-2.5 h-2.5" /> Secreta
                </Badge>
              )
            )}
            {a.secret && !a.unlocked && revealSecrets && (
              <Badge
                variant="outline"
                className="absolute top-1 left-1 px-1.5 py-0 text-[9px] border-warning/40 text-warning"
                title="Visível só para admin"
              >
                Admin
              </Badge>
            )}

            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative",
                a.unlocked ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {isHiddenSecret ? <HelpCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              {!a.unlocked && (
                <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="font-semibold text-sm leading-tight">
              {a.title}
            </p>
            {!isHiddenSecret && showCriteria && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                {a.description}
              </p>
            )}
            <div className="w-full mt-auto space-y-1">
              <Progress value={isHiddenSecret ? 0 : a.progress} className="h-1.5" />
              {!isHiddenSecret && showCriteria && (
                <p className="text-[10px] text-muted-foreground">
                  {a.hint}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
