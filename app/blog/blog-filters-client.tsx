"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BlogFilters } from "@/components/blog/blog-filters";
import type { BlogCategory } from "@/lib/constants/blog";

interface BlogFiltersClientProps {
  clusters: { id: string; name: string }[];
  initialSearch?: string;
  initialCategory?: BlogCategory;
  initialCluster?: string;
}

export function BlogFiltersClient({
  clusters,
  initialSearch,
  initialCategory,
  initialCluster,
}: BlogFiltersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/blog?${params.toString()}`);
  };

  return (
    <BlogFilters
      clusters={clusters}
      initialSearch={initialSearch}
      initialCategory={initialCategory}
      initialCluster={initialCluster}
      onSearchChange={(search) => updateParams({ search })}
      onCategoryChange={(category) => updateParams({ category })}
      onClusterChange={(cluster) => updateParams({ cluster })}
    />
  );
}
