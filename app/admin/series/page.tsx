"use client";

import React from "react"

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SeriesPage() {
  const [search, setSearch] = useState("");
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/series?search=${encodeURIComponent(search)}`,
    fetcher
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    title: string;
  } | null>(null);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setDialogOpen(true);
  }

  function openEdit(s: Record<string, unknown>) {
    setEditing(s);
    setTitle(s.title as string);
    setSlug(s.slug as string);
    setDescription((s.description as string) || "");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing
      ? `/api/admin/series/${editing.id}`
      : "/api/admin/series";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, description: description || undefined }),
    });

    if (res.ok) {
      toast.success(editing ? "อัปเดตซีรีส์แล้ว" : "สร้างซีรีส์แล้ว");
      setDialogOpen(false);
      mutate();
    } else {
      const data = await res.json();
      toast.error(data.error || "บันทึกไม่สำเร็จ");
    }
  }

  async function handleDelete(id: string | number) {
    const res = await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("ลบซีรีส์แล้ว");
      mutate();
    }
  }

  const series = data?.series || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">ซีรีส์</h2>
          <p className="text-sm text-muted-foreground">จัดกลุ่มคอมมิคเป็นซีรีส์</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มซีรีส์
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาซีรีส์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input bg-secondary pl-9 text-foreground"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ชื่อ</TableHead>
              <TableHead className="text-muted-foreground">สลัก</TableHead>
              <TableHead className="text-muted-foreground">คอมมิค</TableHead>
              <TableHead className="text-right text-muted-foreground">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">กำลังโหลด...</TableCell>
              </TableRow>
            ) : series.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">ไม่พบซีรีส์</TableCell>
              </TableRow>
            ) : (
              series.map((s: Record<string, unknown>) => (
                <TableRow key={String(s.id)} className="border-border">
                  <TableCell className="font-medium text-foreground">{s.title as string}</TableCell>
                  <TableCell className="text-muted-foreground">{s.slug as string}</TableCell>
                  <TableCell className="text-muted-foreground">{s.comic_count as number}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: s.id as string,
                            title: s.title as string,
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editing ? "แก้ไขซีรีส์" : "สร้างซีรีส์"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">ชื่อ</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="border-input bg-secondary text-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">สลัก (Slug)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-input bg-secondary text-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">คำอธิบาย</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="border-input bg-secondary text-foreground" />
            </div>
            <Button type="submit">{editing ? "อัปเดต" : "สร้าง"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบซีรีส์นี้หรือไม่?"
        description={
          deleteTarget ? `ลบ "${deleteTarget.title}" หรือไม่?` : undefined
        }
        confirmText="ลบซีรีส์"
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id } = deleteTarget;
          setDeleteTarget(null);
          handleDelete(id);
        }}
      />
    </div>
  );
}
