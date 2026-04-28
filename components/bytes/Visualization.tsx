'use client';

import { useDeferredValue, useEffect, useRef } from 'react';
import { cn } from '@/lib/bytes/utils';
import { useTheme } from '@/lib/bytes/theme';

const TIME_INCREMENT = 0.15;
const FALLBACK_TIME_INCREMENT = 0.05;

const FREQUENCY = 0.15;
const FALLBACK_FREQUENCY = 0.01;

const AMPLITUDE = 30;
const FALLBACK_AMPLITUDE = 10;

function memo<T extends (...args: any[]) => any>(fn: T) {
  const cache = new Map<string, ReturnType<T>>();
  return (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

function getBellCurve(distanceFromCenter: number, maxDistance: number) {
  const normalizedDistance = distanceFromCenter / maxDistance;

  return Math.pow(Math.cos(normalizedDistance * (Math.PI / 2)), 16);
}

function getCssVariable(variable: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable);
}

const getRgbColor = memo(function getRgbColor(color: string) {
  const match = color.match(/oklch?\(([^)]+)\)/);
  if (!match || !match[1]) return { l: 0, c: 0, h: 0, a: 1 };

  const [rgb, alpha] = match[1].split('/');
  const rgbValues = rgb?.split(' ').map((v) => v.trim()) || ['0', '0', '0'];
  const alphaValue = alpha?.trim() ?? '1';

  return {
    l: parseFloat(rgbValues[0] ?? '0'),
    c: parseFloat(rgbValues[1] ?? '0'),
    h: parseFloat(rgbValues[2] ?? '0'),
    a: parseFloat(alphaValue),
  };
});

const interpolateColor = memo(function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  const oklch1 = getRgbColor(color1);
  const oklch2 = getRgbColor(color2);

  const l = (oklch1.l + (oklch2.l - oklch1.l) * factor).toFixed(2);
  const c = (oklch1.c + (oklch2.c - oklch1.c) * factor).toFixed(2);
  const h = (oklch1.h + (oklch2.h - oklch1.h) * factor).toFixed(2);
  const a = oklch1.a + (oklch2.a - oklch1.a) * factor;

  return `oklch(${l} ${c} ${h} / ${a})`;
});

interface VisualizationProps {
  audioEl?: HTMLAudioElement;
  className?: string;
}

export function Visualization({ audioEl, className }: VisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const { theme } = useTheme();
  const deferredTheme = useDeferredValue(theme);

  // audio setup (runs when audioEl changes)
  useEffect(() => {
    if (!audioEl) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    async function setupAudio() {
      if (!audioEl) return;
      try {
        // Set up audio context and analyser
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume audio context if it's suspended (required by browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioEl);

        // Connect audio source to both analyser and destination
        source.connect(analyser);
        source.connect(audioContext.destination); // This ensures audio still plays

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const arrayBuffer: ArrayBuffer = new Uint8Array(bufferLength).buffer;
        dataArray = new Uint8Array(arrayBuffer);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        audioEl.removeEventListener('canplay', setupAudio);
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    }

    audioEl.addEventListener('canplay', setupAudio);

    // If audio is already ready, set up immediately
    if (audioEl.readyState >= 3) {
      setupAudio();
    }

    // Cleanup
    return () => {
      audioContext?.close();
      audioEl.removeEventListener('canplay', setupAudio);
    };
  }, [audioEl]);

  // visualization rendering (runs when theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas?.getContext('2d');
    if (!canvasCtx || !canvas) return;

    const COLOR = `oklch(${getCssVariable('--lk-color-fgAccent1')})`;
    const COLOR_IDLE = `oklch(${getCssVariable('--lk-color-fgAccent1')} / 0.25)`;
    const CLEAR_FILL_STYLE = `oklch(${getCssVariable('--lk-color-bg1')} / 0.5)`;

    let time = 0;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const animate = () => {
      // Clear canvas
      canvasCtx.fillStyle = CLEAR_FILL_STYLE;
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Get audio data if analyser is ready
      let normalizedAmplitude = 0;
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

        // Calculate average frequency data for amplitude
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i]!;
        }
        const average = sum / dataArrayRef.current.length;
        normalizedAmplitude = (average / 255) * 100; // Normalize to 0-100
      }

      // Set up sine wave properties with smooth transition
      const centerY = canvas.height / 2;
      const waveLength = canvas.width;
      const centerX = waveLength / 2;

      // Create transition factor (0 = fallback, 1 = audio-reactive)
      const transitionFactor = Math.min(normalizedAmplitude / 10, 1); // Transition starts at 10% volume

      // Interpolate between colors for smooth transition
      const interpolatedColor = interpolateColor(COLOR_IDLE, COLOR, transitionFactor);

      // Draw the sine wave with smooth transition
      canvasCtx.strokeStyle = interpolatedColor;
      canvasCtx.lineWidth = 2 + normalizedAmplitude / 20; // Thicker line with more audio
      canvasCtx.beginPath();

      for (let x = 0; x < waveLength; x++) {
        // Create a more emphasized bell curve that peaks in the center and tapers to edges
        const maxDistance = centerX;
        const distanceFromCenter = Math.abs(x - centerX);
        // Use a power function to create a sharper peak and steeper falloff
        const bellCurve = getBellCurve(distanceFromCenter, maxDistance);

        // Interpolate between fallback and audio-reactive values
        const interpolatedAmplitude =
          FALLBACK_AMPLITUDE + (AMPLITUDE - FALLBACK_AMPLITUDE) * transitionFactor;
        const volumeAmplitude = interpolatedAmplitude + normalizedAmplitude * transitionFactor;
        const dynamicAmplitude = volumeAmplitude * bellCurve;

        // Interpolate frequency
        const interpolatedFrequency =
          FALLBACK_FREQUENCY + (FREQUENCY - FALLBACK_FREQUENCY) * transitionFactor;
        const dynamicFrequency =
          interpolatedFrequency + (normalizedAmplitude / 1000) * transitionFactor;

        // Calculate position relative to center for outward stretching
        const relativeX = x - centerX;

        const y = centerY + dynamicAmplitude * Math.sin(relativeX * dynamicFrequency + time);

        if (x === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
      }

      canvasCtx.stroke();

      // Increment time for animation with smooth transition
      // const timeIncrement = TIME_INCREMENT + (normalizedAmplitude / 1000) * transitionFactor;
      // time += timeIncrement

      time += transitionFactor > 0 ? TIME_INCREMENT : FALLBACK_TIME_INCREMENT;

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [deferredTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'mask-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_20%,rgba(0,0,0,1)_80%,rgba(0,0,0,0)_100%)]',
        className,
      )}
    />
  );
}
