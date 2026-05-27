import type { Card } from './types';

/**
 * The default demo card set: LiveKit Cloud terminology. Each card is a term whose
 * definition is reachable via the info-icon popover on the card. Participants sort
 * and group the terms to surface how they think the product's vocabulary fits together.
 *
 * The order below roughly follows the order the terms were supplied in; participants
 * are free to reorder everything, so the starting order is just a neutral baseline.
 */
export const CARDS: Card[] = [
  {
    id: 'agent',
    label: 'Agent',
    description: 'AI agents interact with users through realtime media and data streams.',
  },
  {
    id: 'api-key',
    label: 'API key',
    description: 'A unique, alphanumeric code used to identify and authenticate.',
  },
  {
    id: 'secret',
    label: 'Secret',
    description: 'A secure credential used to authenticate, authorize, and encrypt data.',
  },
  {
    id: 'environment-variable',
    label: 'Environment variable',
    description:
      'A dynamic name-value pair set outside of an application’s source code.',
  },
  {
    id: 'webhook',
    label: 'Webhook',
    description: 'An automated, event-driven message sent between apps.',
  },
  {
    id: 'telephony',
    label: 'Telephony',
    description:
      'The delivery of voice calls, SMS, and multimedia messaging over the internet.',
  },
  {
    id: 'sip',
    label: 'SIP',
    description:
      'Session Initiation Protocol, the digital "signaling" rulebook used to establish, manage, and terminate real-time multimedia communication sessions (like voice and video calls) over the internet.',
  },
  {
    id: 'trunk',
    label: 'Trunk',
    description:
      'A virtual connection (an Elastic SIP Trunk) that bridges your local business phone system to the internet.',
  },
  {
    id: 'dispatch-rule',
    label: 'Dispatch rule',
    description: 'Determines which room each inbound SIP caller joins.',
  },
  {
    id: 'egress',
    label: 'Egress',
    description:
      'An API that exports live media out of a real-time WebRTC session and sends it to an external destination.',
  },
  {
    id: 'ingress',
    label: 'Ingress',
    description: 'An API that imports live external media streams into a LiveKit room.',
  },
  {
    id: 'session',
    label: 'Session',
    description:
      'An active, real-time connection between an application (or user) and a LiveKit server.',
  },
  {
    id: 'builder',
    label: 'Builder',
    description:
      'Lets you prototype and deploy simple voice agents through your browser, without writing any code.',
  },
  {
    id: 'console',
    label: 'Console',
    description: 'A web-based tool that allows you to debug your agents in realtime.',
  },
  {
    id: 'latency',
    label: 'Latency',
    description: 'The time delay between a user’s action and a system’s response.',
  },
  {
    id: 'uptime',
    label: 'Uptime',
    description:
      'The amount of time a machine, system, or website is fully operational and available to users.',
  },
  {
    id: 'embed-widget',
    label: 'Embed widget',
    description: 'Adds a LiveKit Cloud agent to any website without building a frontend.',
  },
  {
    id: 'version',
    label: 'Version',
    description: 'An iterative saved state for a deployed AI agent.',
  },
  {
    id: 'deployment',
    label: 'Deployment',
    description: 'Push code to the cloud platform so it’s accessible to users.',
  },
  {
    id: 'build',
    label: 'Build',
    description: 'A compiled container image of an AI voice or video agent.',
  },
  {
    id: 'log',
    label: 'Log',
    description:
      'A recorded diagnostic or system event that tracks the lifecycle, behavior, and errors.',
  },
  {
    id: 'trace',
    label: 'Trace',
    description:
      'An execution trail that logs and maps out the lifecycle of a realtime session over time.',
  },
  {
    id: 'region',
    label: 'Region',
    description:
      'A specific geographic data center location where endpoints are hosted.',
  },
  {
    id: 'observability',
    label: 'Observability',
    description: 'Comprehensive tracking and analysis of your sessions.',
  },
  {
    id: 'agent-insight',
    label: 'Agent insight',
    description:
      'A built-in observability stack optimized for voice agents that includes transcripts, traces, and logs in a unified timeline with actual audio recordings.',
  },
  {
    id: 'webrtc',
    label: 'WebRTC',
    description:
      'The core transport layer that enables low-latency, real-time streaming of audio, video, and data over the web.',
  },
  {
    id: 'realtime-transport',
    label: 'Realtime transport',
    description:
      'The core transport layer that enables low-latency, real-time streaming of audio, video, and data.',
  },
  {
    id: 'inference',
    label: 'Inference',
    description: 'Provides access to many of the best models and providers for voice agents.',
  },
  {
    id: 'custom-voice',
    label: 'Custom voice',
    description: 'Lets you create a voice clone from a short audio clip.',
  },
  {
    id: 'cloned-voice',
    label: 'Cloned voice',
    description:
      'A synthetic voice generated from a short audio sample of a real person, used to produce speech that mimics their tone and style.',
  },
  {
    id: 'phone-number',
    label: 'Phone number',
  },
  {
    id: 'simulation',
    label: 'Simulation',
    description:
      'A controlled, scripted run of an AI agent against synthetic inputs used to test behavior without involving real users.',
  },
  {
    id: 'evaluation',
    label: 'Evaluation',
    description:
      'The process of scoring an agent’s performance against defined criteria across one or more test scenarios.',
  },
  {
    id: 'run',
    label: 'Run',
    description:
      'A single execution of an agent, simulation, or evaluation, capturing inputs, outputs, traces, and metrics for that invocation.',
  },
  {
    id: 'test-suite',
    label: 'Test suite',
    description:
      'A collection of related scenarios and evaluations grouped together to validate an agent’s behavior across many situations.',
  },
  {
    id: 'scenario',
    label: 'Scenario',
    description:
      'A specific test case defining inputs, expected behavior, and pass criteria for evaluating an agent.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description:
      'Aggregated data and visualizations that surface usage, performance, and quality trends across sessions, agents, and projects.',
  },
  {
    id: 'participant',
    label: 'Participant',
    description:
      'An entity (user, agent, or service) connected to a LiveKit room that can publish or subscribe to audio, video, or data tracks.',
  },
  {
    id: 'data-transfer',
    label: 'Data transfer',
    description:
      'The volume of media and data bytes exchanged between participants and LiveKit’s infrastructure, often used as a billing and usage metric.',
  },
  {
    id: 'room',
    label: 'Room',
    description: 'A virtual, real-time communication space where a session takes place.',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    description:
      'The dashboard-level container that groups your LiveKit projects, agents, members, and settings under one organization.',
  },
  {
    id: 'event',
    label: 'Event',
    description:
      'A discrete, timestamped occurrence within a session (participant joined, track published, agent state changed, etc.) used for observability and automation.',
  },
  {
    id: 'metric',
    label: 'Metric',
    description:
      'A quantitative measurement (latency, packet loss, audio level, token usage, etc.) collected during a session for monitoring and analytics.',
  },
  {
    id: 'track',
    label: 'Track',
    description:
      'An individual audio, video, or data stream published by a participant into a LiveKit room.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description:
      'Configuration for a project, agent, workspace, or account in the LiveKit dashboard.',
  },
  {
    id: 'billing',
    label: 'Billing',
    description:
      'The section of the dashboard where you manage payment methods, plans, invoices, and charges for LiveKit usage.',
  },
  {
    id: 'usage',
    label: 'Usage',
    description:
      'A view of how much of each LiveKit resource (sessions, minutes, data transfer, inference, etc.) has been consumed over a given period.',
  },
  {
    id: 'concurrency',
    label: 'Concurrency',
    description:
      'The number of simultaneous sessions, participants, or agent instances active at one time.',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    description:
      'A billed statement detailing LiveKit charges over a billing period, available for download in the dashboard.',
  },
  {
    id: 'support',
    label: 'Support',
    description:
      'The channel for contacting LiveKit’s team to get help with technical issues, account questions, or product feedback.',
  },
  {
    id: 'model',
    label: 'Model',
    description:
      'A specific AI model (e.g., STT, TTS, LLM) available through LiveKit Inference or configured directly for an agent.',
  },
  {
    id: 'provider',
    label: 'Provider',
    description:
      'The underlying vendor (e.g., OpenAI, Deepgram, ElevenLabs) that supplies a model accessible through LiveKit Inference.',
  },
];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
