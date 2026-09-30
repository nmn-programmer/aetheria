/**
 * Spoken Voice Guidance Engine
 * Provides lifelike female ("Serene Aura") and male ("Calm Sage") spoken cues
 * for breathwork phases with zero-lag Web Speech API synthesis
 */

import { BreathPhaseType } from '../types/breathwork';

class VoiceGuidanceEngine {
  private static instance: VoiceGuidanceEngine;
  private voicesLoaded = false;
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public static getInstance(): VoiceGuidanceEngine {
    if (!VoiceGuidanceEngine.instance) {
      VoiceGuidanceEngine.instance = new VoiceGuidanceEngine();
    }
    return VoiceGuidanceEngine.instance;
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  private getPreferredVoice(isFemale: boolean): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.initVoices();
    }

    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    if (isFemale) {
      // Find female matching voices
      const femaleNames = ['samantha', 'victoria', 'karen', 'moira', 'fiona', 'zira', 'susan', 'female', 'natural', 'google us english', 'ava'];
      const match = pool.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
      return match || pool[0] || null;
    } else {
      // Find male matching voices
      const maleNames = ['daniel', 'alex', 'george', 'oliver', 'arthur', 'david', 'male', 'guy', 'google uk english male'];
      const match = pool.find(v => maleNames.some(name => v.name.toLowerCase().includes(name)));
      return match || pool[1] || pool[0] || null;
    }
  }

  /**
   * Speaks the appropriate breathwork guidance cue
   */
  public speakPhaseCue(voiceType: 'voice-female' | 'voice-male', phase: BreathPhaseType) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterance

      let text = '';
      switch (phase) {
        case 'inhale':
          text = 'Breathe in';
          break;
        case 'micro-inhale':
          text = 'Sip more air';
          break;
        case 'hold-in':
          text = 'Hold gently';
          break;
        case 'exhale':
          text = 'Release slowly';
          break;
        case 'hold-out':
          text = 'Rest in stillness';
          break;
        case 'prep':
          text = 'Settle in';
          break;
        case 'complete':
          text = 'Practice complete';
          break;
        default:
          return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const isFemale = voiceType === 'voice-female';
      const voice = this.getPreferredVoice(isFemale);

      if (voice) {
        utterance.voice = voice;
      }

      if (isFemale) {
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
      } else {
        utterance.rate = 0.88;
        utterance.pitch = 0.88;
      }

      utterance.volume = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice guidance playback warning:', err);
    }
  }

  /**
   * Preview a voice model sample
   */
  public previewVoice(voiceType: 'voice-female' | 'voice-male') {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const isFemale = voiceType === 'voice-female';
      const text = isFemale 
        ? 'Welcome. Breathe in deeply and let your mind settle.' 
        : 'Welcome. Breathe in deeply and find your center.';

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = this.getPreferredVoice(isFemale);
      if (voice) utterance.voice = voice;

      utterance.rate = isFemale ? 0.92 : 0.88;
      utterance.pitch = isFemale ? 1.08 : 0.88;
      utterance.volume = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Voice preview warning:', err);
    }
  }
}

export const voiceEngine = VoiceGuidanceEngine.getInstance();
