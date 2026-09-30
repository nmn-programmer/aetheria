/**
 * Procedural Web Audio Synthesis Engine
 * 100% Client-Side Procedural Synthesis - Zero external MP3/WAV assets.
 * Production-hardened for iOS Safari, mobile interruption handling, and click-free audio synthesis.
 */

import { AudioGuidanceType, AmbientSoundType, BreathPhaseType } from '../types/breathwork';
import { voiceEngine } from './voiceGuidanceEngine';

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientSource: AudioBufferSourceNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;
  private isUnlocked = false;

  constructor() {
    // Add global auto-unlock listeners for mobile browsers (iOS WebKit / Android Chrome)
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (!this.isUnlocked) {
          this.ensureRunning();
          this.isUnlocked = true;
        }
      };
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchend', unlockAudio, { once: true, passive: true });
      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    }
  }

  private initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Handle system audio interruption (Bluetooth disconnect, call incoming, etc.)
      this.ctx.onstatechange = () => {
        if (this.ctx && (this.ctx.state === 'suspended' || (this.ctx.state as string) === 'interrupted')) {
          // Can be resumed upon next interaction
        }
      };

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  public ensureRunning() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Generates a 6-second seamlessly looping Brown Noise AudioBuffer
   * Brownian / Red noise algorithm (leaky integrated white noise)
   */
  private getBrownNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (this.brownNoiseBuffer) return this.brownNoiseBuffer;

    const sampleRate = this.ctx.sampleRate;
    const duration = 6.0;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        channelData[i] = lastOut * 3.5;
      }
      // Boundary cross-fade windowing to prevent clicks on loop reset
      const fadeLen = Math.floor(sampleRate * 0.08);
      for (let i = 0; i < fadeLen; i++) {
        const ratio = i / fadeLen;
        channelData[i] *= ratio;
        channelData[bufferSize - 1 - i] *= ratio;
      }
    }

    this.brownNoiseBuffer = buffer;
    return buffer;
  }

  /**
   * Play Phase Guidance Chime or Spoken Voice Cue
   */
  public playPhaseCue(cueType: AudioGuidanceType, phase: BreathPhaseType) {
    if (cueType === 'silent') return;
    this.ensureRunning();

    if (cueType === 'voice-female' || cueType === 'voice-male') {
      voiceEngine.speakPhaseCue(cueType, phase);
      if (this.ctx && this.masterGain) {
        // Play subtle low-frequency background harmonic bed behind voice
        this.synthesizeSoftCueBed(phase, this.ctx.currentTime);
      }
      return;
    }

    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    if (cueType === 'singing-bowl') {
      this.synthesizeSingingBowl(phase, now);
    } else if (cueType === 'zen-bell') {
      this.synthesizeZenBell(phase, now);
    } else if (cueType === 'synth-hum') {
      this.synthesizeSynthHum(phase, now);
    }
  }

  /**
   * Delicate acoustic harmonic bed behind spoken voice cues
   */
  private synthesizeSoftCueBed(phase: BreathPhaseType, now: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freq = phase === 'inhale' ? 432 : (phase === 'exhale' ? 324 : 384);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.9);
  }

  /**
   * Tibetan Singing Bowl (Dual Sine Wave Acoustic Theta Binaural Beat)
   * 432 Hz and 436 Hz creates a 4 Hz Theta acoustic beat
   */
  private synthesizeSingingBowl(phase: BreathPhaseType, now: number) {
    if (!this.ctx || !this.masterGain) return;

    let baseFreq = 432;
    if (phase === 'inhale') baseFreq = 432;
    else if (phase === 'hold-in' || phase === 'hold-out') baseFreq = 384;
    else if (phase === 'exhale') baseFreq = 324;
    else if (phase === 'micro-inhale') baseFreq = 480;

    const beatDiff = 4; // 4 Hz binaural theta pulsation
    const duration = phase === 'complete' ? 6.5 : 4.2;

    const bowlGain = this.ctx.createGain();
    bowlGain.gain.setValueAtTime(0.0001, now);
    bowlGain.gain.exponentialRampToValueAtTime(0.65, now + 0.08);
    bowlGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    bowlGain.connect(this.masterGain);

    // Fundamental oscillators
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq + beatDiff, now);

    // Second harmonic overtone
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 2.05, now);
    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.18, now);
    osc3.connect(overtoneGain);
    overtoneGain.connect(bowlGain);

    // Third harmonic shimmer
    const osc4 = this.ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(baseFreq * 3.12, now);
    const highOvertoneGain = this.ctx.createGain();
    highOvertoneGain.gain.setValueAtTime(0.08, now);
    osc4.connect(highOvertoneGain);
    highOvertoneGain.connect(bowlGain);

    osc1.connect(bowlGain);
    osc2.connect(bowlGain);

    [osc1, osc2, osc3, osc4].forEach(osc => {
      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  /**
   * Zen Temple Bell
   * High-frequency metallic strike with fast attack and long resonant shimmer
   */
  private synthesizeZenBell(phase: BreathPhaseType, now: number) {
    if (!this.ctx || !this.masterGain) return;

    let baseFreq = 852;
    if (phase === 'inhale') baseFreq = 741;
    else if (phase === 'hold-in' || phase === 'hold-out') baseFreq = 639;
    else if (phase === 'exhale') baseFreq = 528;
    else if (phase === 'micro-inhale') baseFreq = 963;

    const bellGain = this.ctx.createGain();
    bellGain.gain.setValueAtTime(0.0001, now);
    bellGain.gain.linearRampToValueAtTime(0.7, now + 0.004);
    bellGain.gain.exponentialRampToValueAtTime(0.2, now + 0.4);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
    bellGain.connect(this.masterGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2.01, now);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 3.24, now);

    const osc4 = this.ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(baseFreq * 4.41, now);

    const partialGain = this.ctx.createGain();
    partialGain.gain.setValueAtTime(0.25, now);
    osc2.connect(partialGain);
    osc3.connect(partialGain);
    osc4.connect(partialGain);
    partialGain.connect(bellGain);

    osc1.connect(bellGain);

    [osc1, osc2, osc3, osc4].forEach(osc => {
      osc.start(now);
      osc.stop(now + 4.0);
    });
  }

  /**
   * Pure Synth Hum (Warm Analog Pad Swell)
   */
  private synthesizeSynthHum(phase: BreathPhaseType, now: number) {
    if (!this.ctx || !this.masterGain) return;

    const chordNotes = phase === 'exhale' 
      ? [110, 164.81, 220, 261.63]
      : [110, 138.59, 164.81, 220];

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.0001, now);
    humGain.gain.linearRampToValueAtTime(0.45, now + 0.8);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(300, now + 3.5);
    filter.Q.value = 2.0;

    humGain.connect(filter);
    filter.connect(this.masterGain);

    chordNotes.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(humGain);
      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  /**
   * Play completion celebratory harmonic tone
   */
  public playCompletionChime() {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [528, 660, 792, 1056];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = now + idx * 0.22;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 3.3);
    });
  }

  /**
   * Ambient Soundscapes Control
   */
  public setAmbientSound(type: AmbientSoundType, volume = 0.25) {
    this.ensureRunning();
    if (!this.ctx || !this.ambientGain) return;

    this.stopAmbientSound();

    if (type === 'none') {
      return;
    }

    const safeVol = Math.max(0, Math.min(1, volume));
    this.ambientGain.gain.setValueAtTime(safeVol, this.ctx.currentTime);

    if (type === 'brown-noise') {
      this.startBrownNoise();
    } else if (type === 'ocean-surge') {
      this.startOceanSurge();
    }
  }

  public setAmbientVolume(volume: number) {
    if (!this.ctx || !this.ambientGain) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.ambientGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
  }

  private stopAmbientSound() {
    if (this.currentAmbientSource) {
      try {
        this.currentAmbientSource.stop();
        this.currentAmbientSource.disconnect();
      } catch {
        // Ignore
      }
      this.currentAmbientSource = null;
    }
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
        this.ambientLfo.disconnect();
      } catch {
        // Ignore
      }
      this.ambientLfo = null;
    }
    if (this.ambientFilter) {
      try {
        this.ambientFilter.disconnect();
      } catch {
        // Ignore
      }
      this.ambientFilter = null;
    }
  }

  private startBrownNoise() {
    if (!this.ctx || !this.ambientGain) return;
    const buffer = this.getBrownNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);
    filter.Q.value = 1.0;

    source.connect(filter);
    filter.connect(this.ambientGain);
    source.start();

    this.currentAmbientSource = source;
    this.ambientFilter = filter;
  }

  private startOceanSurge() {
    if (!this.ctx || !this.ambientGain) return;
    const buffer = this.getBrownNoiseBuffer();
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.value = 2.4;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(240, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.ambientGain);

    source.start();
    lfo.start();

    this.currentAmbientSource = source;
    this.ambientLfo = lfo;
    this.ambientFilter = filter;
  }

  public suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
}

export const audioEngine = new WebAudioEngine();
