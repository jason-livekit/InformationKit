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
  {
    id: 'room',
    label: 'Room',
    description: 'The LiveKit room this session ran in. Identifies the call so you can jump from a metric back to the source.',
  },
  {
    id: 'room-region',
    label: 'Region',
    context: 'Room',
    description: 'The LiveKit data-center region the room was hosted in (e.g. us-east, eu-west). Affects baseline media latency.',
  },
  {
    id: 'duration',
    label: 'Duration',
    description: 'Total wall-clock length of the session, from room join to disconnect.',
  },
  {
    id: 'participants',
    label: 'Participants',
    description: 'How many people and agents were in the room. Includes both human users and AI agents.',
  },
  {
    id: 'room-configuration',
    label: 'Room configuration',
    description: 'Server-side settings the room was created with — codec preferences, max participants, empty-timeout, etc.',
  },
  {
    id: 'metadata',
    label: 'Metadata',
    description: 'Free-form developer-supplied data attached to the room or participants. Useful for app-level tags like user IDs or feature flags.',
  },
  {
    id: 'e2e-encryption',
    label: 'E2E encryption',
    description: 'Whether end-to-end encryption was enabled for media in this room.',
  },
  {
    id: 'recording',
    label: 'Recording',
    description: 'Whether the session was recorded (egress) and where the artifact landed.',
  },

  // Agent configuration
  {
    id: 'agent-configuration',
    label: 'Agent configuration',
    description: 'The high-level setup of the agent that ran in this session — which providers, models, and prompts were wired together.',
  },
  {
    id: 'sdk-version',
    label: 'SDK / Version',
    description: 'The Agents SDK language and version the worker was running. Important when comparing behavior across releases.',
  },
  {
    id: 'agent-region',
    label: 'Region',
    context: 'Agent',
    description: 'The region the agent worker was dispatched from. Combined with Room region, determines the network path between agent and media server.',
  },
  {
    id: 'agent-llm',
    label: 'LLM',
    description: 'The large-language-model leg of the agent pipeline — which provider/model handled reasoning and response generation.',
  },
  {
    id: 'agent-tts',
    label: 'TTS',
    description: 'The text-to-speech leg — which provider/voice turned the LLM’s text into spoken audio.',
  },
  {
    id: 'agent-stt',
    label: 'STT',
    description: 'The speech-to-text leg — which provider transcribed the user’s audio into text for the LLM.',
  },

  // Top-line latency / turn metrics
  {
    id: 'avg-e2e-latency',
    label: 'Avg E2E latency',
    description: 'Mean end-to-end response latency across the session: time from the user finishing speaking to the agent starting to speak back.',
  },
  {
    id: 'avg-llm-ttft',
    label: 'Avg LLM TTFT',
    description: 'Time to first token from the LLM — how long after the prompt was sent until the first response token streamed back. Lower is faster perceived response.',
  },
  {
    id: 'avg-tts-ttfb',
    label: 'Avg TTS TTFB',
    description: 'Time to first byte from TTS — how long after we asked the voice provider to speak until the first audio chunk arrived.',
  },
  {
    id: 'avg-transcription-delay',
    label: 'Avg transcription delay',
    description: 'Lag between the user finishing a phrase and the STT producing the final transcript the LLM acts on.',
  },
  {
    id: 'avg-end-of-turn-delay',
    label: 'Avg end of turn delay',
    description: 'How long after the user stops talking before the agent considers their turn over and starts responding.',
  },
  {
    id: 'avg-on-user-turn-completed-delay',
    label: 'Avg on_user_turn_completed delay',
    description: 'Time spent inside the user-supplied on_user_turn_completed hook — custom logic that runs after every user turn (e.g. RAG lookups).',
  },

  // Interruption metrics
  {
    id: 'avg-detection-delay',
    label: 'Avg detection delay',
    description: 'How long it took the agent to notice that the user had started speaking over it (barge-in). Lower means snappier interruption handling.',
  },
  {
    id: 'interruptions',
    label: 'Interruptions',
    description: 'Count of times the user successfully interrupted the agent mid-utterance.',
  },
  {
    id: 'backchannels',
    label: 'Backchannels',
    description: 'Short user utterances (“mm-hmm”, “yeah”) that the agent recognized as acknowledgments rather than full interruptions.',
  },

  // Usage rollups
  {
    id: 'llm-input-output-tokens',
    label: 'LLM input / output tokens',
    description: 'Total tokens sent to and received from the LLM across the whole session. Primary driver of LLM cost.',
  },
  {
    id: 'tts-characters',
    label: 'TTS characters',
    description: 'Total characters synthesized by the TTS provider over the session. Most TTS pricing is per-character.',
  },
  {
    id: 'stt-duration',
    label: 'STT duration',
    description: 'Total audio time submitted to STT. Most STT pricing is per-minute of audio processed.',
  },

  // LLM detail metrics
  {
    id: 'llm-model',
    label: 'Model',
    context: 'LLM',
    description: 'The specific LLM model identifier used (e.g. gpt-4o-mini, claude-haiku-4-5).',
  },
  {
    id: 'llm-provider',
    label: 'Provider',
    context: 'LLM',
    description: 'Which company’s LLM API was called (OpenAI, Anthropic, Google, etc.).',
  },
  {
    id: 'llm-input-tokens',
    label: 'Input tokens',
    context: 'LLM',
    description: 'Tokens sent to the LLM as prompt context, summed across all turns.',
  },
  {
    id: 'llm-input-text-tokens',
    label: 'Input text tokens',
    context: 'LLM',
    description: 'Subset of input tokens that came from plain text (transcripts, system prompt, history).',
  },
  {
    id: 'llm-input-audio-tokens',
    label: 'Input audio tokens',
    context: 'LLM',
    description: 'Subset of input tokens for raw audio frames sent to a speech-native LLM (e.g. Realtime API).',
  },
  {
    id: 'llm-input-image-tokens',
    label: 'Input image tokens',
    context: 'LLM',
    description: 'Subset of input tokens consumed by images attached to the prompt.',
  },
  {
    id: 'llm-input-cached-tokens',
    label: 'Input cached tokens',
    context: 'LLM',
    description: 'Input tokens that were served from the provider’s prompt cache. Usually billed at a steep discount.',
  },
  {
    id: 'llm-input-cached-text-tokens',
    label: 'Input cached text tokens',
    context: 'LLM',
    description: 'Cached-input tokens that were specifically text.',
  },
  {
    id: 'llm-input-cached-audio-tokens',
    label: 'Input cached audio tokens',
    context: 'LLM',
    description: 'Cached-input tokens that were specifically audio.',
  },
  {
    id: 'llm-input-cached-image-tokens',
    label: 'Input cached image tokens',
    context: 'LLM',
    description: 'Cached-input tokens that were specifically images.',
  },
  {
    id: 'llm-output-tokens',
    label: 'Output tokens',
    context: 'LLM',
    description: 'Tokens generated by the LLM across all turns. Drives output-side cost and response length.',
  },
  {
    id: 'llm-output-text-tokens',
    label: 'Output text tokens',
    context: 'LLM',
    description: 'Subset of output tokens that were text (the spoken response, transcribed).',
  },
  {
    id: 'llm-output-audio-tokens',
    label: 'Output audio tokens',
    context: 'LLM',
    description: 'Subset of output tokens for raw audio emitted by a speech-native LLM.',
  },
  {
    id: 'llm-session-duration',
    label: 'Session duration',
    context: 'LLM',
    description: 'How long the LLM connection was held open this session. Relevant for Realtime / streaming APIs that bill on connection time.',
  },

  // TTS detail metrics
  {
    id: 'tts-model',
    label: 'Model',
    context: 'TTS',
    description: 'The specific TTS model/voice identifier used.',
  },
  {
    id: 'tts-provider',
    label: 'Provider',
    context: 'TTS',
    description: 'Which company’s TTS API was called (ElevenLabs, Cartesia, OpenAI, etc.).',
  },
  {
    id: 'tts-audio-duration',
    label: 'Audio duration',
    context: 'TTS',
    description: 'Total seconds of audio produced by TTS — roughly, how long the agent was talking.',
  },
  {
    id: 'tts-characters-count',
    label: 'Characters count',
    context: 'TTS',
    description: 'Total characters submitted to the TTS provider for synthesis.',
  },
  {
    id: 'tts-input-tokens',
    label: 'Input tokens',
    context: 'TTS',
    description: 'For token-billed TTS providers, tokens sent in (instead of characters).',
  },
  {
    id: 'tts-output-tokens',
    label: 'Output tokens',
    context: 'TTS',
    description: 'For token-billed TTS providers, tokens produced.',
  },

  // STT detail metrics
  {
    id: 'stt-model',
    label: 'Model',
    context: 'STT',
    description: 'The specific STT model identifier used (e.g. nova-3, whisper-large).',
  },
  {
    id: 'stt-provider',
    label: 'Provider',
    context: 'STT',
    description: 'Which company’s STT API was called (Deepgram, AssemblyAI, OpenAI, etc.).',
  },
  {
    id: 'stt-audio-duration',
    label: 'Audio duration',
    context: 'STT',
    description: 'Total seconds of user audio transcribed.',
  },
  {
    id: 'stt-input-tokens',
    label: 'Input tokens',
    context: 'STT',
    description: 'For token-billed STT providers, tokens charged on the input side.',
  },
  {
    id: 'stt-output-tokens',
    label: 'Output tokens',
    context: 'STT',
    description: 'For token-billed STT providers, tokens charged on the output (transcript) side.',
  },

  // Interruption detail metrics
  {
    id: 'interruption-model',
    label: 'Model',
    context: 'Interruption',
    description: 'The specific VAD / turn-detection model used to decide when the user is done speaking (e.g. Silero, LiveKit turn-detector).',
  },
  {
    id: 'interruption-provider',
    label: 'Provider',
    context: 'Interruption',
    description: 'The provider behind the turn-detection model.',
  },
  {
    id: 'interruption-total-requests',
    label: 'Total requests',
    context: 'Interruption',
    description: 'How many times turn-detection was invoked across the session.',
  },

  // Events
  {
    id: 'event-agent-state-changed',
    label: 'Agent state changed',
    context: 'Event',
    description: 'Fires every time the agent transitions between states like listening, thinking, and speaking.',
  },
  {
    id: 'event-user-state-changed',
    label: 'User state changed',
    context: 'Event',
    description: 'Fires when the user transitions between speaking and silent (or away).',
  },
  {
    id: 'event-conversation-item-added',
    label: 'Conversation item added',
    context: 'Event',
    description: 'A new message was appended to the conversation history — a user turn, an agent turn, or a tool call.',
  },
  {
    id: 'event-user-input-transcribed',
    label: 'User input transcribed',
    context: 'Event',
    description: 'STT produced a final (or interim) transcript for a user utterance.',
  },
  {
    id: 'event-overlapping-speech',
    label: 'Overlapping speech',
    context: 'Event',
    description: 'User and agent were detected speaking at the same time — useful for diagnosing barge-in handling.',
  },
];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
