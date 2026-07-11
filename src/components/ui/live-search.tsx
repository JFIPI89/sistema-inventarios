"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LiveSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  disabled?: boolean;
};

type LiveSearchProps = {
  placeholder?: string;
  initialQuery?: string;
  minChars?: number;
  debounceMs?: number;
  showSubmitButton?: boolean;
  submitLabel?: string;
  className?: string;
  inputClassName?: string;
  fetchSuggestions: (query: string) => Promise<LiveSearchItem[]>;
  onSelect: (item: LiveSearchItem) => void;
  onSubmit?: (query: string) => void;
  /** Controlled clear: bump to reset input after parent actions (e.g. POS checkout). */
  resetKey?: number | string;
};

export function LiveSearch({
  placeholder = "Buscar...",
  initialQuery = "",
  minChars = 1,
  debounceMs = 250,
  showSubmitButton = true,
  submitLabel = "Buscar",
  className,
  inputClassName,
  fetchSuggestions,
  onSelect,
  onSubmit,
  resetKey,
}: LiveSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<LiveSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(initialQuery);
  }, [resetKey, initialQuery]);

  const load = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      const seq = ++seqRef.current;
      if (trimmed.length < minChars) {
        setItems([]);
        setOpen(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const next = await fetchSuggestions(trimmed);
        if (seq !== seqRef.current) return;
        setItems(next);
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        if (seq !== seqRef.current) return;
        setItems([]);
        setOpen(false);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    },
    [fetchSuggestions, minChars]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs, load]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function selectItem(item: LiveSearchItem) {
    if (item.disabled) return;
    onSelect(item);
    setQuery("");
    setItems([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function submit() {
    const trimmed = query.trim();
    setOpen(false);
    onSubmit?.(trimmed);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open || items.length === 0) return;
      setActiveIndex((i) => (i + 1) % items.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open || items.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && items[activeIndex]) {
        selectItem(items[activeIndex]!);
        return;
      }
      submit();
    }
  }

  const showEmpty =
    open && !loading && query.trim().length >= minChars && items.length === 0;

  return (
    <div ref={rootRef} className={cn("relative flex w-full flex-col gap-2 sm:flex-row", className)}>
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (items.length > 0 || query.trim().length >= minChars) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className={inputClassName}
        />
        {(open && (items.length > 0 || showEmpty || loading)) && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-md"
          >
            {loading && items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Buscando…</li>
            ) : showEmpty ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados para “{query.trim()}”
              </li>
            ) : (
              items.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50",
                      index === activeIndex && "bg-muted/60"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectItem(item)}
                  >
                    <span className="font-medium">{item.title}</span>
                    {item.subtitle ? (
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {showSubmitButton ? (
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 sm:w-auto"
          disabled={loading}
          onClick={submit}
        >
          {loading ? "Buscando..." : submitLabel}
        </Button>
      ) : null}
    </div>
  );
}
