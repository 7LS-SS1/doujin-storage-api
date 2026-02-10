"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Layers, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ComicForm } from "@/components/admin/comic-form";
import { ChapterForm } from "@/components/admin/chapter-form";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ComicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: comic, mutate, isLoading } = useSWR(
    `/api/admin/comics/${id}`,
    fetcher
  );
  const [editOpen, setEditOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    label: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!comic || comic.error) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        ไม่พบคอมมิค
      </div>
    );
  }

  async function deleteChapter(chapterId: string | number) {
    const res = await fetch(`/api/admin/chapters/${chapterId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("ลบตอนแล้ว");
      mutate();
    } else {
      toast.error("ลบตอนไม่สำเร็จ");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            {comic.title}
          </h2>
          <p className="text-sm text-muted-foreground">/{comic.slug}</p>
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">แก้ไขคอมมิค</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">แก้ไขคอมมิค</DialogTitle>
            </DialogHeader>
            <ComicForm
              comic={comic}
              onSuccess={() => {
                setEditOpen(false);
                mutate();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-1">
          <CardContent className="p-4">
            {comic.cover_image_url ? (
              <img
                src={comic.cover_image_url || "/placeholder.svg"}
                alt={comic.title}
                className="w-full rounded-lg object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-secondary">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge>{comic.status}</Badge>
                {comic.series_title && (
                  <Badge variant="outline">{comic.series_title}</Badge>
                )}
              </div>
              {comic.author_name && (
                <p className="text-sm text-muted-foreground">
                  โดย {comic.author_name}
                </p>
              )}
              {comic.description && (
                <p className="text-sm text-muted-foreground">
                  {comic.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {(comic.categories || []).map(
                  (c: { id: string | number; name: string }) => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.name}
                    </Badge>
                  )
                )}
                {(comic.tags || []).map(
                  (t: { id: string | number; name: string }) => (
                    <Badge key={t.id} variant="outline" className="text-xs">
                      {t.name}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              ตอน ({(comic.chapters || []).length})
            </h3>
            <Dialog open={chapterOpen} onOpenChange={setChapterOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มตอน
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    ตอนใหม่
                  </DialogTitle>
                </DialogHeader>
                <ChapterForm
                  comicId={comic.id}
                  onSuccess={() => {
                    setChapterOpen(false);
                    mutate();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {(comic.chapters || []).length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center gap-2 py-8">
                <Layers className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  ยังไม่มีตอน
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {(
                comic.chapters as {
                  id: string | number;
                  number: string;
                  title: string;
                  published_at: string;
                }[]
              ).map((ch) => (
                <Card key={ch.id} className="border-border bg-card">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <Link
                        href={`/admin/chapters/${ch.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        ตอนที่ {ch.number}
                        {ch.title ? ` - ${ch.title}` : ""}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ch.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/admin/chapters/${ch.id}`}>
                          <Layers className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: ch.id,
                            label: `ตอนที่ ${ch.number}`,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบตอนนี้หรือไม่?"
        description={
          deleteTarget
            ? `${deleteTarget.label} และรูปภาพทั้งหมดจะถูกลบ`
            : undefined
        }
        confirmText="ลบตอน"
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id } = deleteTarget;
          setDeleteTarget(null);
          deleteChapter(id);
        }}
      />
    </div>
  );
}
