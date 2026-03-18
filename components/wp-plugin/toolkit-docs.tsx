import type { ReactNode } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  KeyRound,
  Link2,
  type LucideIcon,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  architectureFlow,
  docsNavigation,
  faqItems,
  quickSetupSteps,
  requirements,
  routePatterns,
  toolkitPackages,
  troubleshootingItems,
  versionNote,
} from "@/components/wp-plugin/content";

export function WordPressToolkitDocs() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_30%),linear-gradient(135deg,rgba(12,18,16,0.98),rgba(15,18,24,0.98))] p-6 shadow-xl shadow-black/20 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="w-fit border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200 hover:bg-emerald-400/10">
              Docs
            </Badge>
            <h2 className="text-3xl font-semibold leading-tight text-white">
              คู่มือใช้งาน WordPress Toolkit สำหรับ Comic Reader
            </h2>
            <p className="text-sm leading-7 text-zinc-300 lg:text-base">
              เอกสารหน้านี้ออกแบบให้ผู้ดูแลระบบ WordPress ใช้งานได้จริงทันที ครอบคลุมภาพรวมระบบ,
              installation guide, configuration, sync, routing, FAQ และ troubleshooting โดยยึดตาม source code ใน repo นี้
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full border-zinc-700 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900">
              <Link href="/admin/wp-plugin">
                <ArrowLeft className="h-4 w-4" />
                กลับหน้า Plugin
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300">
              <a href={toolkitPackages[1].href} download>
                ดาวน์โหลด Companion ZIP
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">สารบัญ</CardTitle>
              <CardDescription>กระโดดไปยังหัวข้อที่ต้องการได้ทันที</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {docsNavigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-secondary/60 hover:text-foreground"
                >
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">{item.summary}</p>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">ดาวน์โหลดไฟล์ที่ต้องใช้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {toolkitPackages.map((pkg) => (
                <Button
                  key={pkg.id}
                  asChild
                  variant="outline"
                  className="h-auto w-full justify-between rounded-2xl border-border/80 bg-background/60 px-4 py-3 text-left"
                >
                  <a href={pkg.href} download>
                    <span>
                      <span className="block text-sm font-medium">{pkg.name}</span>
                      <span className="block text-xs text-muted-foreground">ZIP {pkg.packageVersion}</span>
                    </span>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <DocsSection
            id="overview"
            title="Overview"
            description="ภาพรวมพื้นฐานของระบบก่อนเริ่มติดตั้ง"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">ระบบนี้ทำอะไร</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                  <p>
                    ระบบนี้เชื่อม WordPress เข้ากับ Comic Storage API เพื่อให้ข้อมูลคอมมิค,
                    ตอน, หมวดหมู่ และ metadata ถูก sync เข้ามาใน WordPress แล้วแสดงผลผ่าน theme
                    ที่ออกแบบมาสำหรับ reader UX โดยเฉพาะ
                  </p>
                  <p>
                    Companion Plugin เป็นตัวเชื่อมระบบหลังบ้าน ส่วน Comic Reader Theme
                    รับผิดชอบประสบการณ์ฝั่งผู้ใช้ปลายทาง เช่นหน้าโฮม, archive, comic detail และ chapter reader
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Theme กับ Plugin ต่างกันอย่างไร</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <RoleLine
                    icon={BookOpen}
                    title="Theme"
                    description="ดูแล UX/UI ฝั่งหน้าบ้านและหน้าอ่านคอมมิค"
                  />
                  <RoleLine
                    icon={Settings2}
                    title="Companion Plugin"
                    description="ดูแลการเชื่อม API, sync, route, cache, cron และเครื่องมือแอดมิน"
                  />
                </CardContent>
              </Card>
            </div>

            <Callout tone="warn" title="หมายเหตุเวอร์ชัน">
              {versionNote}
            </Callout>
          </DocsSection>

          <DocsSection
            id="requirements"
            title="System Requirements"
            description="สิ่งที่ต้องมีและควรตรวจให้พร้อมก่อนติดตั้ง"
          >
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">ขั้นต่ำที่ระบบอ้างอิง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requirements.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">แพ็กเกจที่ใช้จริง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <InfoRow label="Theme package" value="Comic Reader Theme 1.0.1" />
                  <InfoRow label="Companion package" value="Comic Reader Companion 2.0.1" />
                  <InfoRow label="Theme source header" value="1.0.1" />
                  <InfoRow label="Companion source header" value="2.0.0" />
                </CardContent>
              </Card>
            </div>
          </DocsSection>

          <DocsSection
            id="architecture"
            title="System Architecture"
            description="ลำดับการทำงานของข้อมูลและองค์ประกอบหลักใน WordPress"
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Data Flow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {architectureFlow.map((item, index) => (
                    <div key={item.title}>
                      <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                      {index < architectureFlow.length - 1 ? (
                        <div className="flex justify-center py-2 text-emerald-400">
                          <ArrowRight className="h-4 w-4 rotate-90" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">WordPress Objects ที่ Companion สร้าง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Custom Post Types</p>
                    <div className="mt-2 grid gap-2">
                      <CodeLine value="crc_comic" />
                      <CodeLine value="crc_chapter" />
                    </div>
                  </div>
                  <Separator className="bg-border/80" />
                  <div>
                    <p className="font-medium text-foreground">Taxonomies</p>
                    <div className="mt-2 grid gap-2">
                      <CodeLine value="crc_category" />
                      <CodeLine value="crc_genre" />
                      <CodeLine value="crc_series" />
                      <CodeLine value="crc_author" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DocsSection>

          <DocsSection
            id="installation"
            title="Installation Guide"
            description="ลำดับติดตั้งที่แนะนำเพื่อลดจุดพลาด"
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
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
                    <p className="text-sm text-foreground/90">{step.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Callout tone="info" title="ลำดับที่แนะนำ">
              ติดตั้ง Theme และ Companion ให้ครบก่อนเริ่มตั้งค่า API เพื่อให้คุณตรวจหน้า archive,
              comic และ reader ได้ทันทีหลัง sync สำเร็จ
            </Callout>
          </DocsSection>

          <DocsSection
            id="configuration"
            title="Configuration Guide"
            description="การตั้งค่าหลักในหน้า Comic Reader Settings"
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">ตั้งค่าอะไรบ้าง</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <ConfigLine
                    icon={Server}
                    title="API Base URL"
                    description="ใส่โดเมนหลักของ API เช่น https://your-api.vercel.app โดยไม่ต้องต่อ /api/public"
                  />
                  <ConfigLine
                    icon={KeyRound}
                    title="API Key"
                    description="ใช้สำหรับส่งผ่าน header X-API-Key จาก WordPress server ไปยัง API"
                  />
                  <ConfigLine
                    icon={RefreshCw}
                    title="Cache TTL / Flush Cache"
                    description="กำหนดอายุ transient cache และล้าง cache ได้จากหน้า settings"
                  />
                  <ConfigLine
                    icon={Link2}
                    title="Slug Base"
                    description="กำหนดฐาน URL เช่น comics และต้อง Save permalinks หลังเปลี่ยนค่า"
                  />
                  <ConfigLine
                    icon={Wrench}
                    title="Log Errors / Test Connection"
                    description="เปิดเก็บ error log ได้ และมี AJAX Test Connection ตรวจ connection ก่อนบันทึกจริง"
                  />
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">ค่าที่ควรใช้เป็นจุดเริ่มต้น</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock
                    label="Base URL"
                    code={`https://your-api.example.com`}
                  />
                  <CodeBlock
                    label="Connection test endpoint"
                    code={`/api/public/comics?page=1&pageSize=1`}
                  />
                  <CodeBlock
                    label="Header"
                    code={`X-API-Key: <your-api-key>`}
                  />
                  <CodeBlock
                    label="Slug Base Example"
                    code={`/comics/{comic-slug}/ep-{number}/`}
                  />
                </CardContent>
              </Card>
            </div>

            <Callout tone="success" title="Checklist หลังตั้งค่า">
              กรอก URL และ API Key, กด Test Connection, บันทึกค่า, ตั้ง Slug Base,
              แล้วไปกด Save ที่ Settings &gt; Permalinks อีกครั้ง
            </Callout>
          </DocsSection>

          <DocsSection
            id="sync"
            title="Sync Guide"
            description="การ sync ข้อมูลจาก API เข้า WordPress และวิธีเลือกใช้แต่ละโหมด"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Incremental Sync</CardTitle>
                  <CardDescription>เหมาะกับการอัปเดตระหว่างวัน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>ระบบจะ sync taxonomy ก่อน แล้วดึงคอมมิคที่อัปเดตล่าสุด 2 หน้า หน้า ละ 50 รายการ</p>
                  <p>โหมดนี้ไม่ sync chapters เพื่อลด API cost และเร่งเวลาในการ refresh ข้อมูล</p>
                  <p>schedule ปกติคือทุก 10 นาที</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Full Sync</CardTitle>
                  <CardDescription>ใช้เมื่อเริ่มระบบหรือข้อมูลไม่ตรงกัน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>ระบบจะ page ผ่านคอมมิคทั้งหมดและ sync chapters ของแต่ละเรื่องด้วย</p>
                  <p>มีตารางรันรายวัน และใช้เวลานานกว่ามากเมื่อเทียบกับ Incremental</p>
                  <p>เหมาะกับการแก้ปัญหาข้อมูลขาดหรือหลัง migration/import ชุดใหญ่</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <MiniStat title="Incremental Schedule" value="ทุก 10 นาที" />
              <MiniStat title="Full Sync Schedule" value="รายวัน" />
              <MiniStat title="Utilities" value="Flush Cache / Clear Error Log / Reschedule Cron" />
            </div>
          </DocsSection>

          <DocsSection
            id="routing"
            title="URL Structure / Routing"
            description="รูปแบบ URL และวิธีที่ Companion จับ route ให้กับหน้าแต่ละประเภท"
          >
            <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Route Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {routePatterns.map((pattern) => (
                    <CodeLine key={pattern} value={pattern} />
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">Behavior สำคัญ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>archive route จะดึงรายการคอมมิคพร้อม search และ status filter จาก API</p>
                  <p>comic detail route จะโหลดข้อมูลเรื่องและ chapter list ก่อน render template</p>
                  <p>chapter route จะดึงข้อมูล chapter ตามเลขตอนและ enrich prev/next number เพื่อสร้างลิงก์นำทาง</p>
                  <p>one-shot comic จะ redirect ไป chapter แรกอัตโนมัติถ้าระบบหาเลขตอนเริ่มต้นเจอ</p>
                </CardContent>
              </Card>
            </div>

            <Callout tone="info" title="Template Priority">
              ระบบจะมองหา template override ใน active theme ภายใต้โฟลเดอร์ <code>comic-reader/</code>{" "}
              ก่อน แล้วค่อย fallback ไปใช้ template ของ Companion Plugin
            </Callout>
          </DocsSection>

          <DocsSection
            id="theme-behavior"
            title="Theme Behavior"
            description="สิ่งที่ Theme แสดงผลให้ผู้ใช้เห็นบนหน้าเว็บ"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">หน้าโฮมและหน้ารายการ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>front page มี hero section และแถวคอมมิคแบบ horizontal rows</p>
                  <p>sections หลักคือ มาใหม่, ยอดนิยม, ongoing และ completed</p>
                  <p>archive page มี search, status filter และ pagination</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">หน้าเรื่องและหน้าอ่าน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>single comic page แสดง metadata, description, chapter list และ related items ใน series</p>
                  <p>chapter reader มี sticky navigation, prev/next chapter links และโหมด scroll/paged</p>
                  <p>reader ถูกออกแบบให้ใช้งานได้บนมือถือและเดสก์ท็อป โดยเน้นการอ่านต่อเนื่อง</p>
                </CardContent>
              </Card>
            </div>
          </DocsSection>

          <DocsSection
            id="faq"
            title="FAQ"
            description="คำถามที่พบบ่อยจากมุมของผู้ติดตั้งและผู้ดูแลระบบ"
          >
            <Card className="border-border/70 bg-card/80">
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item) => (
                    <AccordionItem key={item.question} value={item.question}>
                      <AccordionTrigger className="text-left text-base hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {item.answer.map((paragraph) => (
                          <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                            {paragraph}
                          </p>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </DocsSection>

          <DocsSection
            id="troubleshooting"
            title="Troubleshooting"
            description="อาการเสียที่พบบ่อยและแนวทางแก้ไขแบบเป็นขั้นตอน"
          >
            <div className="grid gap-4">
              {troubleshootingItems.map((item) => (
                <Card key={item.question} className="border-border/70 bg-card/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-300" />
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DocsSection>

          <DocsSection
            id="maintenance"
            title="Maintenance / Best Practices"
            description="แนวทางดูแลระบบหลังเริ่มใช้งานจริง"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">สิ่งที่ควรทำเป็นประจำ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>ตรวจสถานะการเชื่อมต่อและ sync dashboard เป็นระยะ โดยเฉพาะหลังเปลี่ยน API หรือย้ายเซิร์ฟเวอร์</p>
                  <p>ใช้ Incremental Sync สำหรับการดูแลระหว่างวัน และเก็บ Full Sync ไว้สำหรับงานแก้ปัญหาหรือ sync รอบใหญ่</p>
                  <p>หลังเปลี่ยน Slug Base หรือโครงสร้าง route ให้ Save permalinks ทุกครั้ง</p>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-xl">เมื่อพบความผิดปกติ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>เริ่มจาก Test Connection แล้วค่อยไล่ดู cache, sync status และ error log</p>
                  <p>ถ้าหน้าแสดงผลยังเก่า ให้ Flush Cache ก่อนรัน Full Sync ซ้ำโดยไม่จำเป็น</p>
                  <p>ถ้า cron เงียบผิดปกติ ให้ตรวจ traffic/cron runner และใช้ Reschedule Cron จาก dashboard</p>
                </CardContent>
              </Card>
            </div>
          </DocsSection>
        </div>
      </div>
    </div>
  );
}

function DocsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function RoleLine({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ConfigLine({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 text-emerald-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CodeLine({ value }: { value: string }) {
  return (
    <code className="block rounded-xl border border-border/80 bg-secondary/40 px-3 py-2 text-xs text-emerald-200">
      {value}
    </code>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <code className="mt-3 block whitespace-pre-wrap rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-xs text-emerald-200">
        {code}
      </code>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warn" | "success";
  title: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-50"
      : tone === "success"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-50"
        : "border-sky-500/20 bg-sky-500/10 text-sky-50";

  const titleClass =
    tone === "warn"
      ? "text-amber-100"
      : tone === "success"
        ? "text-emerald-100"
        : "text-sky-100";

  return (
    <div className={`rounded-2xl border p-4 text-sm leading-7 ${toneClass}`}>
      <p className={`font-medium ${titleClass}`}>{title}</p>
      <div className="mt-1 text-current/90">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-secondary/30 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="space-y-2 pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
