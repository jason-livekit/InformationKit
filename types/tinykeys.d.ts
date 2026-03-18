declare module 'tinykeys' {
  export type KeyBindingMap = Record<string, (event: KeyboardEvent) => void>;
  export interface KeyBindingOptions {
    event?: string;
    timeout?: number;
  }
  export default function tinykeys(
    target: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions,
  ): () => void;
  export function createKeybindingsHandler(
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions,
  ): (event: KeyboardEvent) => void;
}
