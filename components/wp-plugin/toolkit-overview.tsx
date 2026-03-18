import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileText,
  type LucideIcon,
  Monitor,
  Plug,
  Route,
  Settings2,
  Shield,
  Workflow,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  architectureFlow,
  featureCards,
  quickSetupSteps,
  requirements,
  roleCards,
  routePatterns,
  toolkitPackages,
  useCases,
  versionNote,
} from "@/components/wp-plugin/content";

const packageIconMap = {
  theme: Monitor,
  companion: Plug,
} as const;

const featureIconMap = [Shield, Clock3, Database, Route, Workflow, Wrench];

export function WordPressToolkitOverview() {
  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_30%),linear-gradient(135deg,rgba(8,10,12,0.96),rgba(10,18,14,0.98))] p-6 shadow-2xl shadow-black/20 lg:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,transparent,rgba(163,230,53,0.08),transparent)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200 hover:bg-emerald-400/10">
                WordPress Toolkit
              </Badge>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-100">
                ต้องใช้ Theme + Companion ร่วมกัน
              </Badge>
            </div>

            <div className="max-w-3xl space-y-3">
              <h2 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
                ชุดติดตั้ง WordPress สำหรับเปลี่ยน Comic Storage API ให้เป็นหน้าอ่านคอมมิคที่พร้อมใช้งานจริง
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-zinc-300 lg:text-base">
                หน้านี้สรุปเครื่องมือหลัก 2 ตัวที่ต้องติดตั้งร่วมกันบน WordPress:
                Theme สำหรับ UX/UI ฝั่งหน้าบ้าน และ Companion Plugin สำหรับเชื่อม API,
                sync ข้อมูล, จัดการ route และงานปฏิบัติการในแอดมิน
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 rounded-full bg-emerald-400 px-6 text-zinc-950 hover:bg-emerald-300">
                <Link href="/admin/wp-plugin/docs">
                  เปิด Docs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-zinc-700 bg-zinc-950/40 px-6 text-zinc-100 hover:bg-zinc-900">
                <a href={toolkitPackages[0].href} download>
                  ดาวน์โหลด Theme ZIP
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full border-zinc-700 bg-zinc-950/40 px-6 text-zinc-100 hover:bg-zinc-900">
                <a href={toolkitPackages[1].href} download>
                  ดาวน์โหลด Companion ZIP
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroChecklist
                title="Theme สำหรับหน้าบ้าน"
                description="โฮม, archive, comic detail และ reader"
              />
              <HeroChecklist
                title="Companion สำหรับระบบหลังบ้าน"
                description="API, sync, CPT/taxonomy, routing, cron"
              />
              <HeroChecklist
                title="Docs สำหรับติดตั้งและแก้ปัญหา"
                description="quick start, FAQ, troubleshooting"
              />
            </div>
          </div>

          <div className="grid gap-4 self-start">
            <Card className="border-emerald-400/20 bg-zinc-950/55 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">Architecture Preview</CardTitle>
                <CardDescription className="text-zinc-400">
                  ลำดับการทำงานตั้งแต่ API จนถึงหน้าอ่านบน WordPress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {architectureFlow.map((step, index) => (
                  <div key={step.title}>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                      <p className="text-sm font-medium text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{step.description}</p>
                    </div>
                    {index < architectureFlow.length - 1 ? (
                      <div className="flex justify-center py-2 text-emerald-300">
                        <ArrowRight className="h-4 w-4 rotate-90" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-950/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">URL ที่ผู้ใช้จะเห็น</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {routePatterns.map((pattern) => (
                  <code
                    key={pattern}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-emerald-200"
                  >
                    {pattern}
                  </code>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Required Toolkit"
          title="แพ็กเกจที่ต้องติดตั้งร่วมกันบน WordPress"
          description="หน้าใหม่นี้ทำให้ชัดเจนตั้งแต่แรกว่า integration นี้ไม่ใช่ปลั๊กอินตัวเดียวจบ แต่เป็นชุดเครื่องมือ 2 ส่วนที่เสริมกัน"
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {toolkitPackages.map((pkg) => {
            const Icon = packageIconMap[pkg.id];
            return (
              <Card
                key={pkg.id}
                className="overflow-hidden border-border/70 bg-card/80 shadow-lg shadow-black/10"
              >
                <CardHeader className="space-y-4 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="w-fit border-border/80 bg-background/70 text-muted-foreground">
                          {pkg.shortLabel}
                        </Badge>
                        <CardTitle className="text-xl text-foreground">{pkg.name}</CardTitle>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-secondary/60 px-3 py-2 text-right text-sm">
                      <p className="font-medium text-foreground">ZIP {pkg.packageVersion}</p>
                      {pkg.sourceVersion ? (
                        <p className="text-xs text-muted-foreground">source header {pkg.sourceVersion}</p>
                      ) : null}
                    </div>
                  </div>
                  <CardDescription className="text-sm leading-7 text-muted-foreground">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoPill title="บทบาท" value={pkg.role} />
                    <InfoPill title="ลำดับติดตั้ง" value={pkg.installOrder} />
                  </div>

                  <div className="space-y-3">
                    {pkg.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-full">
                      <a href={pkg.href} download>
                        ดาวน์โหลด ZIP
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/admin/wp-plugin/docs#${pkg.id === "theme" ? "theme-behavior" : "configuration"}`}>
                        อ่านคู่มือส่วนนี้
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        {roleCards.map((card) => (
          <Card key={card.title} className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-xl">{card.title}</CardTitle>
              <CardDescription className="leading-7">{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {card.items.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card className="border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.09),rgba(17,24,39,0.5))]">
          <CardHeader>
            <CardTitle className="text-xl">ภาพรวมการไหลของข้อมูล</CardTitle>
            <CardDescription className="leading-7">
              ใช้สำหรับอธิบายกับทีม, ลูกค้า หรือผู้ดูแล WordPress ว่าระบบแต่ละชั้นทำอะไร
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ArchitectureLine
              icon={Settings2}
              title="Settings & Test"
              description="กรอก API Base URL และ API Key แล้วทดสอบการเชื่อมต่อ"
            />
            <ArchitectureLine
              icon={Database}
              title="Sync to WordPress"
              description="ข้อมูลถูก sync เข้า CPT และ taxonomy เพื่อใช้งานใน WordPress"
            />
            <ArchitectureLine
              icon={Monitor}
              title="Render Reader UX"
              description="Theme รับช่วงต่อเพื่อแสดงหน้าโฮม, รายละเอียดเรื่อง และ chapter reader"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Quick Start"
          title="ลำดับตั้งค่าที่ควรทำทันทีหลังติดตั้ง"
          description="จัดลำดับให้ user รู้ว่าต้องทำอะไรก่อนหลัง และลดจุดที่พลาดบ่อยที่สุด เช่นการลืม save permalinks"
        />
        <div className="grid gap-4 lg:grid-cols-5">
          {quickSetupSteps.map((step, index) => (
            <Card key={step.title} className="border-border/70 bg-card/80">
              <CardHeader className="pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-semibold text-emerald-300">
                  0{index + 1}
                </div>
                <CardTitle className="text-lg leading-snug">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-7 text-muted-foreground">{step.description}</p>
                <Separator className="bg-border/80" />
                <p className="text-sm text-foreground/90">{step.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Feature Overview"
          title="ความสามารถที่สะท้อนจาก source code ปัจจุบัน"
          description="ทุกหัวข้อด้านล่างยึดจากความสามารถที่มีจริงใน repo นี้ และไม่เติม feature ที่ไม่มีในระบบ"
        />
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = featureIconMap[index] ?? Shield;
            return (
              <Card key={card.title} className="border-border/70 bg-card/80">
                <CardHeader className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-secondary/80 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="leading-7">{card.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {card.items.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-xl">Requirements และ Compatibility</CardTitle>
            <CardDescription className="leading-7">
              สิ่งที่ต้องมีเพื่อให้ toolkit ชุดนี้ทำงานครบทั้ง settings, sync และ reader routes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirements.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-50">
              <p className="font-medium text-amber-100">หมายเหตุเวอร์ชัน</p>
              <p className="mt-1 text-amber-50/90">{versionNote}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-xl">เหมาะกับใคร</CardTitle>
            <CardDescription className="leading-7">
              ใช้สื่อสาร expectation ของระบบก่อนเริ่มติดตั้งหรือส่งมอบงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {useCases.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[28px] border border-border/80 bg-[linear-gradient(135deg,rgba(20,24,31,0.98),rgba(9,14,12,0.98))] p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
              Docs Experience
            </Badge>
            <h3 className="text-2xl font-semibold text-white">ต้องการคู่มือติดตั้ง, FAQ และวิธีแก้ปัญหาแบบครบหน้าเดียว</h3>
            <p className="max-w-2xl text-sm leading-7 text-zinc-300">
              เปิดหน้า Docs เพื่อดู system overview, installation guide, configuration guide,
              sync guide, URL routing, theme behavior, FAQ และ troubleshooting โดยไม่ต้องไปค้นใน source code เองทีละไฟล์
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full bg-emerald-400 px-6 text-zinc-950 hover:bg-emerald-300">
              <Link href="/admin/wp-plugin/docs">
                ไปที่ Docs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroChecklist({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/55 p-4 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-emerald-400/10 p-1 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">{eyebrow}</p>
      <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function InfoPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm leading-7 text-foreground">{value}</p>
    </div>
  );
}

function ArchitectureLine({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
