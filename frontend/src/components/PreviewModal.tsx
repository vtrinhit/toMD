import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app";
import { converterApi } from "@/lib/api";
import { Loader2, Copy, Check, Download } from "lucide-react";

export function PreviewModal() {
  const { previewJobId, setPreviewJobId, jobs } = useAppStore();
  const [copied, setCopied] = useState(false);

  const job = jobs.find((j) => j.id === previewJobId);

  const { data: preview, isLoading } = useQuery({
    queryKey: ["preview", previewJobId],
    queryFn: () => converterApi.previewResult(previewJobId!),
    enabled: !!previewJobId && job?.status === "completed",
  });

  const handleCopy = async () => {
    if (preview?.content) {
      await navigator.clipboard.writeText(preview.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!previewJobId) return;
    try {
      const blob = await converterApi.downloadResult(previewJobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${job?.file_info.name.replace(/\.[^.]+$/, "")}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <Dialog open={!!previewJobId} onOpenChange={() => setPreviewJobId(null)}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Preview: {job?.file_info.name}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            {preview?.truncated && (
              <span className="text-yellow-600 dark:text-yellow-400">
                Preview truncated. Download for full content.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 rounded-lg border bg-muted/30 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {preview?.content || ""}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
