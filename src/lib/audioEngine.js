// NAL-R inspired frequency compensation engine using Web Audio API

const FREQUENCY_BANDS = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const FREQUENCY_KEYS = ['hz_250', 'hz_500', 'hz_1000', 'hz_2000', 'hz_3000', 'hz_4000', 'hz_6000', 'hz_8000'];

/**
 * Calculate NAL-R gain for a given frequency based on audiogram
 * G(f) = 0.46 * PTA + 0.31 * H(f) - 13
 * Simplified from: G(f) = 0.46 * PTA + 0.46 * H(f) - 0.2 * H(f) - 13
 */
function calculateNALRGain(audiogramEar) {
  const pta = (
    (audiogramEar.hz_500 || 0) +
    (audiogramEar.hz_1000 || 0) +
    (audiogramEar.hz_2000 || 0)
  ) / 3;

  const gains = {};
  FREQUENCY_KEYS.forEach((key, i) => {
    const threshold = audiogramEar[key] || 0;
    const gain = 0.46 * pta + 0.31 * threshold - 13;
    gains[FREQUENCY_BANDS[i]] = Math.max(0, Math.min(gain, 40)); // Clamp 0-40 dB
  });

  return gains;
}

/**
 * Create a processing chain for one audio channel using BiquadFilters
 */
function createEQChain(audioContext, gains) {
  const filters = FREQUENCY_BANDS.map((freq, i) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1.4; // moderate bandwidth
    filter.gain.value = gains[freq] || 0;
    return filter;
  });

  // Chain filters
  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }

  return { filters, input: filters[0], output: filters[filters.length - 1] };
}

/**
 * Process audio buffer with audiogram-based EQ
 */
export async function processAudio(audioBuffer, audiogramProfile, settings = {}) {
  const { vocalBoost = 3, bassBoost = 0, loudness = 0 } = settings;

  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // Calculate gains for both ears (use average for stereo processing)
  const leftGains = calculateNALRGain(audiogramProfile.left_ear);
  const rightGains = calculateNALRGain(audiogramProfile.right_ear);

  // Average gains for mono/stereo processing
  const avgGains = {};
  FREQUENCY_BANDS.forEach(freq => {
    avgGains[freq] = ((leftGains[freq] || 0) + (rightGains[freq] || 0)) / 2;
  });

  // Apply bass boost to low frequencies
  if (bassBoost !== 0) {
    avgGains[250] += bassBoost;
    avgGains[500] += bassBoost * 0.7;
  }

  // Create EQ chain
  const eqChain = createEQChain(offlineCtx, avgGains);

  // Create vocal boost (mid-frequency emphasis 1-4kHz)
  const vocalFilter = offlineCtx.createBiquadFilter();
  vocalFilter.type = 'peaking';
  vocalFilter.frequency.value = 2500;
  vocalFilter.Q.value = 0.8;
  vocalFilter.gain.value = vocalBoost;

  // Create compressor for dynamic range compression
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  // Create overall gain
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = Math.pow(10, loudness / 20);

  // Create limiter
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.01;

  // Connect chain: source -> EQ -> vocal boost -> compressor -> gain -> limiter -> destination
  source.connect(eqChain.input);
  eqChain.output.connect(vocalFilter);
  vocalFilter.connect(compressor);
  compressor.connect(gainNode);
  gainNode.connect(limiter);
  limiter.connect(offlineCtx.destination);

  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  return renderedBuffer;
}

/**
 * Extract waveform data from AudioBuffer
 */
export function getWaveformData(audioBuffer, numPoints = 200) {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / numPoints);
  const waveform = [];

  for (let i = 0; i < numPoints; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = start; j < start + blockSize && j < channelData.length; j++) {
      sum += Math.abs(channelData[j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize
  const max = Math.max(...waveform);
  return waveform.map(v => v / (max || 1));
}

/**
 * Get frequency spectrum from AudioBuffer
 */
export function getFrequencySpectrum(audioBuffer) {
  const ctx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;

  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 4096;
  const spectrum = new Float32Array(fftSize / 2);

  // Simple DFT approximation for display
  const sampleRate = audioBuffer.sampleRate;
  const binCount = fftSize / 2;
  const freqResolution = sampleRate / fftSize;

  // Sample a portion of the audio for spectrum
  const sampleLength = Math.min(fftSize * 4, channelData.length);
  const result = [];

  for (const freq of FREQUENCY_BANDS) {
    const binIndex = Math.round(freq / freqResolution);
    let magnitude = 0;

    for (let i = 0; i < sampleLength; i++) {
      const angle = 2 * Math.PI * binIndex * i / fftSize;
      magnitude += channelData[i] * Math.cos(angle);
    }

    result.push({
      frequency: freq,
      label: freq >= 1000 ? `${freq / 1000}k` : `${freq}`,
      magnitude: 20 * Math.log10(Math.abs(magnitude) / sampleLength + 1e-10),
    });
  }

  return result;
}

/**
 * Calculate the gain curve applied by the audiogram
 */
export function getAppliedGainCurve(audiogramProfile) {
  const leftGains = calculateNALRGain(audiogramProfile.left_ear);
  const rightGains = calculateNALRGain(audiogramProfile.right_ear);

  return FREQUENCY_BANDS.map((freq, i) => ({
    frequency: freq,
    label: freq >= 1000 ? `${freq / 1000}k` : `${freq}`,
    leftGain: leftGains[freq] || 0,
    rightGain: rightGains[freq] || 0,
    avgGain: ((leftGains[freq] || 0) + (rightGains[freq] || 0)) / 2,
  }));
}

/**
 * Convert AudioBuffer to WAV blob for download
 */
export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export { FREQUENCY_BANDS, FREQUENCY_KEYS, calculateNALRGain };