import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FREQUENCIES = [
  { key: "hz_250", label: "250 Hz" },
  { key: "hz_500", label: "500 Hz" },
  { key: "hz_1000", label: "1 kHz" },
  { key: "hz_2000", label: "2 kHz" },
  { key: "hz_3000", label: "3 kHz" },
  { key: "hz_4000", label: "4 kHz" },
  { key: "hz_6000", label: "6 kHz" },
  { key: "hz_8000", label: "8 kHz" },
];

export default function AudiogramForm({ ear, label, color, data, onChange }) {
  const handleChange = (key, value) => {
    const numVal = value === "" ? 0 : Math.max(-10, Math.min(120, parseInt(value) || 0));
    onChange({ ...data, [key]: numVal });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <h3 className="text-base font-semibold">{label}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FREQUENCIES.map(({ key, label: freqLabel }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`${ear}-${key}`} className="text-xs text-muted-foreground font-medium">
              {freqLabel}
            </Label>
            <Input
              id={`${ear}-${key}`}
              type="number"
              min={-10}
              max={120}
              step={5}
              value={data[key] ?? ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="h-10 text-center font-mono text-sm bg-secondary/50 border-border/50 focus:border-primary"
              placeholder="dB"
              aria-label={`${label} threshold at ${freqLabel} in decibels`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}