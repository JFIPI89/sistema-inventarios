"use client";

import { useRouter } from "next/navigation";
import { LiveSearch, type LiveSearchItem } from "@/components/ui/live-search";

type LiveSearchFilterProps = {
  placeholder?: string;
  initialQuery?: string;
  basePath: string;
  /** Extra query params to preserve (e.g. view=planes). */
  preserveParams?: Record<string, string | undefined>;
  fetchSuggestions: (query: string) => Promise<LiveSearchItem[]>;
  /** If set, clicking a suggestion navigates to `${hrefPrefix}/${id}`. */
  hrefPrefix?: string;
  className?: string;
  inputClassName?: string;
};

export function LiveSearchFilter({
  placeholder,
  initialQuery = "",
  basePath,
  preserveParams,
  fetchSuggestions,
  hrefPrefix,
  className,
  inputClassName,
}: LiveSearchFilterProps) {
  const router = useRouter();

  function buildListUrl(q: string) {
    const params = new URLSearchParams();
    if (preserveParams) {
      for (const [key, value] of Object.entries(preserveParams)) {
        if (value) params.set(key, value);
      }
    }
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <LiveSearch
      placeholder={placeholder}
      initialQuery={initialQuery}
      className={className}
      inputClassName={inputClassName}
      fetchSuggestions={fetchSuggestions}
      onSelect={(item) => {
        if (hrefPrefix) {
          router.push(`${hrefPrefix}/${item.id}`);
          return;
        }
        const filterQ = item.subtitle?.split(" · ")[0]?.trim() || item.title;
        router.push(buildListUrl(filterQ));
      }}
      onSubmit={(q) => {
        router.push(buildListUrl(q));
      }}
    />
  );
}
