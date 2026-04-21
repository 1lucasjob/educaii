import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn } from "lucide-react";

interface AvatarCropDialogProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropped: (blob: Blob) => void;
}

const OUTPUT_SIZE = 512;

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: string,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      outputType,
      0.9,
    );
  });
}

export default function AvatarCropDialog({ file, open, onOpenChange, onCropped }: AvatarCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, file.type);
      onCropped(blob);
      onOpenChange(false);
    } catch (e) {
      console.error("crop failed", e);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-primary" /> Recortar imagem de perfil
          </DialogTitle>
          <DialogDescription>
            Arraste para reposicionar e use o zoom para ajustar. A imagem ficará quadrada.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-64 sm:h-80 bg-muted rounded-md overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={working}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={working || !croppedAreaPixels}
            className="gradient-primary text-primary-foreground"
          >
            {working ? "Processando…" : "Cortar e enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
