"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
  () => import("agentation").then((m) => m.Agentation),
  { ssr: false },
);

/**
 * Dev-only Agentation overlay. The root layout only mounts this when
 * NODE_ENV === "development" so it does not run in production.
 */
export function AgentationDev() {
  return (
    <Agentation
      endpoint="http://localhost:4747"
      onSessionCreated={(sessionId) => {
        console.log("[Agentation] session:", sessionId);
      }}
    />
  );
}
