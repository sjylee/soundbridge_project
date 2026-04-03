import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import WaveformVisualizer from "./WaveformVisualizer";
import { audioBufferToWav, getWaveformData } from "@/lib/audioEngine";

export default function ComparisonPlayer({ originalBuffer, processedBuffer, fileName }) {
  const [playing, setPlaying] = useState(null); // null, 'original', 'processed'
  const [progress, setProgress] = useState(0);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef(null);

  const originalWaveform = originalBuffer ? getWaveformData(originalBuffer) : [];
  const processedWaveform = processedBuffer ? getWaveformData(processedBuffer) : [];

  const stopPlayback = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setPlaying(null);
    setProgress(0);
  };

  const playBuffer = (buffer, type) => {
    stopPlayback();
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime;
    setPlaying(type);

    const updateProgress = () => {
      const elapsed = ctx.currentTime - startTimeRef.current;
      const pct = Math.min(100, (elapsed / buffer.duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        setPlaying(null);
      }
    };
    animFrameRef.current = requestAnimationFrame(updateProgress);

    source.onended = () => {
      setPlaying(null);
      setProgress(0);
    };
  };

  const handleDownload = () => {
    if (!processedBuffer) return;
    const blob = audioBufferToWav(processedBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soundbridge_${fileName || "processed"}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const duration = originalBuffer ? `${Math.floor(originalBuffer.duration / 60)}:${String(Math.floor(originalBuffer.duration % 60)).padStart(2, "0")}` : "--:--";

  return (
    <div className="space-y-6">
      {/* Original */}
      <div className="p-5 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Original</h4>
          <span className="text-xs font-mono text-muted-foreground">{duration}</span>
        </div>
        <WaveformVisualizer waveformData={originalWaveform} color="hsl(215 20% 45%)" />
        <Button
          variant={playing === "original" ? "default" : "outline"}
          size="sm"
          onClick={() => playing === "original" ? stopPlayback() : playBuffer(originalBuffer, "original")}
          disabled={!originalBuffer}
          className="w-full"
          aria-label={playing === "original" ? "Stop original audio" : "Play original audio"}
        >
          {playing === "original" ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {playing === "original" ? "Stop" : "Play Original"}
        </Button>
      </div>

      {/* Processed */}
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">Processed</h4>
          <span className="text-xs font-mono text-muted-foreground">{duration}</span>
        </div>
        <WaveformVisualizer
          waveformData={processedWaveform}
          color="hsl(250 80% 65%)"
        />
        <div className="flex gap-2">
          <Button
            variant={playing === "processed" ? "default" : "outline"}
            size="sm"
            onClick={() => playing === "processed" ? stopPlayback() : playBuffer(processedBuffer, "processed")}
            disabled={!processedBuffer}
            className="flex-1"
            aria-label={playing === "processed" ? "Stop processed audio" : "Play processed audio"}
          >
            {playing === "processed" ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {playing === "processed" ? "Stop" : "Play Processed"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!processedBuffer}
            aria-label="Download processed audio"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      {playing && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Playing {playing} audio...
          </p>
        </div>
      )}
    </div>
  );
}