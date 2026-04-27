# SoundBridge 🎧

> A clinically-inspired audio accessibility web application that personalizes sound output in real time based on an individual's hearing loss profile.

---

## Overview

SoundBridge was built to address a real problem: off-the-shelf audio — music, podcasts, YouTube — is not designed for people with hearing loss. Standard equalizers are generic and require manual tuning. SoundBridge automates this by applying the **NAL-R (National Acoustic Laboratories – Revised)** hearing aid prescription formula directly to any audio file or YouTube stream, producing a version of the audio compensated for the listener's specific hearing thresholds.

The result is a personalized listening experience grounded in clinical audiology, running entirely in the browser.

---

## Live App

The app is hosted on **Base44** and accessible via your app's published URL. It requires a user account (login/registration handled by Base44 Auth).

---

## Features

### 🦻 Audiogram Profile Management
- Create and store multiple named hearing profiles
- Enter hearing thresholds (dB HL) for each ear across 8 standard audiometric frequencies: **250 Hz, 500 Hz, 1 kHz, 2 kHz, 3 kHz, 4 kHz, 6 kHz, 8 kHz**
- Preset templates for common hearing loss patterns (mild, moderate, severe, high-frequency)
- Visual audiogram chart showing left/right ear threshold curves with severity bands (Normal → Profound)
- Designate a default profile for fast access

### 🎵 Audio Input
- **Upload**: MP3, WAV, or FLAC files up to 20MB
- **YouTube URL**: Paste any YouTube link — audio is extracted server-side and passed through the same processing pipeline
- **Direct URL**: Any direct-link audio file

### ⚙️ Audio Processing (NAL-R Engine)
- Applies the NAL-R formula: `G(f) = 0.46 × PTA + 0.31 × H(f) − 13`
  - PTA = Pure Tone Average of 500 Hz, 1 kHz, 2 kHz thresholds
  - H(f) = hearing threshold at each frequency band
- Gain values are clamped to 0–40 dB to prevent overamplification
- EQ chain built using **8 cascaded BiquadFilterNodes** (peaking type) via the Web Audio API
- Additional controls: **Vocal Clarity boost** (peaking at 2.5 kHz), **Bass boost**, and **Overall loudness**
- **Dynamic Range Compression**: threshold −24 dB, ratio 4:1, to handle non-linear real-world hearing loss
- **Brick-wall Limiter**: ratio 20:1 at −1 dB to prevent clipping
- Audio rendered offline via `OfflineAudioContext` before playback (no latency artifacts)

### 🔊 Before / After Comparison Player
- Side-by-side playback of the original and processed audio
- Waveform visualization for both versions
- Real-time playback progress bar
- **WAV export** of the processed audio file

### 📊 Frequency Response Visualization
- Bar chart showing the gain (dB) applied per frequency band for each ear based on the selected audiogram

---

## Technical Architecture

```
User Audiogram Data (dB HL per frequency)
        │
        ▼
NAL-R Gain Calculation (per ear, per band)
        │
        ▼
BiquadFilter EQ Chain (8 peaking filters)
        │
        ▼
Vocal Boost Filter (2.5 kHz peaking)
        │
        ▼
Dynamic Range Compressor
        │
        ▼
Gain Node (loudness)
        │
        ▼
Limiter (brick-wall at -1 dBFS)
        │
        ▼
OfflineAudioContext → Rendered AudioBuffer → Playback / WAV Export
```

**YouTube path:**
```
YouTube URL → Backend Function (youtubei.js) → Base64 Audio → Frontend Decode → Same pipeline above
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Audio Engine | Web Audio API (`OfflineAudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`) |
| Charts | Recharts |
| Animations | Framer Motion |
| Backend Functions | Deno Deploy (serverless) |
| YouTube Extraction | `youtubei.js` (via Deno backend function) |
| Database / Auth | Base44 (hosted BaaS) |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx              # Landing page
│   ├── AudiogramEditor.jsx   # Profile creation & management
│   └── ProcessAudio.jsx      # Main audio processing dashboard
│
├── components/
│   ├── AudiogramChart.jsx    # Recharts audiogram visualization
│   ├── AudiogramForm.jsx     # dB HL input form per ear
│   ├── ComparisonPlayer.jsx  # Before/after playback UI
│   ├── FileUploader.jsx      # File + YouTube URL input
│   ├── FrequencyChart.jsx    # Applied gain visualization
│   ├── ProcessingControls.jsx# Vocal/bass/loudness sliders
│   ├── ProfileSelector.jsx   # Dropdown for saved profiles
│   ├── WaveformVisualizer.jsx# Waveform bar display
│   └── Layout.jsx            # App shell with nav
│
├── lib/
│   └── audioEngine.js        # Core NAL-R engine (all DSP logic)
│
├── entities/
│   └── AudiogramProfile.json # Database schema for hearing profiles
│
└── functions/
    └── fetchYoutubeAudio.js  # Deno backend: YouTube audio extraction
```

---

## Core Algorithm — `lib/audioEngine.js`

This is the heart of the app. Key exports:

- **`processAudio(audioBuffer, audiogramProfile, settings)`** — Runs the full NAL-R EQ pipeline via `OfflineAudioContext`. Returns a processed `AudioBuffer`.
- **`calculateNALRGain(audiogramEar)`** — Computes per-frequency dB gain from audiogram thresholds.
- **`getAppliedGainCurve(audiogramProfile)`** — Returns left/right/avg gain values per band for visualization.
- **`getWaveformData(audioBuffer)`** — Downsamples audio buffer into 200-point waveform array for display.
- **`audioBufferToWav(buffer)`** — Encodes processed `AudioBuffer` to a standard 16-bit PCM WAV `Blob` for download.

---

## Data Model — `AudiogramProfile`

```json
{
  "profile_name": "string",
  "left_ear": {
    "hz_250": number,
    "hz_500": number,
    "hz_1000": number,
    "hz_2000": number,
    "hz_3000": number,
    "hz_4000": number,
    "hz_6000": number,
    "hz_8000": number
  },
  "right_ear": { ... same structure ... },
  "is_default": boolean
}
```

Thresholds are in **dB HL** (Hearing Level), the standard clinical unit used in audiometry. Range: −10 to 120 dB HL.

---

## How to Use

1. **Create an audiogram profile** — Navigate to *Audiogram* and enter your hearing thresholds (from an audiologist report), or select a preset template.
2. **Upload audio** — Go to *Process* and upload a file, paste a YouTube link, or provide a direct audio URL.
3. **Select your profile** — Choose the audiogram profile to apply.
4. **Process** — Click *Process Audio*. The NAL-R engine runs and renders the compensated audio.
5. **Compare & export** — Play the original vs processed versions side by side. Download the result as a WAV file.

---

## References

- Byrne, D. & Dillon, H. (1986). *The National Acoustic Laboratories' (NAL) new procedure for selecting the gain and frequency response of a hearing aid.* Ear and Hearing, 7(4), 257–265.
- Web Audio API — [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- Base44 Platform — [base44.com](https://base44.com)

---

*Built as a personal project exploring the intersection of clinical audiology and browser-based audio DSP.*