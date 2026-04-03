import { useMemo } from "react";

export default function WaveformVisualizer({ waveformData, color = "hsl(250 80% 65%)", label }) {
  const bars = useMemo(() => {
    if (!waveformData || waveformData.length === 0) return [];
    return waveformData;
  }, [waveformData]);

  if (bars.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center rounded-lg bg-secondary/30">
        <p className="text-xs text-muted-foreground">No waveform data</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-center gap-px h-24 rounded-lg bg-secondary/30 p-2 overflow-hidden">
        {bars.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-full min-w-[1px] transition-all duration-150"
            style={{
              height: `${Math.max(4, val * 100)}%`,
              background: color,
              opacity: 0.5 + val * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}