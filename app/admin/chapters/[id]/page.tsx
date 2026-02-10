"use client";

import React from "react"

import { use, useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Upload,
  Trash2,
  GripVertical,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChapterImage {
  id: string | number;
  image_url: string;
  object_key?: string | null;
  sort_order: number;
}

export default function ChapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: chapter, mutate, isLoading } = useSWR(
    `/api/admin/chapters/${id}`,
    fetcher
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0 || !chapter) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        const existingCount = (chapter.images || []).length;

        // 1. Get presigned URLs
        const presignPayload = files.map((file, i) => ({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          targetType: "chapterPage" as const,
          comicSlug: chapter.comic_slug,
          chapterId: id,
          sortOrder: existingCount + i,
        }));

        const presignRes = await fetch("/api/admin/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(presignPayload),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || "Failed to get presigned URLs");
        }

        const presigned = await presignRes.json();

        // 2. Upload each file directly to R2
        for (let i = 0; i < files.length; i++) {
          const uploadRes = await fetch(presigned[i].uploadUrl, {
            method: "PUT",
            body: files[i],
            headers: { "Content-Type": files[i].type },
          });
          if (!uploadRes.ok) {
            throw new Error(`อัปโหลด ${files[i].name} ไม่สำเร็จ`);
          }
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }

        // 3. Complete upload
        const completeRes = await fetch("/api/admin/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: id,
            items: presigned.map(
              (p: { objectKey: string; publicUrl: string }, i: number) => ({
                objectKey: p.objectKey,
                publicUrl: p.publicUrl,
                sortOrder: existingCount + i,
              })
            ),
          }),
        });

        if (completeRes.ok) {
          toast.success(`อัปโหลด ${files.length} รูปภาพแล้ว`);
          mutate();
        } else {
          throw new Error("อัปโหลดไม่สำเร็จ");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Upload failed"
        );
      } finally {
        setUploading(false);
        setUploadProgress(0);
        e.target.value = "";
      }
    },
    [chapter, id, mutate]
  );

  const deleteImage = useCallback(
    async (imageId: string | number) => {
      const res = await fetch(`/api/admin/images/${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("ลบรูปภาพแล้ว");
        mutate();
      } else {
        toast.error("ลบรูปภาพไม่สำเร็จ");
      }
    },
    [mutate]
  );

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const images = [...(chapter.images as ChapterImage[])];
    const [moved] = images.splice(dragIndex, 1);
    images.splice(dropIndex, 0, moved);

    // Optimistic update
    const reordered = images.map((img, i) => ({
      ...img,
      sort_order: i,
    }));

    mutate({ ...chapter, images: reordered }, false);

    // Persist to server
    await fetch("/api/admin/images/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map((img) => ({
          id: img.id,
          sortOrder: img.sort_order,
        })),
      }),
    });

    setDragIndex(null);
    setDragOverIndex(null);
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!chapter || chapter.error) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        ไม่พบตอน
      </div>
    );
  }

  const images = (chapter.images || []) as ChapterImage[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/comics/${chapter.comic_id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            {chapter.comic_title} - ตอนที่ {chapter.number}
            {chapter.title ? `: ${chapter.title}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            {images.length} รูปภาพ
          </p>
        </div>
      </div>

      {/* Upload area */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  กำลังอัปโหลด... {uploadProgress}%
                </p>
                <Progress value={uploadProgress} className="mx-auto w-48" />
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  คลิกหรือลากรูปภาพเพื่ออัปโหลด
                </p>
                <p className="text-xs text-muted-foreground">
                  รองรับ JPEG, PNG, WebP, GIF (สูงสุด 15MB ต่อไฟล์)
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </CardContent>
      </Card>

      {/* Image gallery with drag-and-drop reorder */}
      {images.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีรูปภาพ กรุณาอัปโหลดด้านบน
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={`group relative rounded-lg border transition-all ${
                dragOverIndex === index
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              } ${dragIndex === index ? "opacity-50" : ""}`}
            >
              <div className="absolute left-1 top-1 z-10 flex items-center gap-1">
                <span className="rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground backdrop-blur">
                  {index + 1}
                </span>
              </div>
              <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(img.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 flex cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-t bg-background/80 px-2 py-0.5 backdrop-blur">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <img
                src={img.image_url || "/placeholder.svg"}
                alt={`Page ${index + 1}`}
                className="aspect-[3/4] w-full rounded-lg object-cover"
                loading="lazy"
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบรูปภาพนี้หรือไม่?"
        description="รูปภาพนี้จะถูกลบถาวร"
        confirmText="ลบรูปภาพ"
        onConfirm={() => {
          if (deleteTarget === null) return;
          const targetId = deleteTarget;
          setDeleteTarget(null);
          deleteImage(targetId);
        }}
      />
    </div>
  );
}
