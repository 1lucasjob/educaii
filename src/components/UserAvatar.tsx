import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { findPresetBySrc } from "@/lib/presetAvatars";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: Size;
  className?: string;
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
  size = "md",
  className,
}: UserAvatarProps) {
  const preset = findPresetBySrc(avatarUrl);
  const initial = (displayName || email || "?").charAt(0).toUpperCase();

  return (
    <div className={cn("relative inline-block shrink-0", className)}>
      <Avatar className={cn(SIZE_MAP[size], preset?.borderClass)}>
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? "Avatar"} />
        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      {preset?.category === "admin" && (
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
