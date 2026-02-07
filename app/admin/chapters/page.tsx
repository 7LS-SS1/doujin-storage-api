"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, ArrowRight } from "lucide-react";

export default function ChaptersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
        <p className="text-sm text-muted-foreground">
          Manage chapters from within each comic
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Layers className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Chapters are managed per comic. Navigate to a comic to add, edit, or
            reorder chapters and their images.
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Go to Comics <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
