"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileCode, ExternalLink } from "lucide-react";

export default function WPPluginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">WordPress Plugin</h2>
        <p className="text-sm text-muted-foreground">
          Download and install the WordPress plugin to integrate with your site.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Comic Storage API Plugin</CardTitle>
              <CardDescription className="text-muted-foreground">v1.2.0</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            This plugin connects your WordPress site to the Comic Storage API.
            It provides shortcodes and Elementor widgets for comics, chapters, readers, categories, tags, authors, series, and search.
            It also supports syncing categories and tags with Unicode slug and UUID support.
          </p>

          <div className="rounded-lg border border-border bg-secondary p-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Available Shortcodes</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">[comic_list]</code>
                {" "}- Display a grid of comics. Supports: category, tag, series, search, page_size
              </li>
              <li>
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">[comic_detail slug="..."]</code>
                {" "}- Display a single comic with chapters
              </li>
              <li>
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">[chapter_reader id="..."]</code>
                {" "}- Vertical chapter reader with page images
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-secondary p-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Installation</h4>
            <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>1. Download the plugin file below</li>
              <li>2. In WordPress, go to Plugins &gt; Add New &gt; Upload Plugin</li>
              <li>3. Upload the .php file and activate</li>
              <li>4. Go to Settings &gt; Comic Storage API</li>
              <li>5. Enter your API Base URL and API Key</li>
              <li>6. Optionally sync categories/tags</li>
            </ol>
          </div>

          <Button asChild className="w-fit">
            <a href="/wp-plugin/comic-storage-api.php" download>
              <Download className="mr-2 h-4 w-4" />
              Download Plugin
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
