"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ComicForm } from "@/components/admin/comic-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ComicsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    title: string;
  } | null>(null);

  const { data, mutate, isLoading } = useSWR(
    `/api/admin/comics?search=${encodeURIComponent(search)}&page=${page}&pageSize=20`,
    fetcher
  );

  const handleDelete = useCallback(
    async (id: string | number, title: string) => {
      const res = await fetch(`/api/admin/comics/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`ลบ "${title}" แล้ว`);
        mutate();
      } else {
        toast.error("ลบคอมมิคไม่สำเร็จ");
      }
    },
    [mutate]
  );

  const comics = data?.comics || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">คอมมิค</h2>
          <p className="text-sm text-muted-foreground">
            จัดการคลังคอมมิคของคุณ ({total} รายการ)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มคอมมิค
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">สร้างคอมมิค</DialogTitle>
            </DialogHeader>
            <ComicForm
              onSuccess={() => {
                setDialogOpen(false);
                mutate();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาคอมมิค..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border-input bg-secondary pl-9 text-foreground"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ปก</TableHead>
              <TableHead className="text-muted-foreground">ชื่อเรื่อง</TableHead>
              <TableHead className="text-muted-foreground">สถานะ</TableHead>
              <TableHead className="text-muted-foreground">ผู้แต่ง</TableHead>
              <TableHead className="text-muted-foreground">ซีรีส์</TableHead>
              <TableHead className="text-right text-muted-foreground">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : comics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  ไม่พบคอมมิค
                </TableCell>
              </TableRow>
            ) : (
              comics.map((comic: Record<string, unknown>) => (
                <TableRow key={String(comic.id)} className="border-border">
                  <TableCell>
                    {comic.cover_image_url ? (
                      <img
                        src={comic.cover_image_url as string || "/placeholder.svg"}
                        alt=""
                        className="h-12 w-9 rounded object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-12 w-9 items-center justify-center rounded bg-secondary">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/comics/${comic.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {comic.title as string}
                    </Link>
                    <p className="text-xs text-muted-foreground">{comic.slug as string}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        comic.status === "ongoing"
                          ? "default"
                          : comic.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {comic.status as string}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(comic.author_name as string) || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(comic.series_title as string) || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/admin/comics/${comic.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: comic.id as string,
                            title: comic.title as string,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            หน้า {page} จาก {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบคอมมิคนี้หรือไม่?"
        description={
          deleteTarget
            ? `ลบ "${deleteTarget.title}" และตอน/รูปภาพทั้งหมดหรือไม่?`
            : undefined
        }
        confirmText="ลบคอมมิค"
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id, title } = deleteTarget;
          setDeleteTarget(null);
          handleDelete(id, title);
        }}
      />
    </div>
  );
}
