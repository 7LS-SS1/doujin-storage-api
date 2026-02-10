"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChapterFormProps {
  comicId: string | number;
  chapter?: Record<string, unknown>;
  onSuccess: () => void;
}

export function ChapterForm({ comicId, chapter, onSuccess }: ChapterFormProps) {
  const [number, setNumber] = useState((chapter?.number as string) || "");
  const [title, setTitle] = useState((chapter?.title as string) || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = chapter
        ? `/api/admin/chapters/${chapter.id}`
        : "/api/admin/chapters";
      const method = chapter ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comicId,
          number,
          title: title || undefined,
        }),
      });

      if (res.ok) {
        toast.success(chapter ? "อัปเดตตอนแล้ว" : "สร้างตอนแล้ว");
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        const fieldErrors = data?.details?.fieldErrors;
        const detailText = fieldErrors
          ? Object.values(fieldErrors)
              .flat()
              .filter(Boolean)
              .join(", ")
          : "";
        const extraDetail =
          typeof data?.details === "string" ? data.details : "";
        toast.error(detailText || extraDetail || data.error || "บันทึกไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกตอน");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">หมายเลขตอน</Label>
        <Input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="เช่น 1, 2, 12.5"
          required
          className="border-input bg-secondary text-foreground"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-foreground">ชื่อตอน (ไม่บังคับ)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อตอน"
          className="border-input bg-secondary text-foreground"
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {chapter ? "อัปเดตตอน" : "สร้างตอน"}
      </Button>
    </form>
  );
}
