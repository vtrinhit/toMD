import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Settings, Sparkles, Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { FileUpload } from "@/components/FileUpload";
import { ConverterSelect } from "@/components/ConverterSelect";
import { JobList } from "@/components/JobList";
import { PreviewModal } from "@/components/PreviewModal";
import { SettingsModal } from "@/components/SettingsModal";
import { useAppStore } from "@/stores/app";
import { converterApi } from "@/lib/api";

function App() {
  const {
    uploadedFiles,
    selectedConverter,
    setSettingsOpen,
    clearUploadedFiles,
    addJobs,
  } = useAppStore();
  const [isConverting, setIsConverting] = useState(false);
  const queryClient = useQueryClient();

  const handleConvert = async () => {
    if (uploadedFiles.length === 0) return;

    setIsConverting(true);
    try {
      const fileIds = uploadedFiles.map((f) => f.id);
      const result = await converterApi.startConversion(fileIds, selectedConverter);
      addJobs(result.jobs);
      clearUploadedFiles();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    } catch (error) {
      console.error("Conversion failed:", error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600"
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">toMD</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                File to Markdown Converter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggleButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
              <a
                href="https://github.com/vtrinhit/toMD"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
              >
                <Github className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Input */}
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Convert Files to Markdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Converter Selection */}
                  <ConverterSelect />

                  {/* File Upload */}
                  <FileUpload />

                  {/* Convert Button */}
                  <Button
                    onClick={handleConvert}
                    disabled={uploadedFiles.length === 0 || isConverting}
                    className="w-full h-10 sm:h-12 text-base sm:text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Convert to Markdown
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-muted/50">
                <CardContent className="pt-4 sm:pt-6">
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Supported Formats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    {[
                      { label: "Documents", types: "PDF, DOCX, PPTX, XLSX" },
                      { label: "Web", types: "HTML, XML, JSON, CSV" },
                      { label: "Images", types: "PNG, JPG, GIF, TIFF" },
                      { label: "Audio", types: "MP3, WAV, M4A, OGG" },
                      { label: "Code", types: "LaTeX, RST, IPYNB" },
                      { label: "Others", types: "EPUB, RTF, TXT" },
                    ].map((cat) => (
                      <div key={cat.label} className="p-1.5 sm:p-2 rounded-lg bg-background">
                        <p className="font-medium text-[10px] sm:text-xs text-muted-foreground">
                          {cat.label}
                        </p>
                        <p className="text-[10px] sm:text-xs">{cat.types}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <JobList />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-3 sm:py-4 mt-auto bg-muted/30">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Powered by</span>
              <span className="text-foreground font-medium">FastAPI + React + TailwindCSS</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="hidden sm:inline">Converters:</span>
              <div className="flex flex-wrap gap-1 justify-center">
                {["Markitdown", "Docling", "Marker", "Pypandoc", "Unstructured", "Mammoth", "html2text"].map((name) => (
                  <span
                    key={name}
                    className="px-1.5 py-0.5 rounded bg-muted text-[10px] sm:text-xs"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PreviewModal />
      <SettingsModal />
    </div>
  );
}

export default App;
