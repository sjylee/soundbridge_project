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
- EQ chain built using **8 cascaded BiquadFilterNodes** (peaking type) via the Web Audio API
- Additional controls: **Vocal Clarity boost**, **Bass boost**, and **Overall loudness**
- **Dynamic Range Compression** + **Brick-wall Limiter** to prevent clipping
- Audio rendered offline via `OfflineAudioContext` before playback

### 🔊 Before / After Comparison Player
- Side-by-side playback of original and processed audio
- Waveform visualization + real-time progress bar
- **WAV export** of the processed audio

### 📊 Frequency Response Visualization
- Bar chart showing gain (dB) applied per frequency band per ear

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
YouTube URL → Backend Function (youtubei.js) → Base64 Audio → Frontend Decode → Same pipeline
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

---

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx              # Landing page
│   ├── AudiogramEditor.jsx   # Profile creation & management
│   └── ProcessAudio.jsx      # Main audio processing dashboard
├── components/
│   ├── AudiogramChart.jsx    # Recharts audiogram visualization
│   ├── ComparisonPlayer.jsx  # Before/after playback UI
│   ├── FileUploader.jsx      # File + YouTube URL input
│   ├── FrequencyChart.jsx    # Applied gain visualization
│   └── ...
├── lib/
│   └── audioEngine.js        # Core NAL-R engine (all DSP logic)
├── entities/
│   └── AudiogramProfile.json # Database schema for hearing profiles
└── functions/
    └── fetchYoutubeAudio.js  # Deno backend: YouTube audio extraction
```

---

## Local Development

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

5. Run: `npm run dev`

---

## References

- Byrne, D. & Dillon, H. (1986). *The National Acoustic Laboratories' (NAL) new procedure for selecting the gain and frequency response of a hearing aid.* Ear and Hearing, 7(4), 257–265.
- [Web Audio API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Base44 Platform](https://base44.com)

---

*Built as a personal project exploring the intersection of clinical audiology and browser-based audio DSP.*
```
