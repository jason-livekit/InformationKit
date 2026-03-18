import { useEffect, useMemo, useRef, useState } from 'react';

/** Maintains a stable mapping of entry IDs to record keys when keys are renamed */
export function useStableKeyMapping<V>(record: Record<string, V> | undefined) {
  const keyToIdRef = useRef<Map<string, string>>(new Map());
  const idToKeyRef = useRef<Map<string, string>>(new Map());
  const nextIdRef = useRef(0);
  const canAddRef = useRef(!('' in (record || {})));
  const [, forceUpdate] = useState({});

  const generateId = () => {
    return `entry-${nextIdRef.current++}`;
  };

  // Update mappings when record changes
  // NOTE: Key renames are handled by updateKeyMapping before the record changes,
  // so we only need to handle actual additions and deletions here
  useEffect(() => {
    const initialRecord = !record || Object.keys(record).length === 0 ? { '': '' } : record;
    const currentKeys = new Set(Object.keys(initialRecord || {}));
    const existingKeys = new Set(keyToIdRef.current.keys());

    const newKeys = Array.from(currentKeys).filter((key) => !keyToIdRef.current.has(key));
    const removedKeys = Array.from(existingKeys).filter((key) => !currentKeys.has(key));
    canAddRef.current = !('' in (record || {}));

    if (newKeys.length > 0 || removedKeys.length > 0) {
      removedKeys.forEach((key) => {
        const id = keyToIdRef.current.get(key);
        if (id) {
          keyToIdRef.current.delete(key);
          idToKeyRef.current.delete(id);
        }
      });

      newKeys.forEach((key) => {
        const id = generateId();
        keyToIdRef.current.set(key, id);
        idToKeyRef.current.set(id, key);
      });

      forceUpdate({});
    }
  }, [record]);

  // Create entries with stable IDs, sorted to maintain consistent order
  const entries = useMemo(() => {
    if (!record) return [];
    const entries = Object.entries(record).map(([key, value]) => {
      let id = keyToIdRef.current.get(key);
      if (!id) {
        // Should never happen, but handle it just in case
        id = generateId();
        keyToIdRef.current.set(key, id);
        idToKeyRef.current.set(id, key);
      }
      return { id, key, value };
    });
    // Sort by stable ID to maintain consistent order regardless of object iteration order
    return entries.sort((a, b) => {
      const aNum = parseInt(a.id.replace('entry-', ''), 10);
      const bNum = parseInt(b.id.replace('entry-', ''), 10);
      return aNum - bNum;
    });
  }, [record]);

  const updateKeyMapping = (oldKey: string, newKey: string) => {
    const id = keyToIdRef.current.get(oldKey);
    if (id) {
      keyToIdRef.current.delete(oldKey);
      keyToIdRef.current.set(newKey, id);
      idToKeyRef.current.set(id, newKey);
    }
  };

  return { entries, canAddEntry: canAddRef.current, updateKeyMapping };
}
