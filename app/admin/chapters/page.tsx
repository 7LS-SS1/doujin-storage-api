"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChaptersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    `/api/admin/chapters?search=${encodeURIComponent(search)}&page=${page}&pageSize=20`,
    fetcher
  );

  const chapters = data?.chapters || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
        <p className="text-sm text-muted-foreground">
          จัดการตอนทั้งหมด ({total} รายการ)
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาตอนหรือชื่อคอมมิค..."
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
              <TableHead className="text-muted-foreground">ตอน</TableHead>
              <TableHead className="text-muted-foreground">คอมมิค</TableHead>
              <TableHead className="text-muted-foreground">รูปภาพ</TableHead>
              <TableHead className="text-muted-foreground">วันที่</TableHead>
              <TableHead className="text-right text-muted-foreground">
                จัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : chapters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  ไม่พบตอน
                </TableCell>
              </TableRow>
            ) : (
              chapters.map((ch: Record<string, unknown>) => {
                const dateValue =
                  (ch.published_at as string | undefined) ||
                  (ch.created_at as string | undefined);
                const dateLabel = dateValue
                  ? new Date(dateValue).toLocaleDateString()
                  : "-";
                return (
                  <TableRow key={String(ch.id)} className="border-border">
                    <TableCell>
                      <Link
                        href={`/admin/chapters/${ch.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        ตอนที่ {ch.number as string}
                        {ch.title ? ` - ${ch.title as string}` : ""}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ch.comic_id ? (
                        <Link
                          href={`/admin/comics/${ch.comic_id}`}
                          className="hover:text-primary"
                        >
                          {(ch.comic_title as string) || "-"}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {String(ch.image_count ?? 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateLabel}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/admin/chapters/${ch.id}`}>
                            <Layers className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        {ch.comic_id ? (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={`/admin/comics/${ch.comic_id}`}>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          หน้า {page} / {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            ถัดไป
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
