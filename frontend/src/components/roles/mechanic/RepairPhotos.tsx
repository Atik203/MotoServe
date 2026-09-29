"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImageOff, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { uploadDocument } from "@/store/slices/authSlice";
import { fetchTask, addTaskPhoto } from "@/store/slices/tasksSlice";
import { useFileUrl } from "@/hooks/useFileUrl";

interface RepairPhotosProps {
  taskId: string;
  photos: string[];
}

function PhotoTile({ photo, index }: { photo: string; index: number }) {
  const src = useFileUrl(photo);
  const [failed, setFailed] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden rounded border border-border bg-secondary">
      {src && !failed ? (
        <Image
          src={src}
          alt={`Repair photo ${index + 1}`}
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : src ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageOff className="size-4" />
          <span className="text-[10px] font-medium">Unavailable</span>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function RepairPhotos({ taskId, photos }: RepairPhotosProps) {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !taskId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo exceeds 5MB limit");
      return;
    }
    try {
      const res = await dispatch(
        uploadDocument({ fileName: file.name, fileType: file.type, purpose: "image" }),
      ).unwrap();
      const put = await fetch(res.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Upload to storage failed");
      await dispatch(addTaskPhoto({ id: taskId, key: res.key })).unwrap();
      await dispatch(fetchTask(taskId));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
          <Camera className="size-[18px]" />
          Repair Photos
        </h2>
        <span className="text-xs font-medium text-muted-foreground">{photos.length} photo{photos.length === 1 ? "" : "s"}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />

      <div className="grid grid-cols-2 gap-2">
        {photos.map((key, i) => (
          <PhotoTile key={key} photo={key} index={i} />
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-[#c2c6d5] bg-secondary transition-colors hover:border-primary"
        >
          <Camera className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Upload Photo</span>
        </button>
      </div>
    </section>
  );
}
