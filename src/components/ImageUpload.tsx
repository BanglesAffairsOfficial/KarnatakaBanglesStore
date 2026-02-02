import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2000;
const MIN_DIMENSION_DEFAULT = 800;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.2;
const SCALE_STEP = 0.85;

interface ImageUploadProps {
  bucket: string;
  folder: string;
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "square" | "wide";
}

const loadImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image file."));
    };

    img.src = objectUrl;
  });

const getImageDimensions = async (file: File) => {
  const img = await loadImageFromFile(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
};

const canvasToBlob = (
  image: HTMLImageElement,
  width: number,
  height: number,
  mimeType: string,
  quality: number
) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported in this browser.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to process image."));
        }
      },
      mimeType,
      quality
    );
  });
};

const compressImageToLimit = async (
  file: File,
  minWidth = MIN_DIMENSION_DEFAULT,
  minHeight = MIN_DIMENSION_DEFAULT
): Promise<File> => {
  const image = await loadImageFromFile(file);
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  const aspect = width / height;

  const largestSide = Math.max(width, height);
  if (largestSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / largestSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const mimeType = "image/jpeg";
  let quality = 0.92;

  const originalName = file.name.replace(/\.[^/.]+$/, "");

  // Try reducing quality first, then scale down progressively while honoring min dimensions
  while (true) {
    const blob = await canvasToBlob(image, width, height, mimeType, quality);

    if (blob.size <= MAX_FILE_SIZE) {
      return new File([blob], `${originalName}.jpg`, { type: mimeType });
    }

    if (quality > MIN_QUALITY + 0.001) {
      quality = Math.max(quality - QUALITY_STEP, MIN_QUALITY);
      continue;
    }

    const canScaleWidth = width > Math.max(minWidth, 100);
    const canScaleHeight = height > Math.max(minHeight, 100);
    if (canScaleWidth || canScaleHeight) {
      const nextWidth = Math.max(Math.round(width * SCALE_STEP), minWidth);
      const nextHeight = Math.max(Math.round(nextWidth / aspect), minHeight);
      width = nextWidth;
      height = nextHeight;
      quality = 0.92; // reset quality after scaling to preserve clarity
      continue;
    }

    throw new Error("Unable to compress image below 5MB. Please choose a smaller image.");
  }
};

const validateWideDimensions = async (file: File) => {
  const { width, height } = await getImageDimensions(file);
  const requiredWidth = 1920;
  const requiredHeight = 600;

  if (width < requiredWidth || height < requiredHeight) {
    throw new Error(`Image too small. Required banner size is ${requiredWidth}x${requiredHeight} pixels.`);
  }

  if (Math.abs(width - requiredWidth) > 10 || Math.abs(height - requiredHeight) > 10) {
    throw new Error(`Banner must be ${requiredWidth}x${requiredHeight} pixels. Your image is ${width}x${height}.`);
  }
};

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
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      resetFileInput();
      return;
    }

    setUploading(true);

    try {
      const isWide = aspectRatio === "wide";
      const processedFile = await compressImageToLimit(
        file,
        isWide ? 1920 : MIN_DIMENSION_DEFAULT,
        isWide ? 600 : MIN_DIMENSION_DEFAULT
      );

      if (isWide) {
        await validateWideDimensions(processedFile);
      }

      const fileExt = processedFile.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

      onUpload(urlData.publicUrl);

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      resetFileInput();
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
          <img src={currentImageUrl} alt="Uploaded" className="w-full h-full object-cover" />
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
