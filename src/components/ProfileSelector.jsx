import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ear } from "lucide-react";

export default function ProfileSelector({ profiles, selectedId, onSelect, isLoading }) {
  if (isLoading) {
    return (
      <div className="h-10 rounded-lg bg-secondary/50 animate-pulse" />
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
        <Ear className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No audiogram profiles yet. <a href="/audiogram" className="text-primary hover:underline">Create one</a>
        </p>
      </div>
    );
  }

  return (
    <Select value={selectedId || ""} onValueChange={onSelect}>
      <SelectTrigger className="h-10 bg-secondary/50" aria-label="Select audiogram profile">
        <SelectValue placeholder="Select audiogram profile" />
      </SelectTrigger>
      <SelectContent>
        {profiles.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.profile_name} {p.is_default ? "(Default)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}