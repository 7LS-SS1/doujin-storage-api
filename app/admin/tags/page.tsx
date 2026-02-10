"use client";

import React from "react"

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TagsPage() {
  const { data, mutate, isLoading } = useSWR("/api/admin/tags", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  function openCreate() { setEditing(null); setName(""); setSlug(""); setDialogOpen(true); }
  function openEdit(t: Record<string, unknown>) { setEditing(t); setName(t.name as string); setSlug(t.slug as string); setDialogOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slug || generateSlug(name);
    const url = editing ? `/api/admin/tags/${editing.id}` : "/api/admin/tags";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug: finalSlug }) });
    if (res.ok) { toast.success(editing ? "Tag updated" : "Tag created"); setDialogOpen(false); mutate(); }
    else { const data = await res.json(); toast.error(data.error || "Failed to save"); }
  }

  async function handleDelete(id: string | number) {
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Tag deleted"); mutate(); }
  }

  const tags = data?.tags || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tags</h2>
          <p className="text-sm text-muted-foreground">WordPress-compatible tag taxonomy</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Tag</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Slug</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : tags.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No tags</TableCell></TableRow>
            ) : (
              tags.map((t: Record<string, unknown>) => (
                <TableRow key={String(t.id)} className="border-border">
                  <TableCell className="font-medium text-foreground">{t.name as string}</TableCell>
                  <TableCell className="text-muted-foreground">{t.slug as string}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: t.id as string,
                            name: t.name as string,
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
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Edit Tag" : "Create Tag"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Name</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(generateSlug(e.target.value)); }} required className="border-input bg-secondary text-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-input bg-secondary text-foreground" />
            </div>
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบแท็กนี้หรือไม่?"
        description={
          deleteTarget ? `ลบ "${deleteTarget.name}" หรือไม่?` : undefined
        }
        confirmText="ลบแท็ก"
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
