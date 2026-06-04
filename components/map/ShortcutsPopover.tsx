'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/bytes/Popover';

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: '|', desc: 'Commit a cell and open the next' },
  { keys: '| |', desc: 'Type a pipe in an empty cell to merge columns' },
  { keys: 'Enter', desc: 'New row (on the trailing empty cell) / move down' },
  { keys: '⇧ Enter', desc: 'Move to the row above' },
  { keys: '--- ', desc: 'Turn the row above into a header' },
  { keys: 'Tab / ⇧ Tab', desc: 'Move between cells (never creates structure)' },
  { keys: '← → ↑ ↓', desc: 'Navigate cells' },
  { keys: 'Backspace', desc: 'At cell start: shrink merge / delete cell / row' },
  { keys: '⌘/Ctrl Backspace', desc: 'At cell end: mirror of backspace' },
  { keys: '⌘/Ctrl B / I', desc: 'Bold / italic the selection' },
  { keys: '⌘/Ctrl ⇧ Enter', desc: 'Add a row below' },
  { keys: '⌘/Ctrl Z / ⇧ Z', desc: 'Undo / redo' },
  { keys: 'Esc', desc: 'Stop editing / deselect' },
  { keys: '? or ⌘/Ctrl ?', desc: 'Open this shortcuts panel' },
];

export function ShortcutsPopover() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (e.key === '?' && (e.metaKey || e.ctrlKey || !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Keyboard shortcuts (?)"
          className="border-separator1 bg-bg0 text-fg2 hover:text-fg0 hover:bg-bg2 fixed bottom-5 right-5 z-40 flex h-9 w-9 items-center justify-center rounded-full border shadow-md"
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end" side="top">
        <h3 className="text-fg0 mb-2 text-sm font-semibold">Keyboard shortcuts</h3>
        <div className="flex flex-col gap-1">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-fg3 flex-1">{s.desc}</span>
              <kbd className="border-separator1 bg-bg1 text-fg2 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
