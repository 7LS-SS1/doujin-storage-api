"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold text-foreground"
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">คลังการ์ตูน</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
          >
            หน้าแรก
          </Link>
          <Link
            href="/?status=ongoing"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
          >
            กำลังดำเนิน
          </Link>
          <Link
            href="/?status=completed"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
          >
            จบแล้ว
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Admin link */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">แผงควบคุม</span>
        </Link>
      </div>
    </header>
  );
}
