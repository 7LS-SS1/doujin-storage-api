"use client";

import React from "react"

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const { data, mutate, isLoading } = useSWR("/api/admin/categories", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setDialogOpen(true);
  }

  function openEdit(c: Record<string, unknown>) {
    setEditing(c);
    setName(c.name as string);
    setSlug(c.slug as string);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slug || slugify(name);
    const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: finalSlug }),
    });

    if (res.ok) {
      toast.success(editing ? "Category updated" : "Category created");
      setDialogOpen(false);
      mutate();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Category deleted");
      mutate();
    }
  }

  const categories = data?.categories || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">หมวดหมู่</h2>
          <p className="text-sm text-muted-foreground">ระบบหมวดหมู่ที่เข้ากันกับ WordPress</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ชื่อ</TableHead>
              <TableHead className="text-muted-foreground">สลัก</TableHead>
              <TableHead className="text-right text-muted-foreground">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">ไม่มีหมวดหมู่</TableCell></TableRow>
            ) : (
              categories.map((c: Record<string, unknown>) => (
                <TableRow key={c.id as number} className="border-border">
                  <TableCell className="font-medium text-foreground">{c.name as string}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug as string}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id as number)}>
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
            <DialogTitle className="text-foreground">{editing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Name</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} required className="border-input bg-secondary text-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-input bg-secondary text-foreground" />
            </div>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
