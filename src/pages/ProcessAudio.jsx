import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AudioWaveform, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import FileUploader from "@/components/FileUploader";
import ProfileSelector from "@/components/ProfileSelector";
import ProcessingControls from "@/components/ProcessingControls";
import ComparisonPlayer from "@/components/ComparisonPlayer";
import FrequencyChart from "@/components/FrequencyChart";
import { processAudio, getAppliedGainCurve } from "@/lib/audioEngine";

export default function ProcessAudio() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [originalBuffer, setOriginalBuffer] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [gainCurve, setGainCurve] = useState(null);
  const [settings, setSettings] = useState({ vocalBoost: 3, bassBoost: 0, loudness: 0 });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    const data = await base44.entities.AudiogramProfile.list("-created_date", 50);
    setProfiles(data);
    const defaultProfile = data.find((p) => p.is_default) || data[0];
    if (defaultProfile) setSelectedProfileId(defaultProfile.id);
    setLoadingProfiles(false);
  };

  const handleFileLoaded = (audioBuffer, name) => {
    setOriginalBuffer(audioBuffer);
    setProcessedBuffer(null);
    setGainCurve(null);
    setFileName(name);
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleProcess = async () => {
    if (!originalBuffer) {
      toast.error("Please upload an audio file first");
      return;
    }
    if (!selectedProfile) {
      toast.error("Please select an audiogram profile");
      return;
    }

    setProcessing(true);
    toast.info("Processing audio with your hearing profile...");

    // Small delay for UI responsiveness
    await new Promise((r) => setTimeout(r, 100));

    const result = await processAudio(originalBuffer, selectedProfile, settings);
    setProcessedBuffer(result);

    const curve = getAppliedGainCurve(selectedProfile);
    setGainCurve(curve);

    setProcessing(false);
    toast.success("Audio processed successfully!");
  };

  const handleReprocess = async () => {
    if (!originalBuffer || !selectedProfile) return;
    setProcessing(true);

    await new Promise((r) => setTimeout(r, 100));

    const result = await processAudio(originalBuffer, selectedProfile, settings);
    setProcessedBuffer(result);

    const curve = getAppliedGainCurve(selectedProfile);
    setGainCurve(curve);

    setProcessing(false);
    toast.success("Audio re-processed with updated settings!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <AudioWaveform className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Process Audio</h1>
            <p className="text-muted-foreground text-sm">Upload music and apply your hearing profile</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Main Column */}
          <div className="space-y-8">
            {/* Upload */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                1. Upload Audio
              </h2>
              <FileUploader onFileLoaded={handleFileLoaded} isLoading={processing} />
            </section>

            {/* Profile Selection */}
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                2. Select Audiogram Profile
              </h2>
              <ProfileSelector
                profiles={profiles}
                selectedId={selectedProfileId}
                onSelect={setSelectedProfileId}
                isLoading={loadingProfiles}
              />
            </section>

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!originalBuffer || !selectedProfile || processing}
              size="lg"
              className="w-full h-14 text-base rounded-xl"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Process Audio
                </>
              )}
            </Button>

            {/* Comparison Player */}
            {(originalBuffer || processedBuffer) && (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  3. Compare Results
                </h2>
                <ComparisonPlayer
                  originalBuffer={originalBuffer}
                  processedBuffer={processedBuffer}
                  fileName={fileName}
                />
              </section>
            )}

            {/* Frequency Response */}
            {gainCurve && (
              <section className="p-6 rounded-2xl bg-card border border-border/50">
                <FrequencyChart gainCurve={gainCurve} />
              </section>
            )}
          </div>

          {/* Sidebar - Controls */}
          <div className="space-y-6">
            <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border/50 space-y-6">
              <ProcessingControls settings={settings} onChange={setSettings} />

              <Separator />

              <Button
                variant="outline"
                onClick={handleReprocess}
                disabled={!processedBuffer || processing}
                className="w-full"
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Re-process with Settings
              </Button>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">NAL-R Formula:</strong> Frequency gains are calculated using
                  the clinically-validated National Acoustic Laboratories formula, tailored to your audiogram thresholds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}