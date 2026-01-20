import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Eye,
  Trash2,
  Clock,
  FileText,
  CheckSquare,
  Square,
  PackageOpen,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/stores/app";
import { converterApi } from "@/lib/api";
import { formatBytes, formatDuration } from "@/lib/utils";
import type { ConversionJob, ConversionStatus } from "@/types";

const converterColors: Record<string, string> = {
  markitdown: "bg-blue-500",
  docling: "bg-purple-500",
  marker: "bg-green-500",
  pypandoc: "bg-orange-500",
  unstructured: "bg-pink-500",
  mammoth: "bg-yellow-500",
  html2text: "bg-cyan-500",
  auto: "bg-gray-500",
};

const statusIcons: Record<ConversionStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5 text-muted-foreground" />,
  processing: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-destructive" />,
};

export function JobList() {
  const { jobs, setJobs, removeJob, setPreviewJobId } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch jobs periodically
  const { data: fetchedJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: converterApi.getJobs,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (fetchedJobs) {
      setJobs(fetchedJobs);
    }
  }, [fetchedJobs, setJobs]);

  // Clean up selected IDs when jobs change
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(jobs.map((j) => j.id));
      const newSelected = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) newSelected.add(id);
      });
      return newSelected;
    });
  }, [jobs]);

  const completedJobs = jobs.filter((j) => j.status === "completed");
  const selectedJobs = jobs.filter((j) => selectedIds.has(j.id));
  const selectedCompletedJobs = selectedJobs.filter((j) => j.status === "completed");

  const toggleSelect = (jobId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(jobs.map((j) => j.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const selectAllCompleted = () => {
    setSelectedIds(new Set(completedJobs.map((j) => j.id)));
  };

  const handleDownload = async (job: ConversionJob) => {
    try {
      const blob = await converterApi.downloadResult(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${job.file_info.name.replace(/\.[^.]+$/, "")}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedCompletedJobs.length === 0) return;

    setIsDownloading(true);
    try {
      if (selectedCompletedJobs.length === 1) {
        // Single file download
        await handleDownload(selectedCompletedJobs[0]);
      } else {
        // Multiple files - download as ZIP
        const blob = await converterApi.downloadMultiple(
          selectedCompletedJobs.map((j) => j.id)
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tomd-export-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (completedJobs.length === 0) return;

    setIsDownloading(true);
    try {
      if (completedJobs.length === 1) {
        await handleDownload(completedJobs[0]);
      } else {
        const blob = await converterApi.downloadMultiple(
          completedJobs.map((j) => j.id)
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tomd-export-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await converterApi.deleteJob(jobId);
      removeJob(jobId);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => converterApi.deleteJob(id))
      );
      selectedIds.forEach((id) => removeJob(id));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (jobs.length === 0) return;

    setIsDeleting(true);
    try {
      await Promise.all(jobs.map((j) => converterApi.deleteJob(j.id)));
      jobs.forEach((j) => removeJob(j.id));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveJobs = jobs.some(
    (j) => j.status === "pending" || j.status === "processing"
  );

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No conversions yet</p>
        <p className="text-sm">Upload files and click Convert to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with bulk actions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Conversion Results</h3>
          {hasActiveJobs && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          {/* Selection controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-8 px-2"
              title="Select all"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectNone}
              className="h-8 px-2"
              title="Deselect all"
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Selection info */}
          <span className="text-sm text-muted-foreground min-w-[100px]">
            {selectedIds.size > 0 ? (
              <span className="text-foreground font-medium">
                {selectedIds.size} selected
              </span>
            ) : (
              `${jobs.length} items`
            )}
          </span>

          <div className="flex-1" />

          {/* Bulk action buttons */}
          <div className="flex items-center gap-2">
            {/* Download selected */}
            {selectedCompletedJobs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="h-8 gap-1.5"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download ({selectedCompletedJobs.length})
              </Button>
            )}

            {/* Download all completed */}
            {completedJobs.length > 0 && selectedIds.size === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="h-8 gap-1.5"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageOpen className="h-4 w-4" />
                )}
                Download All ({completedJobs.length})
              </Button>
            )}

            {/* Delete selected */}
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete ({selectedIds.size})
              </Button>
            )}

            {/* Clear all */}
            {selectedIds.size === 0 && jobs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                title="Clear all"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Job list */}
      <ScrollArea className="h-[350px]">
        <AnimatePresence mode="popLayout">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card
                className={`p-4 mb-3 transition-colors ${
                  selectedIds.has(job.id)
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.has(job.id)}
                      onCheckedChange={() => toggleSelect(job.id)}
                      className="mt-0.5"
                    />

                    {/* Status icon */}
                    {statusIcons[job.status]}

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{job.file_info.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span
                          className={`px-2 py-0.5 rounded-full text-white ${
                            converterColors[job.converter] || "bg-gray-500"
                          }`}
                        >
                          {job.converter}
                        </span>
                        <span>{formatBytes(job.file_info.size)}</span>
                        {job.output_size && (
                          <>
                            <span>→</span>
                            <span>{formatBytes(job.output_size)}</span>
                          </>
                        )}
                        {job.processing_time && (
                          <span>{formatDuration(job.processing_time)}</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {(job.status === "pending" || job.status === "processing") && (
                        <Progress value={job.progress} className="mt-2 h-1" />
                      )}

                      {/* Error message */}
                      {job.status === "failed" && job.error && (
                        <p className="text-destructive text-sm mt-2 line-clamp-2">
                          {job.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Individual actions */}
                  <div className="flex items-center gap-1">
                    {job.status === "completed" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewJobId(job.id)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(job)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(job.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
