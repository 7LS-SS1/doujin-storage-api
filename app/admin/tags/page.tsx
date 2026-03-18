"use client";

import React from "react"

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
type CreateMode = "single" | "bulk";

function parseBulkNames(input: string): string[] {
  const dedupe = new Set<string>();
  const result: string[] = [];
  const parts = input
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const name of parts) {
    const key = name.toLowerCase();
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    result.push(name);
  }

  return result;
}

export default function TagsPage() {
  const { data, mutate, isLoading } = useSWR("/api/admin/tags", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode>("single");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  function openCreate(mode: CreateMode = "single") {
    setEditing(null);
    setCreateMode(mode);
    setName("");
    setSlug("");
    setBulkInput("");
    setDialogOpen(true);
  }

  function openEdit(t: Record<string, unknown>) {
    setEditing(t);
    setCreateMode("single");
    setName(t.name as string);
    setSlug(t.slug as string);
    setBulkInput("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!editing && createMode === "bulk") {
        const names = parseBulkNames(bulkInput);
        if (names.length === 0) {
          toast.error("Please enter at least one tag");
          return;
        }

        const res = await fetch("/api/admin/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names }),
        });
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          toast.error(payload.error || "Failed to create tags");
          return;
        }

        const createdCount = Number(payload.createdCount || 0);
        const skippedCount = Number(payload.skippedCount || 0);
        const invalidCount = Number(payload.invalidCount || 0);
        const summary = [
          `Created ${createdCount}`,
          skippedCount > 0 ? `Skipped ${skippedCount}` : "",
          invalidCount > 0 ? `Invalid ${invalidCount}` : "",
        ]
          .filter(Boolean)
          .join(" • ");

        toast.success(summary || "Tags processed");
        setDialogOpen(false);
        mutate();
        return;
      }

      const finalSlug = slug || generateSlug(name);
      if (!finalSlug) {
        toast.error("Please provide a valid name or slug");
        return;
      }

      const url = editing ? `/api/admin/tags/${editing.id}` : "/api/admin/tags";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: finalSlug }),
      });
      if (res.ok) {
        toast.success(editing ? "Tag updated" : "Tag created");
        setDialogOpen(false);
        mutate();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openCreate("bulk")}>Add Multiple</Button>
          <Button onClick={() => openCreate("single")}><Plus className="mr-2 h-4 w-4" />Add Tag</Button>
        </div>
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
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editing ? "Edit Tag" : createMode === "bulk" ? "Create Multiple Tags" : "Create Tag"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!editing && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2">
                <Button
                  type="button"
                  variant={createMode === "single" ? "default" : "ghost"}
                  onClick={() => setCreateMode("single")}
                >
                  Single Tag
                </Button>
                <Button
                  type="button"
                  variant={createMode === "bulk" ? "default" : "ghost"}
                  onClick={() => setCreateMode("bulk")}
                >
                  Bulk Add
                </Button>
              </div>
            )}

            {editing || createMode === "single" ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editing) setSlug(generateSlug(e.target.value));
                    }}
                    required
                    className="border-input bg-secondary text-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="border-input bg-secondary text-foreground" />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Tag Names</Label>
                <Textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={8}
                  placeholder={"romance\nfantasy\naction, comedy, school-life"}
                  className="border-input bg-secondary text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Enter multiple tags separated by new lines or commas.
                </p>
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {editing ? "Update" : createMode === "bulk" ? "Create Multiple Tags" : "Create"}
            </Button>
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
