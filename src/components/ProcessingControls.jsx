import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Mic, Music, Volume2 } from "lucide-react";

const CONTROLS = [
  { key: "vocalBoost", label: "Vocal Clarity Boost", icon: Mic, min: 0, max: 10, step: 0.5, unit: "dB", defaultVal: 3 },
  { key: "bassBoost", label: "Bass Adjustment", icon: Music, min: -6, max: 6, step: 0.5, unit: "dB", defaultVal: 0 },
  { key: "loudness", label: "Overall Loudness", icon: Volume2, min: -6, max: 6, step: 0.5, unit: "dB", defaultVal: 0 },
];

export default function ProcessingControls({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Fine-Tuning</h3>
      {CONTROLS.map(({ key, label, icon: Icon, min, max, step, unit, defaultVal }) => (
        <div key={key} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{label}</Label>
            </div>
            <span className="text-sm font-mono text-primary">
              {(settings[key] ?? defaultVal) > 0 ? "+" : ""}{settings[key] ?? defaultVal} {unit}
            </span>
          </div>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[settings[key] ?? defaultVal]}
            onValueChange={([val]) => onChange({ ...settings, [key]: val })}
            className="w-full"
            aria-label={label}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min} {unit}</span>
            <span>{max} {unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}