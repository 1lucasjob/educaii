import preset1 from "@/assets/avatars/preset-1-homem-negro.png";
import preset2 from "@/assets/avatars/preset-2-mulher-negra.png";
import preset3 from "@/assets/avatars/preset-3-homem-japones.png";
import preset4 from "@/assets/avatars/preset-4-mulher-japonesa.png";
import preset5 from "@/assets/avatars/preset-5-homem-branco-sem-barba.png";
import preset6 from "@/assets/avatars/preset-6-homem-branco-com-barba.png";
import preset7 from "@/assets/avatars/preset-7-mulher-branca.png";
import preset8 from "@/assets/avatars/preset-8-alienigena.png";

export interface PresetAvatar {
  id: string;
  label: string;
  src: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "homem-negro", label: "Homem negro", src: preset1 },
  { id: "mulher-negra", label: "Mulher negra", src: preset2 },
  { id: "homem-japones", label: "Homem japonês", src: preset3 },
  { id: "mulher-japonesa", label: "Mulher japonesa", src: preset4 },
  { id: "homem-branco-sb", label: "Homem branco sem barba", src: preset5 },
  { id: "homem-branco-cb", label: "Homem branco com barba", src: preset6 },
  { id: "mulher-branca", label: "Mulher branca", src: preset7 },
  { id: "alienigena", label: "Alienígena", src: preset8 },
];
