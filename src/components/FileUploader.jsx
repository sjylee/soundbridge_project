import { useState, useRef } from "react";
import { Upload, FileAudio, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = [".mp3", ".wav", ".flac", "audio/mpeg", "audio/wav", "audio/flac", "audio/x-flac"];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function FileUploader({ onFileLoaded, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const inputRef = useRef(null);

  const validateAndLoad = async (file) => {
    setError(null);

    if (file.size > MAX_SIZE) {
      setError("File exceeds 20MB limit");
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["mp3", "wav", "flac"].includes(ext)) {
      setError("Unsupported format. Please use MP3, WAV, or FLAC.");
      return;
    }

    setFileInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      type: ext.toUpperCase(),
    });

    // Decode audio
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    setFileInfo(prev => ({
      ...prev,
      duration: `${Math.floor(audioBuffer.duration / 60)}:${String(Math.floor(audioBuffer.duration % 60)).padStart(2, "0")}`,
      sampleRate: `${audioBuffer.sampleRate / 1000} kHz`,
      channels: audioBuffer.numberOfChannels === 1 ? "Mono" : "Stereo",
    }));

    onFileLoaded(audioBuffer, file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndLoad(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndLoad(file);
  };

  const clear = () => {
    setFileInfo(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {!fileInfo ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50 hover:bg-secondary/30"
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload audio file"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.flac"
            className="hidden"
            onChange={handleChange}
            aria-label="Select audio file"
          />
          <Upload className={`w-10 h-10 mx-auto mb-4 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-base font-medium mb-1">Drop your audio file here</p>
          <p className="text-sm text-muted-foreground">or click to browse — MP3, WAV, FLAC up to 20MB</p>
        </div>
      ) : (
        <div className="rounded-xl bg-secondary/30 border border-border/50 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[200px]">{fileInfo.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">{fileInfo.type}</span>
                  <span className="text-xs text-muted-foreground">{fileInfo.size} MB</span>
                  {fileInfo.duration && <span className="text-xs text-muted-foreground">{fileInfo.duration}</span>}
                  {fileInfo.sampleRate && <span className="text-xs text-muted-foreground">{fileInfo.sampleRate}</span>}
                  {fileInfo.channels && <span className="text-xs text-muted-foreground">{fileInfo.channels}</span>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clear} className="h-8 w-8" aria-label="Remove file" disabled={isLoading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}