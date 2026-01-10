import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  bucket: string;
  folder: string;
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "square" | "wide";
}

export function ImageUpload({
  bucket,
  folder,
  currentImageUrl,
  onUpload,
  onRemove,
  className = "",
  aspectRatio = "square",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate image dimensions for wide banners
    if (aspectRatio === "wide") {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      const dimCheck = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = (e) => {
          reject(new Error("Unable to read image dimensions."));
          URL.revokeObjectURL(objectUrl);
        };
        img.src = objectUrl;
      }).catch((err) => {
        toast({ title: "Invalid image", description: "Unable to read image dimensions.", variant: "destructive" });
        return null as any;
      });

      if (!dimCheck) return;

      const { width, height } = dimCheck;
      const requiredWidth = 1920;
      const requiredHeight = 600;
      const ratio = width / height;
      const expectedRatio = 5; // 3:1
      const tolerance = 0.05; // allow 5% tolerance

      if (width < requiredWidth || height < requiredHeight) {
        toast({ title: "Image too small", description: `Image too small. Required banner size is ${requiredWidth}×${requiredHeight} pixels.`, variant: "destructive" });
        return;
      }

      if (Math.abs(width - requiredWidth) > 10 || Math.abs(height - requiredHeight) > 10) {
  toast({ title: "Invalid dimensions", description: `Banner must be exactly ${requiredWidth}×${requiredHeight} pixels. Your image is ${width}×${height}.`, variant: "destructive" });
      }
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(urlData.publicUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const aspectClass = aspectRatio === "wide" ? "aspect-video" : "aspect-square";

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
      />

      {currentImageUrl ? (
        <div className={`relative ${aspectClass} bg-muted rounded-lg overflow-hidden`}>
          <img
            src={currentImageUrl}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Change
              </>
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspectClass} border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
