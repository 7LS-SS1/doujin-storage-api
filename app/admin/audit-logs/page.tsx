"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(
    `/api/admin/audit-logs?page=${page}&pageSize=50`,
    fetcher
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">Track all admin actions ({total} entries)</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Action</TableHead>
              <TableHead className="text-muted-foreground">Entity</TableHead>
              <TableHead className="text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No audit logs</TableCell></TableRow>
            ) : (
              logs.map((log: Record<string, unknown>) => (
                <TableRow key={log.id as number} className="border-border">
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(log.created_at as string).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{log.user_email as string}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {(log.action as string).replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.entity_type ? `${log.entity_type}#${log.entity_id}` : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
