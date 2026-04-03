import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function FrequencyChart({ gainCurve }) {
  if (!gainCurve || gainCurve.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center rounded-xl bg-secondary/30">
        <p className="text-sm text-muted-foreground">Process audio to see frequency changes</p>
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
            {p.name}: +{p.value.toFixed(1)} dB
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Applied Gain Compensation</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={gainCurve} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 14%)" />
          <XAxis dataKey="label" stroke="hsl(215 20% 45%)" fontSize={12} />
          <YAxis stroke="hsl(215 20% 45%)" fontSize={12} unit=" dB" />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="leftGain" name="Left Ear Gain" fill="hsl(250 80% 65%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="rightGain" name="Right Ear Gain" fill="hsl(190 90% 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}