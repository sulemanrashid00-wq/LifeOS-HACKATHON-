'use client';
import { useCallback, useRef } from 'react';

export function useAudioFx() {
  const getContext = () => {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  };

  const playWithContext = (callback: (ctx: AudioContext) => void) => {
    try {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
         ctx.resume().then(() => callback(ctx));
      } else {
         callback(ctx);
      }
    } catch(e) {
       console.warn("Audio Context blocked");
    }
  }

  const playBlip = useCallback(() => {
    playWithContext((ctx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    });
  }, []);

  const playImpactKlaxon = useCallback(() => {
    playWithContext((ctx) => {
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 440 : 660, ctx.currentTime + (i * 0.4));
        gain.gain.setValueAtTime(0.15, ctx.currentTime + (i * 0.4));
        gain.gain.setTargetAtTime(0, ctx.currentTime + (i * 0.4) + 0.35, 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (i * 0.4));
        osc.stop(ctx.currentTime + (i * 0.4) + 0.4);
      }
    });
  }, []);

  const playRerouteTone = useCallback(() => {
    playWithContext((ctx) => {
      const notes = [523.25, 659.25, 783.99]; // Ascending C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.15));
        gain.gain.setValueAtTime(0.1, ctx.currentTime + (i * 0.15));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.15) + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (i * 0.15));
        osc.stop(ctx.currentTime + (i * 0.15) + 0.4);
      });
    });
  }, []);

  return { playBlip, playImpactKlaxon, playRerouteTone };
}