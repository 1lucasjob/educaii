import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export function AchievementsGrid({ items }: { items: Achievement[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((a) => {
        const Icon = a.icon;
        return (
          <Card
            key={a.id}
            className={cn(
              "p-4 flex flex-col items-center text-center gap-2 transition-all",
              a.unlocked
                ? "border-primary/40 bg-primary/5 shadow-sm hover:shadow-md"
                : "opacity-70 hover:opacity-100",
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center relative",
                a.unlocked ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="w-6 h-6" />
              {!a.unlocked && (
                <div className="absolute -bottom-1 -right-1 bg-background border rounded-full p-0.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="font-semibold text-sm leading-tight">{a.title}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{a.description}</p>
            <div className="w-full mt-auto space-y-1">
              <Progress value={a.progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">{a.hint}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
