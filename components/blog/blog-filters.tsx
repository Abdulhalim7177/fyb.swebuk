"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal, Filter } from "lucide-react";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/constants/blog";
import { cn } from "@/lib/utils";

interface BlogFiltersProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: BlogCategory | undefined) => void;
  onClusterChange?: (clusterId: string | undefined) => void;
  clusters?: { id: string; name: string }[];
  initialSearch?: string;
  initialCategory?: BlogCategory;
  initialCluster?: string;
}

const categoryColors: Record<string, string> = {
  tutorials: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
  news: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
  projects: "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
  events: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
  career: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 dark:text-pink-400",
  resources: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 dark:text-cyan-400",
  community: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400",
  other: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 dark:text-gray-400",
};

export function BlogFilters({
  onSearchChange,
  onCategoryChange,
  onClusterChange,
  clusters = [],
  initialSearch = "",
  initialCategory,
  initialCluster,
}: BlogFiltersProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<BlogCategory | undefined>(initialCategory);
  const [cluster, setCluster] = useState<string | undefined>(initialCluster);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(search);
  };

  const handleCategoryChange = (value: BlogCategory | undefined) => {
    setCategory(value);
    onCategoryChange(value);
  };

  const handleClusterChange = (value: string) => {
    const newCluster = value === "all" ? undefined : value;
    setCluster(newCluster);
    onClusterChange?.(newCluster);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(undefined);
    setCluster(undefined);
    onSearchChange("");
    onCategoryChange(undefined);
    onClusterChange?.(undefined);
  };

  const hasActiveFilters = search || category || cluster;

  return (
    <Card className="p-4 border-0 bg-muted/30">
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles, tutorials, and more..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-background border-0 shadow-sm text-base"
            />
          </div>
          <Button type="submit" size="lg" className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        {/* Category Pills */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filter by category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                category === undefined
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              All Posts
            </button>
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value as BlogCategory)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  category === cat.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : categoryColors[cat.value] || "bg-muted text-muted-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Cluster Filter */}
            {clusters.length > 0 && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={cluster || "all"} onValueChange={handleClusterChange}>
                  <SelectTrigger className="w-[200px] bg-background border-0 shadow-sm">
                    <SelectValue placeholder="Filter by cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clusters</SelectItem>
                    {clusters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Category Pills for quick filtering (standalone component)
export function CategoryPills({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory?: BlogCategory;
  onCategoryChange: (category: BlogCategory | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange(undefined)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          selectedCategory === undefined
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
        )}
      >
        All
      </button>
      {BLOG_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value as BlogCategory)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selectedCategory === cat.value
              ? "bg-primary text-primary-foreground shadow-md"
              : categoryColors[cat.value] || "bg-muted text-muted-foreground"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
