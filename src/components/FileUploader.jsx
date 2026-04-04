import { useState, useRef } from "react";
import { Upload, FileAudio, X, AlertCircle, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function FileUploader({ onFileLoaded, isLoading }) {
  const [mode, setMode] = useState("upload"); // 'upload' | 'url'
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const inputRef = useRef(null);

  const decodeAndSet = async (arrayBuffer, name) => {
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    setFileInfo(prev => ({
      ...prev,
      duration: `${Math.floor(audioBuffer.duration / 60)}:${String(Math.floor(audioBuffer.duration % 60)).padStart(2, "0")}`,
      sampleRate: `${audioBuffer.sampleRate / 1000} kHz`,
      channels: audioBuffer.numberOfChannels === 1 ? "Mono" : "Stereo",
    }));

    onFileLoaded(audioBuffer, name);
  };

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

    const arrayBuffer = await file.arrayBuffer();
    await decodeAndSet(arrayBuffer, file.name);
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    setUrlLoading(true);
    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error("Failed to fetch");
      const arrayBuffer = await response.arrayBuffer();

      const name = urlInput.split("/").pop().split("?")[0] || "audio-from-url";
      setFileInfo({
        name,
        size: (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2),
        type: "URL",
      });

      await decodeAndSet(arrayBuffer, name);
    } catch (e) {
      setError("Could not load audio from URL. Make sure the URL is a direct audio file link and CORS is allowed.");
      setFileInfo(null);
    }
    setUrlLoading(false);
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
    setUrlInput("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      {!fileInfo && (
        <div className="flex rounded-lg bg-secondary/50 p-1 gap-1">
          <button
            onClick={() => { setMode("upload"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button
            onClick={() => { setMode("url"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link className="w-4 h-4" /> From URL
          </button>
        </div>
      )}

      {!fileInfo ? (
        mode === "upload" ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
              dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-secondary/30"
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
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="flex-1 bg-secondary/50"
                aria-label="Audio URL"
                onKeyDown={(e) => { if (e.key === "Enter") handleUrlLoad(); }}
              />
              <Button onClick={handleUrlLoad} disabled={urlLoading || !urlInput.trim()} className="shrink-0">
                {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a direct link to an MP3, WAV, or FLAC file. The server must allow cross-origin requests (CORS).
            </p>
          </div>
        )
      ) : (
        <div className="rounded-xl bg-secondary/30 border border-border/50 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[200px]">{fileInfo.name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
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