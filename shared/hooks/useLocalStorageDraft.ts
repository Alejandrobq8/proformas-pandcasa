"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stored<T> = { data: T; savedAt: string };

export function useLocalStorageDraft<T>(key: string) {
  const keyRef = useRef(key);
  const [draft, setDraft] = useState<T | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyRef.current);
      if (!raw) return;
      const stored = JSON.parse(raw) as Stored<T>;
      if (stored?.data) {
        setDraft(stored.data);
        setHasDraft(true);
        setDraftSavedAt(stored.savedAt ?? null);
      }
    } catch {
      // malformed JSON or storage unavailable
    }
  }, []);

  const saveDraft = useCallback((data: T) => {
    try {
      localStorage.setItem(
        keyRef.current,
        JSON.stringify({ data, savedAt: new Date().toISOString() } satisfies Stored<T>)
      );
    } catch {
      // quota exceeded or storage unavailable
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(keyRef.current);
    } catch {
      // storage unavailable
    }
    setHasDraft(false);
    setDraft(null);
    setDraftSavedAt(null);
  }, []);

  return { draft, hasDraft, draftSavedAt, saveDraft, clearDraft };
}
