import type { Card } from './types';

/**
 * Cards to sort. Scoped to metrics only — session/identity, agent configuration, per-engine
 * model/provider config, and event-stream entries have been pruned so the sort focuses on
 * the information architecture for usage and performance data.
 *
 * Keep this list ordered from "high-level / overview" to "low-level / per-provider" so that
 * the initial center column has a sensible starting order before the user touches anything.
 */
export const CARDS: Card[] = [
  // Top-line latency / turn metrics
  { id: 'avg-e2e-latency', label: 'Avg E2E latency' },
  { id: 'avg-llm-ttft', label: 'Avg LLM TTFT' },
  { id: 'avg-tts-ttfb', label: 'Avg TTS TTFB' },
  { id: 'avg-transcription-delay', label: 'Avg transcription delay' },
  { id: 'avg-end-of-turn-delay', label: 'Avg end of turn delay' },
  { id: 'avg-on-user-turn-completed-delay', label: 'Avg on_user_turn_completed delay' },

  // Interruption metrics
  { id: 'avg-detection-delay', label: 'Avg detection delay' },
  { id: 'interruptions', label: 'Interruptions' },
  { id: 'backchannels', label: 'Backchannels' },

  // Usage rollups
  { id: 'llm-input-output-tokens', label: 'LLM input / output tokens' },
  { id: 'tts-characters', label: 'TTS characters' },
  { id: 'stt-duration', label: 'STT duration' },

  // LLM detail metrics
  { id: 'llm-input-tokens', label: 'Input tokens', context: 'LLM' },
  { id: 'llm-input-text-tokens', label: 'Input text tokens', context: 'LLM' },
  { id: 'llm-input-audio-tokens', label: 'Input audio tokens', context: 'LLM' },
  { id: 'llm-input-image-tokens', label: 'Input image tokens', context: 'LLM' },
  { id: 'llm-input-cached-tokens', label: 'Input cached tokens', context: 'LLM' },
  { id: 'llm-input-cached-text-tokens', label: 'Input cached text tokens', context: 'LLM' },
  { id: 'llm-input-cached-audio-tokens', label: 'Input cached audio tokens', context: 'LLM' },
  { id: 'llm-input-cached-image-tokens', label: 'Input cached image tokens', context: 'LLM' },
  { id: 'llm-output-tokens', label: 'Output tokens', context: 'LLM' },
  { id: 'llm-output-text-tokens', label: 'Output text tokens', context: 'LLM' },
  { id: 'llm-output-audio-tokens', label: 'Output audio tokens', context: 'LLM' },
  { id: 'llm-session-duration', label: 'Session duration', context: 'LLM' },

  // TTS detail metrics
  { id: 'tts-audio-duration', label: 'Audio duration', context: 'TTS' },
  { id: 'tts-characters-count', label: 'Characters count', context: 'TTS' },
  { id: 'tts-input-tokens', label: 'Input tokens', context: 'TTS' },
  { id: 'tts-output-tokens', label: 'Output tokens', context: 'TTS' },

  // STT detail metrics
  { id: 'stt-audio-duration', label: 'Audio duration', context: 'STT' },
  { id: 'stt-input-tokens', label: 'Input tokens', context: 'STT' },
  { id: 'stt-output-tokens', label: 'Output tokens', context: 'STT' },

  // Interruption detail metrics
  { id: 'interruption-total-requests', label: 'Total requests', context: 'Interruption' },
];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
