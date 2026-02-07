"use client";

import React from "react"

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

interface ComicFormProps {
  comic?: Record<string, unknown>;
  onSuccess: () => void;
}

export function ComicForm({ comic, onSuccess }: ComicFormProps) {
  const [title, setTitle] = useState((comic?.title as string) || "");
  const [slug, setSlug] = useState((comic?.slug as string) || "");
  const [description, setDescription] = useState(
    (comic?.description as string) || ""
  );
  const [authorName, setAuthorName] = useState(
    (comic?.author_name as string) || ""
  );
  const [status, setStatus] = useState<string>(
    (comic?.status as string) || "ongoing"
  );
  const [seriesId, setSeriesId] = useState<string>(
    comic?.series_id ? String(comic.series_id) : "none"
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    ((comic?.categories as { id: number }[]) || []).map((c) => c.id)
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    ((comic?.tags as { id: number }[]) || []).map((t) => t.id)
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(
    (comic?.cover_image_url as string) || ""
  );
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!comic);

  const { data: seriesData } = useSWR("/api/admin/series", fetcher);
  const { data: categoriesData } = useSWR("/api/admin/categories", fetcher);
  const { data: tagsData } = useSWR("/api/admin/tags", fetcher);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCover(comicSlug: string): Promise<{
    objectKey: string;
    publicUrl: string;
  } | null> {
    if (!coverFile) return null;

    const presignRes = await fetch("/api/admin/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          fileName: coverFile.name,
          contentType: coverFile.type,
          size: coverFile.size,
          targetType: "cover",
          comicSlug,
        },
      ]),
    });

    if (!presignRes.ok) {
      throw new Error("ไม่สามารถรับ URL สำหรับอัปโหลดได้");
    }

    const presigned = await presignRes.json();
    const { objectKey, uploadUrl, publicUrl } = presigned[0];

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: coverFile,
      headers: { "Content-Type": coverFile.type },
    });

    if (!uploadRes.ok) {
      throw new Error("อัปโหลดปกไม่สำเร็จ");
    }

    return { objectKey, publicUrl };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let coverImageUrl = comic?.cover_image_url as string | undefined;
      let coverObjectKey = comic?.cover_object_key as string | undefined;

      if (coverFile) {
        const result = await uploadCover(slug);
        if (result) {
          coverImageUrl = result.publicUrl;
          coverObjectKey = result.objectKey;
        }
      }

      const payload = {
        title,
        slug,
        description: description || null,
        authorName: authorName || null,
        status,
        seriesId: seriesId !== "none" ? parseInt(seriesId) : null,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        coverImageUrl: coverImageUrl || null,
        coverObjectKey: coverObjectKey || null,
      };

      const url = comic
        ? `/api/admin/comics/${comic.id}`
        : "/api/admin/comics";
      const method = comic ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(comic ? "อัปเดตคอมมิคแล้ว" : "สร้างคอมมิคแล้ว");
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกคอมมิค");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const allCategories = categoriesData?.categories || [];
  const allTags = tagsData?.tags || [];
  const allSeries = seriesData?.series || [];

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }
  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">ชื่อเรื่อง</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-input bg-secondary text-foreground"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">สลัก (Slug)</Label>
        <div className="flex gap-2">
          <Input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
            required
            className="border-input bg-secondary text-foreground"
          />
          {!autoSlug && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSlug(slugify(title));
                setAutoSlug(true);
              }}
            >
              Auto
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">คำอธิบาย</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border-input bg-secondary text-foreground"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">ชื่อผู้แต่ง</Label>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="border-input bg-secondary text-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-foreground">สถานะ</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-input bg-secondary text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              <SelectItem value="ongoing">กำลังดำเนินเรื่อง</SelectItem>
              <SelectItem value="completed">จบแล้ว</SelectItem>
              <SelectItem value="hiatus">พักเรื่อง</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">ซีรีส์ (ไม่บังคับ)</Label>
        <Select value={seriesId} onValueChange={setSeriesId}>
          <SelectTrigger className="border-input bg-secondary text-foreground">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="none">ไม่มี</SelectItem>
            {allSeries.map((s: { id: number; title: string }) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">รูปปก</Label>
        <div className="flex items-center gap-4">
          {coverPreview && (
            <img
              src={coverPreview || "/placeholder.svg"}
              alt="Cover preview"
              className="h-24 w-18 rounded border border-border object-cover"
              crossOrigin="anonymous"
            />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" />
            {coverFile ? coverFile.name : "เลือกไฟล์"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleCoverChange}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">หมวดหมู่</Label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat: { id: number; name: string }) => (
            <Badge
              key={cat.id}
              variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleCategory(cat.id)}
            >
              {cat.name}
              {selectedCategories.includes(cat.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
          {allCategories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              ยังไม่มีหมวดหมู่ กรุณาสร้างก่อน
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">แท็ก</Label>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag: { id: number; name: string }) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              {selectedTags.includes(tag.id) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
          {allTags.length === 0 && (
            <p className="text-xs text-muted-foreground">
              ยังไม่มีแท็ก กรุณาสร้างก่อน
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={saving} className="mt-2">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {comic ? "อัปเดตคอมมิค" : "สร้างคอมมิค"}
      </Button>
    </form>
  );
}
