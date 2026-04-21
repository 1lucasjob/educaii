import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Headset } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreuzaChat from "./CreuzaChat";

export default function CreuzaFab() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Esconde na página dedicada para evitar duplicidade
  if (location.pathname.startsWith("/app/suporte")) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button
              aria-label="Falar com a Creuza"
              className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full gradient-primary shadow-glow flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
            >
              <Headset className="w-6 h-6" strokeWidth={2.2} />
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Falar com a Creuza</TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-4">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Headset className="w-5 h-5 text-primary" /> Creuza · Suporte
          </SheetTitle>
          <SheetDescription>Tire dúvidas sobre planos, navegação e problemas da plataforma.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 mt-3 min-h-0">
          <CreuzaChat heightClass="h-[calc(100vh-260px)]" className="h-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
