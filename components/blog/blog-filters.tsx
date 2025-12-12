"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/constants/blog";

interface BlogFiltersProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: BlogCategory | undefined) => void;
  onClusterChange?: (clusterId: string | undefined) => void;
  clusters?: { id: string; name: string }[];
  initialSearch?: string;
  initialCategory?: BlogCategory;
  initialCluster?: string;
}

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

  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? undefined : (value as BlogCategory);
    setCategory(newCategory);
    onCategoryChange(newCategory);
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
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search blog posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <Select value={category || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {BLOG_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cluster Filter */}
        {clusters.length > 0 && (
          <Select value={cluster || "all"} onValueChange={handleClusterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Clusters" />
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
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}

// Category Pills for quick filtering
export function CategoryPills({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory?: BlogCategory;
  onCategoryChange: (category: BlogCategory | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === undefined ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(undefined)}
      >
        All
      </Button>
      {BLOG_CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={selectedCategory === cat.value ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(cat.value as BlogCategory)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  );
}
