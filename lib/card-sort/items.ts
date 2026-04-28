import type { Card } from './types';

/**
 * Cards to sort. These are derived from every label / metric / value visible across the
 * provided LiveKit session UI screenshots, deduplicated by id. Names that appear in multiple
 * scopes (e.g. "Model" under LLM/TTS/STT/Interruption) are kept as distinct cards because the
 * goal of this sort is to discover the right information architecture.
 *
 * Keep this list ordered from "high-level / overview" to "low-level / per-provider" so that
 * the initial center column has a sensible starting order before the user touches anything.
 */
export const CARDS: Card[] = [
  // Session header / room info
  { id: 'room', label: 'Room' },
  { id: 'room-region', label: 'Region', context: 'Room' },
  { id: 'duration', label: 'Duration' },
  { id: 'participants', label: 'Participants' },
  { id: 'room-configuration', label: 'Room configuration' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'e2e-encryption', label: 'E2E encryption' },
  { id: 'recording', label: 'Recording' },

  // Agent configuration
  { id: 'agent-configuration', label: 'Agent configuration' },
  { id: 'sdk-version', label: 'SDK / Version' },
  { id: 'agent-region', label: 'Region', context: 'Agent' },
  { id: 'agent-llm', label: 'LLM' },
  { id: 'agent-tts', label: 'TTS' },
  { id: 'agent-stt', label: 'STT' },

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
  { id: 'llm-model', label: 'Model', context: 'LLM' },
  { id: 'llm-provider', label: 'Provider', context: 'LLM' },
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
  { id: 'tts-model', label: 'Model', context: 'TTS' },
  { id: 'tts-provider', label: 'Provider', context: 'TTS' },
  { id: 'tts-audio-duration', label: 'Audio duration', context: 'TTS' },
  { id: 'tts-characters-count', label: 'Characters count', context: 'TTS' },
  { id: 'tts-input-tokens', label: 'Input tokens', context: 'TTS' },
  { id: 'tts-output-tokens', label: 'Output tokens', context: 'TTS' },

  // STT detail metrics
  { id: 'stt-model', label: 'Model', context: 'STT' },
  { id: 'stt-provider', label: 'Provider', context: 'STT' },
  { id: 'stt-audio-duration', label: 'Audio duration', context: 'STT' },
  { id: 'stt-input-tokens', label: 'Input tokens', context: 'STT' },
  { id: 'stt-output-tokens', label: 'Output tokens', context: 'STT' },

  // Interruption detail metrics
  { id: 'interruption-model', label: 'Model', context: 'Interruption' },
  { id: 'interruption-provider', label: 'Provider', context: 'Interruption' },
  { id: 'interruption-total-requests', label: 'Total requests', context: 'Interruption' },

  // Events
  { id: 'event-agent-state-changed', label: 'Agent state changed', context: 'Event' },
  { id: 'event-user-state-changed', label: 'User state changed', context: 'Event' },
  { id: 'event-conversation-item-added', label: 'Conversation item added', context: 'Event' },
  { id: 'event-user-input-transcribed', label: 'User input transcribed', context: 'Event' },
  { id: 'event-overlapping-speech', label: 'Overlapping speech', context: 'Event' },
];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
