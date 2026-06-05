export type ToolkitPackage = {
  id: "theme" | "companion";
  name: string;
  shortLabel: string;
  packageVersion: string;
  sourceVersion?: string;
  href: string;
  installOrder: string;
  role: string;
  description: string;
  highlights: string[];
};

export type ThemeDownload = {
  id: "manga-theme" | "miku-doujin-theme";
  name: string;
  shortLabel: string;
  packageVersion: string;
  sourceVersion?: string;
  href: string;
  previewSrc: string;
  previewAlt: string;
  inspiredBy: string;
  recommendedFor: string;
  installOrder: string;
  role: string;
  description: string;
  highlights: string[];
};

export type ContentCard = {
  title: string;
  description: string;
  items: string[];
};

export type SetupStep = {
  title: string;
  description: string;
  detail: string;
};

export type DocsNavItem = {
  id:
    | "overview"
    | "requirements"
    | "architecture"
    | "installation"
    | "configuration"
    | "sync"
    | "routing"
    | "theme-behavior"
    | "faq"
    | "troubleshooting"
    | "maintenance";
  label: string;
  summary: string;
};

export type QAItem = {
  question: string;
  answer: string[];
};

export const toolkitPackages: ToolkitPackage[] = [
  {
    id: "theme",
    name: "Theme Library",
    shortLabel: "เลือก 1 Theme ให้ตรงกับแนวเว็บ",
    packageVersion: "2 themes",
    href: "#theme-downloads",
    installOrder: "เลือก 1 ตัวก่อน แล้วค่อยติดตั้งคู่กับ Companion Plugin",
    role: "รวมชุดธีมหน้าบ้านสำหรับ WordPress เพื่อให้เลือก layout ที่ตรงกับเว็บ Manga หรือ Doujin โดยยังใช้ระบบ sync/routing ชุดเดียวกัน",
    description:
      "ชุดธีมที่ออกแบบมาสำหรับ Comic Storage API บน WordPress โดยแยกแพ็กเกจดาวน์โหลดตามแนวเว็บที่ต้องการ เช่น manga portal หรือ doujin catalog พร้อมภาพพรีวิวให้เลือกจากหน้าแอดมินได้ทันที",
    highlights: [
      "มีทั้ง Manga-theme และ Miku Doujin Theme ให้เลือกตามสไตล์เว็บ",
      "แต่ละธีมมี ZIP แยกของตัวเองและใช้ Companion ร่วมกันได้",
      "ธีมทุกตัวออกแบบให้ทำงานกับ rewrite/template ของ Companion และ Content Scope",
      "หน้าแอดมินแสดงภาพพรีวิวเพื่อช่วยตัดสินใจก่อนดาวน์โหลด",
    ],
  },
  {
    id: "companion",
    name: "Comic Reader Companion",
    shortLabel: "Companion Plugin สำหรับเชื่อม API และ Sync ข้อมูล",
    packageVersion: "2.1.2",
    sourceVersion: "2.1.2",
    href: "/downloads/comic-reader-companion-2.1.2.zip",
    installOrder: "ติดตั้งและตั้งค่าหลังเปิดใช้ Theme",
    role: "เชื่อม Comic Storage API เข้ากับ WordPress, sync ข้อมูล และจัดการ routing/admin tools",
    description:
      "ปลั๊กอินที่ดูแลงาน backend integration ทั้งการตั้งค่า API Base URL, API Key, sync ข้อมูลเข้า CPT/taxonomy, rewrite routes, caching และ cron dashboard",
    highlights: [
      "Settings: API Base URL, API Key, Content Scope, Cache TTL, Slug Base, Log Errors",
      "AJAX Test Connection และ Flush Cache",
      "Incremental Sync ทุก 10 นาที และ Full Sync รายวัน",
      "แยกเว็บ Manga-only หรือ Doujin-only ได้จาก Content Scope + API Key scope",
      "แจ้งเตือนเมื่อ scope ไม่ตรงกันจน Full Sync ได้ 0 รายการ",
      "สร้าง crc_comic, crc_chapter และ taxonomy ที่เกี่ยวข้อง",
    ],
  },
];

export const themeDownloads: ThemeDownload[] = [
  {
    id: "manga-theme",
    name: "Manga-theme",
    shortLabel: "Manga Portal",
    packageVersion: "1.0.0",
    sourceVersion: "1.0.0",
    href: "/downloads/manga-theme-1.0.0.zip",
    previewSrc: "/theme-previews/manga-theme-preview.svg",
    previewAlt: "Preview card for Manga-theme showing a manga portal style homepage",
    inspiredBy: "Inspired by niceoppai.net",
    recommendedFor: "เหมาะกับเว็บ Manga-only หรือเว็บอ่านมังงะที่ต้องการหน้าโฮมแบบ portal + chapter feed",
    installOrder: "ติดตั้งเป็น theme หลักก่อนเปิดใช้ Companion Plugin",
    role: "ควบคุม UX/UI ของหน้าโฮม, archive, comic detail และ chapter reader ในทรงเว็บมังงะแบบ tabbed portal + chapter feed",
    description:
      "ธีมฝั่งหน้าบ้านสำหรับ WordPress ที่อ้างอิงภาพรวมจาก niceoppai.net โดยเน้น top navigation แบบแท็บ, featured manga cards, รายการอัปเดตแต่ละตอน และ detail page สไตล์ manga portal คลาสสิก",
    highlights: [
      "Homepage แบบ featured strip + updated chapter feed + sidebar boxes",
      "Archive และ comic detail โทน light panel บน dark frame",
      "Chapter reader แบบ dark portal พร้อม top bar และ chapter navigation",
      "เหมาะกับการจับคู่กับ Content Scope แบบ Manga-only",
    ],
  },
  {
    id: "miku-doujin-theme",
    name: "Miku Doujin Theme",
    shortLabel: "Doujin Catalog",
    packageVersion: "1.0.0",
    sourceVersion: "1.0.0",
    href: "/downloads/miku-doujin-theme-1.0.0.zip",
    previewSrc: "/theme-previews/miku-doujin-theme-preview.svg",
    previewAlt: "Preview card for Miku Doujin Theme showing a doujin catalog style homepage",
    inspiredBy: "Inspired by miku-doujin.com",
    recommendedFor: "เหมาะกับเว็บ Doujin-only ที่ต้องการหน้าแคตตาล็อกเข้ม ๆ พร้อม taxonomy sidebar ชัดเจน",
    installOrder: "ติดตั้งเป็น theme หลักก่อนเปิดใช้ Companion Plugin",
    role: "ควบคุม UX/UI ของหน้าโฮม, archive, comic detail และ chapter reader ในโทน doujin catalog แบบ dark shelf + taxonomy pills",
    description:
      "ธีมฝั่งหน้าบ้านสำหรับ WordPress ที่อ้างอิงภาพรวมจาก miku-doujin.com โดยเน้น top bar เข้ม, card rail, taxonomy sidebar และหน้า reader ที่ให้ความรู้สึกเว็บ doujin แบบแน่นตา",
    highlights: [
      "Homepage แบบ dark showcase พร้อม card rail และ section title แนว catalog",
      "Archive / comic detail แบบ main + sidebar พร้อม taxonomy pills",
      "Chapter reader โทนมืดสำหรับเว็บ doujin โดยเฉพาะ",
      "เหมาะกับการจับคู่กับ Content Scope แบบ Doujin-only",
    ],
  },
];

export const quickSetupSteps: SetupStep[] = [
  {
    title: "เลือก Theme 1 ตัว แล้วติดตั้งคู่กับ Companion",
    description:
      "ดาวน์โหลด theme ที่ตรงกับแนวเว็บของคุณ จากนั้นอัปโหลดและเปิดใช้พร้อม Comic Reader Companion",
    detail:
      "Theme จัดการ UX ฝั่งผู้ชม ส่วน Companion เป็นตัวเชื่อม API, routing และระบบ sync",
  },
  {
    title: "กรอก API Base URL, API Key และ Content Scope",
    description:
      "ไปที่เมนู Comic Reader ใน WordPress แล้วใส่ค่าการเชื่อมต่อจาก Comic Storage API",
    detail:
      "คำขอทั้งหมดถูกยิงแบบ server-side ผ่าน header X-API-Key ไม่เปิด key ไปฝั่ง browser และสามารถบังคับ Manga-only/Doujin-only ได้ที่ระดับเว็บไซต์",
  },
  {
    title: "กด Test Connection ก่อนบันทึกจริง",
    description:
      "ใช้ปุ่ม AJAX Test Connection เพื่อตรวจว่าปลั๊กอินเข้าถึง /api/public ได้ถูกต้อง",
    detail:
      "ถ้าได้ 401/403 ให้ตรวจ API Key และถ้าได้ 404 ให้ตรวจ Base URL",
  },
  {
    title: "ตั้งค่า Slug Base และบันทึก Permalinks",
    description:
      "กำหนด URL base สำหรับเส้นทางคอมมิค เช่น /comics/ แล้วกด Save ที่ Settings > Permalinks",
    detail:
      "ขั้นตอนนี้จำเป็นเพื่อ flush rewrite rules หลังเปลี่ยน slug base",
  },
  {
    title: "เริ่ม Sync และตรวจหน้าเว็บจริง",
    description:
      "รัน Incremental Sync ก่อน จากนั้นใช้ Full Sync เมื่อจำเป็น และตรวจหน้า archive / comic / chapter reader",
    detail:
      "เมื่อข้อมูลเข้าครบแล้ว Theme จะดึง template ที่ตรงกับ route มาแสดงผลอัตโนมัติ",
  },
];

export const roleCards: ContentCard[] = [
  {
    title: "Theme รับผิดชอบอะไร",
    description:
      "ทุกอย่างที่ผู้ชมเห็นบนหน้าบ้านและหน้าการอ่านคอมมิค",
    items: [
      "หน้าโฮมแบบ hero พร้อม sections มาใหม่, ยอดนิยม, ongoing, completed",
      "archive page สำหรับ list/filter คอมมิค",
      "single comic page สำหรับข้อมูลเรื่องและรายการตอน",
      "chapter reader พร้อม scroll mode และ paged mode",
    ],
  },
  {
    title: "Companion รับผิดชอบอะไร",
    description:
      "ทุกอย่างที่ทำให้ WordPress คุยกับ Comic Storage API และมีข้อมูลพร้อมใช้",
    items: [
      "เก็บ API Base URL, API Key, Cache TTL, Slug Base, Log Errors",
      "Test Connection, Flush Cache และ Sync Dashboard",
      "sync ข้อมูลเข้า crc_comic, crc_chapter และ taxonomy หลัก",
      "กำหนด rewrite routes และโหลด template ที่เหมาะกับแต่ละ URL",
    ],
  },
];

export const featureCards: ContentCard[] = [
  {
    title: "Server-side API Integration",
    description:
      "ส่ง X-API-Key จาก WordPress ฝั่ง server เท่านั้น ลดความเสี่ยงจากการเปิดเผย key",
    items: [
      "ใช้ /api/public เป็น namespace หลัก",
      "รองรับ Test Connection ก่อน save",
      "ตอบโจทย์งานที่ต้องเชื่อมกับ API จริง",
    ],
  },
  {
    title: "Sync และ Cron พร้อมใช้",
    description:
      "มีทั้ง Incremental Sync สำหรับงานระหว่างวัน และ Full Sync สำหรับ sync เต็มระบบ",
    items: [
      "Incremental Sync ทุก 10 นาที",
      "Full Sync รายวัน",
      "มี Reschedule Cron และกัน sync ซ้อนกัน",
    ],
  },
  {
    title: "WordPress Data Model",
    description:
      "สร้าง data structure ใน WordPress ให้เหมาะกับการทำ frontend และการจัดการข้อมูล",
    items: [
      "CPT: crc_comic, crc_chapter",
      "Taxonomy: crc_category, crc_genre, crc_series, crc_author",
      "มี metadata สำหรับ external id, slug, status, chapter links",
    ],
  },
  {
    title: "Routing และ URL ที่ควบคุมได้",
    description:
      "กำหนด URL แบบอ่านง่ายและสอดคล้องกับประสบการณ์อ่านคอมมิค",
    items: [
      "/{base}/",
      "/{base}/{comic-slug}/",
      "/{base}/{comic-slug}/ep-{number}/",
    ],
  },
  {
    title: "Reader Experience",
    description:
      "ธีมถูกออกแบบมาเพื่อการอ่านต่อเนื่องและการสลับโหมดอ่านได้ชัดเจน",
    items: [
      "sticky chapter navigation",
      "scroll mode และ paged mode",
      "รองรับหน้า comic detail และ related content",
    ],
  },
  {
    title: "Operations และ Debug",
    description:
      "มีเครื่องมือดูสถานะและแก้ปัญหาในหน้าแอดมินโดยไม่ต้องเดา",
    items: [
      "สถานะการเชื่อมต่อและเวลาทดสอบล่าสุด",
      "Flush Cache และ Clear Error Log",
      "ดู sync status, counts และเวลารันล่าสุด",
    ],
  },
];

export const useCases = [
  "ทีมที่เก็บคอนเทนต์คอมมิคใน Comic Storage API แต่ต้องการใช้ WordPress เป็นหน้าบ้าน",
  "เว็บอ่านมังงะที่อยากได้ reader UX ชัดเจน พร้อม route ระดับตอนแบบ /ep-{number}/",
  "เว็บ Doujin-only ที่ต้องการแยกหน้าตาและการดาวน์โหลด theme ออกจากเว็บ Manga อย่างชัดเจน",
  "โปรเจ็กต์ที่ต้องการ sync ข้อมูลเข้า WordPress เพื่อใช้เมนู, SEO plugin และ editor workflow ร่วมกัน",
];

export const requirements = [
  "WordPress 6.0 ขึ้นไป",
  "PHP 8.1 ขึ้นไป",
  "ต้องมี API Base URL ที่เข้าถึงได้จาก WordPress server",
  "ต้องมี API Key สำหรับส่งผ่าน header X-API-Key",
  "ควรใช้ pretty permalinks และต้อง Save permalinks หลังเปลี่ยน Slug Base",
];

export const docsNavigation: DocsNavItem[] = [
  { id: "overview", label: "Overview", summary: "ภาพรวมการทำงานร่วมกันของ Theme และ Companion" },
  { id: "requirements", label: "System Requirements", summary: "เวอร์ชันและสิ่งที่ต้องเตรียมก่อนติดตั้ง" },
  { id: "architecture", label: "System Architecture", summary: "โครงสร้างข้อมูล, routing และชั้นการทำงานของระบบ" },
  { id: "installation", label: "Installation Guide", summary: "ลำดับการติดตั้ง Theme และ Plugin บน WordPress" },
  { id: "configuration", label: "Configuration Guide", summary: "การตั้งค่า API, slug, cache และการตรวจสอบการเชื่อมต่อ" },
  { id: "sync", label: "Sync Guide", summary: "Incremental Sync, Full Sync, cron และการตรวจข้อมูลหลัง sync" },
  { id: "routing", label: "URL Structure / Routing", summary: "รูปแบบ URL และ rewrite behavior ที่ระบบใช้" },
  { id: "theme-behavior", label: "Theme Behavior", summary: "หน้าโฮม, archive, comic detail และ chapter reader ทำงานอย่างไร" },
  { id: "faq", label: "FAQ", summary: "คำถามที่พบบ่อยเกี่ยวกับการใช้งานจริง" },
  { id: "troubleshooting", label: "Troubleshooting", summary: "อาการเสียหลักและแนวทางแก้ไขแบบเป็นขั้นตอน" },
  { id: "maintenance", label: "Maintenance", summary: "แนวทางดูแลระบบและ best practices หลังใช้งานจริง" },
];

export const faqItems: QAItem[] = [
  {
    question: "จำเป็นต้องติดตั้งทั้ง Theme และ Companion Plugin หรือไม่",
    answer: [
      "จำเป็นถ้าต้องการประสบการณ์เต็มระบบตามที่โปรเจ็กต์นี้ออกแบบไว้ เพราะ Theme ดูแลหน้าบ้าน ส่วน Companion ดูแลงานเชื่อม API, sync และ routing",
      "ถ้าเปิดใช้แค่ตัวใดตัวหนึ่ง ระบบจะทำงานไม่ครบ เช่นมี route แต่ไม่มีหน้าตา reader หรือมี theme แต่ไม่มีข้อมูล sync เข้ามา",
    ],
  },
  {
    question: "Incremental Sync กับ Full Sync ต่างกันอย่างไร",
    answer: [
      "Incremental Sync ดึงคอมมิคที่อัปเดตล่าสุดราว 100 รายการ เหมาะกับการรีเฟรชข้อมูลระหว่างวัน",
      "Full Sync จะไล่ sync คอมมิคทั้งหมด รวม chapters และ taxonomy เหมาะกับการตั้งค่าเริ่มต้นหรือหลังแก้ปัญหาข้อมูลไม่ตรงกัน",
    ],
  },
  {
    question: "ทำไม one-shot comic ถึง redirect เข้า chapter แรกทันที",
    answer: [
      "rewrite layer ของ Companion มี logic ให้ one-shot ไปหน้าอ่านตอนแรกอัตโนมัติ หากหาเลขตอนแรกเจอจาก chapter list หรือ latest chapter data",
      "พฤติกรรมนี้ช่วยลดขั้นตอนของผู้ใช้ที่ไม่จำเป็นต้องผ่านหน้ารายละเอียดเรื่องก่อน",
    ],
  },
  {
    question: "เมื่อไหร่ควรใช้ Flush Cache หรือ Reschedule Cron",
    answer: [
      "ใช้ Flush Cache เมื่อ API เปลี่ยนแล้วหน้า WordPress ยังแสดงข้อมูลเก่า หรือเพิ่งแก้การตั้งค่าแล้วต้องการบังคับดึงข้อมูลใหม่",
      "ใช้ Reschedule Cron เมื่อต้องการตั้ง event ใหม่หลังมีความผิดปกติของตารางเวลา sync หรือเพิ่งแก้ configuration สำคัญ",
    ],
  },
  {
    question: "API Key ถูกส่งไปฝั่ง browser หรือไม่",
    answer: [
      "ไม่ ระบบนี้ส่ง API Key ผ่านฝั่ง WordPress server โดยใส่ใน header X-API-Key ของคำขอไปยัง Comic Storage API",
      "หน้าเว็บฝั่งผู้ชมไม่ได้รับ key นี้โดยตรง",
    ],
  },
];

export const troubleshootingItems: QAItem[] = [
  {
    question: "เชื่อม API ไม่ได้ หรือ Test Connection ไม่ผ่าน",
    answer: [
      "ตรวจว่า API Base URL ไม่มี path ซ้ำ เช่นไม่ต้องใส่ /api/public ต่อท้าย เพราะ plugin จะเติมให้เอง",
      "ถ้าได้ HTTP 401 หรือ 403 ให้ตรวจ API Key",
      "ถ้าได้ HTTP 404 ให้ตรวจว่า Base URL ชี้ไปโดเมนหรือแอปที่ถูกต้อง",
    ],
  },
  {
    question: "เปลี่ยน Slug Base แล้วหน้า /comics/ หรือ /ep-{number}/ ใช้งานไม่ได้",
    answer: [
      "ไปที่ Settings > Permalinks แล้วกด Save อีกครั้งเพื่อ flush rewrite rules",
      "ตรวจว่าค่า Slug Base ใหม่ไม่ชนกับ page หรือ route อื่นใน WordPress",
    ],
  },
  {
    question: "Sync แล้วข้อมูลไม่มา หรือไม่เห็น comic/chapter ใน WordPress",
    answer: [
      "เริ่มจากรัน Incremental Sync แล้วตรวจ counts ใน Sync Dashboard",
      "ถ้ายังไม่มา ให้ลอง Full Sync และดู error log หากเปิด Log Errors ไว้",
      "ถ้า Test Connection ผ่านแต่ Full Sync ได้ 0 รายการ ให้ตรวจ Content Scope ใน WordPress และ API key scope ใน Comic Storage API ว่าตรงกัน",
      "ตรวจว่าฝั่ง API มีข้อมูลใน /comics และ endpoint ที่เกี่ยวข้องจริง",
    ],
  },
  {
    question: "Cron ดูเหมือนไม่ทำงาน",
    answer: [
      "WordPress cron ต้องอาศัย traffic หรือ cron runner ภายนอกเพื่อกระตุ้น event",
      "ตรวจเวลารันล่าสุดและ next scheduled ใน Sync Dashboard จากนั้นใช้ Reschedule Cron ถ้าตารางเวลาผิดปกติ",
    ],
  },
  {
    question: "เปิดใช้ Theme แล้ว reader หรือหน้ารายละเอียดไม่ตรงคาด",
    answer: [
      "ตรวจว่า Companion Plugin เปิดใช้งานอยู่ เพราะ routing และ template data มาจาก plugin นี้",
      "ตรวจว่าข้อมูล comic/chapter sync เข้ามาแล้ว และ route base ตรงกับค่าที่ตั้งไว้",
      "ถ้า chapter image ไม่ขึ้น ให้ตรวจข้อมูล images ของ chapter จาก API และลอง Flush Cache",
    ],
  },
];

export const architectureFlow = [
  {
    title: "Comic Storage API",
    description:
      "แหล่งข้อมูลหลักของ comics, chapters, categories, tags และ metadata",
  },
  {
    title: "Companion Plugin",
    description:
      "จัดการ connection, cache, sync, CPT/taxonomy, rewrite และ admin tools",
  },
  {
    title: "WordPress Data Layer",
    description:
      "เก็บ crc_comic, crc_chapter และ taxonomy ที่พร้อมใช้งานใน WP ecosystem",
  },
  {
    title: "Comic Reader Theme",
    description:
      "แสดงผลหน้าโฮม, archive, comic detail และ chapter reader ตาม route ที่ plugin กำหนด",
  },
];

export const routePatterns = [
  "/{base}/",
  "/{base}/{comic-slug}/",
  "/{base}/{comic-slug}/ep-{number}/",
];

export const versionNote =
  "รีลีสนี้ใช้ Companion 2.1.2 ร่วมกับ Theme Library ที่มีทั้ง Manga-theme 1.0.0 และ Miku Doujin Theme 1.0.0 โดยรองรับ Content Scope สำหรับเว็บ Manga-only/Doujin-only เพิ่ม warning เมื่อ sync ได้ 0 รายการเพราะ scope ไม่ตรงกัน และเพิ่มคิว sync กลางเพื่อจำกัดพร้อมกันสูงสุด 20 เว็บไซต์";
