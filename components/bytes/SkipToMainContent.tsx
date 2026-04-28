'use client';

export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="border-separator2 bg-bg1 text-fgAccent1 absolute top-0 left-0 z-9999 m-2 block -translate-y-[150%] rounded border p-5 underline underline-offset-4 focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
