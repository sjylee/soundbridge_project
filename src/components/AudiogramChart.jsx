import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

const FREQ_LABELS = {
  hz_250: "250",
  hz_500: "500",
  hz_1000: "1k",
  hz_2000: "2k",
  hz_3000: "3k",
  hz_4000: "4k",
  hz_6000: "6k",
  hz_8000: "8k",
};

const HEARING_LEVELS = [
  { min: -10, max: 25, label: "Normal", color: "hsl(160 70% 45%)" },
  { min: 26, max: 40, label: "Mild", color: "hsl(50 80% 55%)" },
  { min: 41, max: 55, label: "Moderate", color: "hsl(30 90% 55%)" },
  { min: 56, max: 70, label: "Mod. Severe", color: "hsl(15 80% 55%)" },
  { min: 71, max: 90, label: "Severe", color: "hsl(0 70% 55%)" },
  { min: 91, max: 120, label: "Profound", color: "hsl(0 50% 40%)" },
];

export default function AudiogramChart({ leftEar, rightEar }) {
  const data = Object.keys(FREQ_LABELS).map(key => ({
    frequency: FREQ_LABELS[key],
    left: leftEar?.[key] ?? null,
    right: rightEar?.[key] ?? null,
  }));

  const hasData = data.some(d => d.left !== null || d.right !== null);

  if (!hasData) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl bg-secondary/50 border border-border/50">
        <p className="text-muted-foreground text-sm">Enter audiogram data to see the chart</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-popover border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold mb-1">{label} Hz</p>
        {payload.map(p => (
          <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
            {p.name}: {p.value} dB HL
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Severity bands */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {HEARING_LEVELS.map(level => (
          <div key={level.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: level.color }} />
            <span className="text-xs text-muted-foreground">{level.label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 14%)" />
          <XAxis
            dataKey="frequency"
            stroke="hsl(215 20% 45%)"
            fontSize={12}
            label={{ value: "Frequency (Hz)", position: "bottom", offset: -5, fill: "hsl(215 20% 45%)", fontSize: 12 }}
          />
          <YAxis
            reversed
            domain={[-10, 120]}
            stroke="hsl(215 20% 45%)"
            fontSize={12}
            label={{ value: "dB HL", angle: -90, position: "insideLeft", fill: "hsl(215 20% 45%)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />

          {/* Severity reference lines */}
          <ReferenceLine y={25} stroke="hsl(50 80% 55%)" strokeDasharray="2 4" strokeOpacity={0.3} />
          <ReferenceLine y={40} stroke="hsl(30 90% 55%)" strokeDasharray="2 4" strokeOpacity={0.3} />
          <ReferenceLine y={55} stroke="hsl(15 80% 55%)" strokeDasharray="2 4" strokeOpacity={0.3} />
          <ReferenceLine y={70} stroke="hsl(0 70% 55%)" strokeDasharray="2 4" strokeOpacity={0.3} />
          <ReferenceLine y={90} stroke="hsl(0 50% 40%)" strokeDasharray="2 4" strokeOpacity={0.3} />

          <Line
            type="monotone"
            dataKey="left"
            name="Left Ear"
            stroke="hsl(250 80% 65%)"
            strokeWidth={2.5}
            dot={{ r: 5, fill: "hsl(250 80% 65%)", strokeWidth: 2, stroke: "hsl(225 20% 7%)" }}
            activeDot={{ r: 7 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="right"
            name="Right Ear"
            stroke="hsl(190 90% 50%)"
            strokeWidth={2.5}
            dot={{ r: 5, fill: "hsl(190 90% 50%)", strokeWidth: 2, stroke: "hsl(225 20% 7%)" }}
            activeDot={{ r: 7 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}