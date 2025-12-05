import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-full w-full flex flex-col gap-4 items-center justify-center bg-bg0">
      <div className="flex flex-col gap-4 max-w-xl">
        <h1 className="text-4xl">Livekit Prototyping Starter Kit</h1>
        <p className="text-fg-1">
          This is a starter kit to help you vibe code faster without having to
          access the monorepo.
        </p>
        <p className="text-fg-1">
          This kit is designed to help you get started with Livekit and build
          your own prototypes.
        </p>
        <div className="flex flex-row gap-2">
          <Button variant="primary">
            View Github Repo
          </Button>
          <Button variant="secondary">
            <Link href="/component-examples">View component examples</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
