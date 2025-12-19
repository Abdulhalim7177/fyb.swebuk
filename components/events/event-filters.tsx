"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, Calendar, Tag, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  LOCATION_TYPES,
} from "@/lib/constants/events";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const currentType = searchParams.get("type") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentLocation = searchParams.get("location") || "";

  const hasActiveFilters = searchInput || currentType || currentCategory || currentLocation;

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 and clear section when filters change
    params.delete("page");
    params.delete("section");

    startTransition(() => {
      router.push(`/events?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/events");
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    updateFilters({ search: searchInput || null });
  };

  const activeFilterCount = [currentType, currentCategory, currentLocation, searchInput].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10 h-11"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateFilters({ search: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Filters - Desktop */}
        <div className="hidden md:flex gap-2">
          <Select
            value={currentType || "all"}
            onValueChange={(value) =>
              updateFilters({ type: value === "all" ? null : value })
            }
          >
            <SelectTrigger className="w-[150px] h-11">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Event Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentCategory || "all"}
            onValueChange={(value) =>
              updateFilters({ category: value === "all" ? null : value })
            }
          >
            <SelectTrigger className="w-[150px] h-11">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Events</SheetTitle>
              <SheetDescription>
                Narrow down your search with filters
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select
                  value={currentType || "all"}
                  onValueChange={(value) =>
                    updateFilters({ type: value === "all" ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={currentCategory || "all"}
                  onValueChange={(value) =>
                    updateFilters({ category: value === "all" ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EVENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" onClick={clearFilters} variant="outline" className="flex-1">
                  Clear All
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Button - Hidden on Desktop, Shown on Mobile */}
        <Button type="submit" className="shrink-0 md:hidden h-11">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>

        {/* Reset Button - Desktop */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="hidden md:flex shrink-0 h-11 w-11"
            title="Reset all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Loading Indicator */}
        {isPending && (
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <Sparkles className="h-4 w-4 animate-spin" />
          </div>
        )}
      </form>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchInput && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchInput}
              <button
                onClick={() => {
                  setSearchInput("");
                  updateFilters({ search: null });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentType && (
            <Badge variant="secondary" className="gap-1">
              {EVENT_TYPES.find((t) => t.value === currentType)?.label}
              <button
                onClick={() => updateFilters({ type: null })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentCategory && (
            <Badge variant="secondary" className="gap-1">
              {EVENT_CATEGORIES.find((c) => c.value === currentCategory)?.label}
              <button
                onClick={() => updateFilters({ category: null })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
