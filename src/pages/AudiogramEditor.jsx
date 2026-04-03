import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Plus, Trash2, Loader2, Ear } from "lucide-react";
import { toast } from "sonner";
import AudiogramChart from "@/components/AudiogramChart";
import AudiogramForm from "@/components/AudiogramForm";
import { motion } from "framer-motion";

const DEFAULT_EAR = {
  hz_250: 20, hz_500: 25, hz_1000: 30, hz_2000: 40,
  hz_3000: 50, hz_4000: 55, hz_6000: 50, hz_8000: 45,
};

export default function AudiogramEditor() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [leftEar, setLeftEar] = useState({ ...DEFAULT_EAR });
  const [rightEar, setRightEar] = useState({ ...DEFAULT_EAR });
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await base44.entities.AudiogramProfile.list("-created_date", 50);
    setProfiles(data);
    if (data.length > 0) {
      selectProfile(data[0]);
    }
    setLoading(false);
  };

  const selectProfile = (profile) => {
    setSelectedProfile(profile);
    setProfileName(profile.profile_name);
    setLeftEar(profile.left_ear || { ...DEFAULT_EAR });
    setRightEar(profile.right_ear || { ...DEFAULT_EAR });
    setIsDefault(profile.is_default || false);
  };

  const createNew = () => {
    setSelectedProfile(null);
    setProfileName("");
    setLeftEar({ ...DEFAULT_EAR });
    setRightEar({ ...DEFAULT_EAR });
    setIsDefault(false);
  };

  const handleSave = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    setSaving(true);
    const data = {
      profile_name: profileName,
      left_ear: leftEar,
      right_ear: rightEar,
      is_default: isDefault,
    };

    if (selectedProfile) {
      await base44.entities.AudiogramProfile.update(selectedProfile.id, data);
      toast.success("Profile updated");
    } else {
      await base44.entities.AudiogramProfile.create(data);
      toast.success("Profile created");
    }

    await loadProfiles();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    await base44.entities.AudiogramProfile.delete(selectedProfile.id);
    toast.success("Profile deleted");
    setSelectedProfile(null);
    createNew();
    await loadProfiles();
  };

  const applyPreset = (severity) => {
    const presets = {
      mild: { hz_250: 15, hz_500: 20, hz_1000: 25, hz_2000: 30, hz_3000: 35, hz_4000: 35, hz_6000: 30, hz_8000: 25 },
      moderate: { hz_250: 30, hz_500: 35, hz_1000: 40, hz_2000: 50, hz_3000: 55, hz_4000: 60, hz_6000: 55, hz_8000: 50 },
      severe: { hz_250: 50, hz_500: 55, hz_1000: 65, hz_2000: 75, hz_3000: 80, hz_4000: 85, hz_6000: 80, hz_8000: 75 },
      highFreq: { hz_250: 10, hz_500: 15, hz_1000: 20, hz_2000: 40, hz_3000: 55, hz_4000: 65, hz_6000: 70, hz_8000: 75 },
    };
    const data = presets[severity];
    if (data) {
      setLeftEar({ ...data });
      setRightEar({ ...data });
      toast.info("Preset applied to both ears");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Ear className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Audiogram Profile</h1>
            <p className="text-muted-foreground text-sm">Enter your hearing thresholds for personalized audio processing</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 mt-8">
          {/* Sidebar - Profiles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profiles</h2>
              <Button variant="ghost" size="icon" onClick={createNew} className="h-8 w-8" aria-label="Create new profile">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProfile(p)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                      selectedProfile?.id === p.id
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {p.profile_name}
                    {p.is_default && <span className="ml-2 text-xs opacity-60">(Default)</span>}
                  </button>
                ))}
                {profiles.length === 0 && (
                  <p className="text-xs text-muted-foreground px-4 py-3">No profiles yet. Create your first one!</p>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Presets</p>
              {[
                { key: "mild", label: "Mild Loss" },
                { key: "moderate", label: "Moderate Loss" },
                { key: "severe", label: "Severe Loss" },
                { key: "highFreq", label: "High-Frequency Loss" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="w-full text-left px-4 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Editor */}
          <div className="space-y-8">
            {/* Name + Default */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="profile-name" className="text-sm font-medium">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="My hearing profile"
                  className="h-10 bg-secondary/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="default-switch"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                  aria-label="Set as default profile"
                />
                <Label htmlFor="default-switch" className="text-sm">Default</Label>
              </div>
            </div>

            {/* Chart */}
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <AudiogramChart leftEar={leftEar} rightEar={rightEar} />
            </div>

            {/* Ear Forms */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-card border border-border/50">
                <AudiogramForm ear="left" label="Left Ear" color="hsl(250 80% 65%)" data={leftEar} onChange={setLeftEar} />
              </div>
              <div className="p-5 rounded-xl bg-card border border-border/50">
                <AudiogramForm ear="right" label="Right Ear" color="hsl(190 90% 50%)" data={rightEar} onChange={setRightEar} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="px-6">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {selectedProfile ? "Update Profile" : "Save Profile"}
              </Button>
              {selectedProfile && (
                <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}