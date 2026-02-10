"use client";

import React from "react"

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Copy, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ApiKeysPage() {
  const { data, mutate, isLoading } = useSWR("/api/admin/api-keys", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      toast.success("API key created");
      mutate();
    } else {
      toast.error("Failed to create key");
    }
  }

  async function toggleActive(id: string | number, currentActive: boolean) {
    await fetch(`/api/admin/api-keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    toast.success(currentActive ? "Key revoked" : "Key activated");
    mutate();
  }

  async function handleDelete(id: string | number) {
    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Key deleted"); mutate(); }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("Key copied to clipboard");
    }
  }

  const apiKeys = data?.apiKeys || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground">Manage WordPress client access keys</p>
        </div>
        <Button onClick={() => { setName(""); setNewKey(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Key
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Prefix</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Last Used</TableHead>
              <TableHead className="text-muted-foreground">Created</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No API keys</TableCell></TableRow>
            ) : (
              apiKeys.map((k: Record<string, unknown>) => (
                <TableRow key={String(k.id)} className="border-border">
                  <TableCell className="font-medium text-foreground">{k.name as string}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{k.key_prefix as string}...</TableCell>
                  <TableCell>
                    <Badge variant={k.is_active ? "default" : "destructive"}>
                      {k.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {k.last_used_at ? new Date(k.last_used_at as string).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(k.created_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(k.id as string, k.is_active as boolean)}
                        title={k.is_active ? "Revoke" : "Activate"}
                      >
                        {k.is_active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: k.id as string,
                            name: k.name as string,
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setNewKey(null); }}>
        <DialogContent className="border-border bg-card">
          <DialogHeader><DialogTitle className="text-foreground">{newKey ? "API Key Created" : "Create API Key"}</DialogTitle></DialogHeader>
          {newKey ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Copy this key now. It will not be shown again.
              </p>
              <div className="flex gap-2">
                <Input value={newKey} readOnly className="border-input bg-secondary font-mono text-xs text-foreground" />
                <Button variant="outline" size="icon" onClick={copyKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setDialogOpen(false)}>Done</Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My WordPress Site" required className="border-input bg-secondary text-foreground" />
              </div>
              <Button type="submit">Generate Key</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบ API key นี้หรือไม่?"
        description={
          deleteTarget
            ? `ลบ "${deleteTarget.name}" แบบถาวรหรือไม่?`
            : undefined
        }
        confirmText="ลบคีย์"
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
