import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { ScreenType } from '../types';

interface MenuMusicProps {
  currentScreen: ScreenType;
}

export default function MenuMusic({ currentScreen }: MenuMusicProps) {
  const musicEnabled = useGameStore((state) => state.musicEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const stepRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);

  const shouldPlay = musicEnabled && currentScreen !== 'game';

  useEffect(() => {
    if (!shouldPlay) {
      stopPlayback();
      return;
    }

    startPlayback();

    // Browser safety: resume Web Audio context on user interactions
    const handleGesture = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch((err) => console.log('Audio Context resume error:', err));
      }
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);

    return () => {
      stopPlayback();
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [shouldPlay, currentScreen]);

  const startPlayback = () => {
    if (timerIdRef.current) stopPlayback(); // restart gracefully to adapt immediately to screen changes

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      nextNoteTimeRef.current = ctx.currentTime + 0.1;
      stepRef.current = 0;

      // Steady BPM tribal wood/synth beat scheduler with gameplay adrenaline boost
      const tempo = currentScreen === 'game' ? 134 : 115;
      const stepDuration = 60 / tempo / 4; // 16th notes duration

      const schedule = () => {
        while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
          playStep(stepRef.current, nextNoteTimeRef.current, ctx);
          nextNoteTimeRef.current += stepDuration;
          stepRef.current = (stepRef.current + 1) % 16;
        }
        timerIdRef.current = requestAnimationFrame(schedule);
      };

      timerIdRef.current = requestAnimationFrame(schedule);
    } catch (e) {
      console.log('Procedural menu music failed play:', e);
    }
  };

  const stopPlayback = () => {
    if (timerIdRef.current) {
      cancelAnimationFrame(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.suspend().catch(() => {});
    }
  };

  const playStep = (step: number, time: number, ctx: AudioContext) => {
    // 1. Cozy Kick drum - on beats 0, 4, 8, 12, and step 10
    const isKick = step === 0 || step === 4 || step === 8 || step === 12 || step === 10;
    if (isKick) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);

      kickOsc.type = 'sine';
      const startFreq = step === 10 ? 85 : 120;
      kickOsc.frequency.setValueAtTime(startFreq, time);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.16);

      const gainVal = step === 10 ? 0.08 : 0.18;
      kickGain.gain.setValueAtTime(gainVal, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      kickOsc.start(time);
      kickOsc.stop(time + 0.16);
    }

    // 2. Clicky shaker high-hat - on steps 2, 6, 10, 14
    const isShaker = step % 4 === 2;
    if (isShaker) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      osc.frequency.setValueAtTime(9500, time);
      osc.frequency.exponentialRampToValueAtTime(800, time + 0.03);

      gainNode.gain.setValueAtTime(0.015, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      osc.start(time);
      osc.stop(time + 0.03);
    }

    // 3. Resonant, moody forest pad chords - on major bar divisions step 0, 8
    const isChord = step === 0 || step === 8;
    if (isChord) {
      // Warm chord progression (Am and G6 variants) on warm lowpass filters
      const freqs = step === 0 ? [146.83, 220.00, 261.63] : [130.81, 196.00, 246.94];
      const chordGain = ctx.createGain();
      const chordFilter = ctx.createBiquadFilter();

      chordFilter.type = 'lowpass';
      chordFilter.frequency.setValueAtTime(500, time);
      chordFilter.Q.setValueAtTime(1.2, time);

      chordGain.gain.setValueAtTime(0.0, time);
      chordGain.gain.linearRampToValueAtTime(0.06, time + 0.15); // soft swell
      chordGain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);

      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.setValueAtTime(freq + (Math.random() * 1.5 - 0.75), time); // natural chorus detuning

        osc.connect(chordFilter);
        osc.start(time);
        osc.stop(time + 1.15);
      });

      chordFilter.connect(chordGain);
      chordGain.connect(ctx.destination);
    }

    // 4. Game Screen Action Woodblocks / Melodic Bongo blips - active only inside the gameplay screen
    const isGameBlip = currentScreen === 'game' && (step % 2 === 1);
    if (isGameBlip) {
      const bongoOsc = ctx.createOscillator();
      const bongoGain = ctx.createGain();
      bongoOsc.connect(bongoGain);
      bongoGain.connect(ctx.destination);

      bongoOsc.type = 'triangle';
      // High-pitched organic forest blip structure
      const notes = [440, 523, 587, 659, 783, 880];
      const selectedNote = notes[step % notes.length];
      bongoOsc.frequency.setValueAtTime(selectedNote, time);

      bongoGain.gain.setValueAtTime(0.012, time);
      bongoGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      bongoOsc.start(time);
      bongoOsc.stop(time + 0.05);
    }
  };

  return null;
}
