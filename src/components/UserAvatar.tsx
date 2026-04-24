import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { findPresetBySrc, findPresetById } from "@/lib/presetAvatars";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  /** id de preset usado APENAS para a borda exclusiva (independente da imagem) */
  borderId?: string | null;
  size?: Size;
  className?: string;
  /** Aplica leve zoom ao passar o mouse, para visualizar melhor o rosto. */
  hoverZoom?: boolean;
}

const SIZE_MAP: Record<Size, string> = {
  xs: "w-7 h-7 text-[11px]",
  sm: "w-9 h-9 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-2xl",
};

const CROWN_SIZE: Record<Size, string> = {
  xs: "w-3 h-3 -top-1 -right-1 p-0.5",
  sm: "w-3.5 h-3.5 -top-1 -right-1 p-0.5",
  md: "w-4 h-4 -top-1.5 -right-1.5 p-0.5",
  lg: "w-5 h-5 -top-2 -right-2 p-1",
  xl: "w-7 h-7 -top-2 -right-2 p-1",
};

export default function UserAvatar({
  avatarUrl,
  displayName,
  email,
  borderId,
  size = "md",
  className,
  hoverZoom = true,
}: UserAvatarProps) {
  // Borda explícita tem prioridade; senão, usa a borda do preset cuja imagem bate com avatar_url (compat).
  const borderPreset = findPresetById(borderId) ?? findPresetBySrc(avatarUrl);
  const initial = (displayName || email || "?").charAt(0).toUpperCase();
  const isAdminBorder = borderPreset?.category === "admin";

  return (
    <div className={cn("relative inline-block shrink-0", hoverZoom && "group", className)}>
      <Avatar className={cn(SIZE_MAP[size], borderPreset?.borderClass, "overflow-hidden")}>
        <AvatarImage
          src={avatarUrl ?? undefined}
          alt={displayName ?? "Avatar"}
          className={cn(
            "transition-transform duration-300 ease-out",
            hoverZoom && "group-hover:scale-150 group-focus-within:scale-150",
          )}
        />
        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      {isAdminBorder && (
        <span
          className={cn(
            "absolute rounded-full bg-amber-400 text-amber-950 shadow-md flex items-center justify-center",
            CROWN_SIZE[size],
          )}
          aria-label="Administrador"
        >
          <Crown className="w-full h-full" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}
