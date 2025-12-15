"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
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

interface EventFiltersProps {
  onFilterChange: (filters: EventFilters) => void;
  initialFilters?: EventFilters;
}

export interface EventFilters {
  search?: string;
  eventType?: string;
  category?: string;
  locationType?: string;
  upcoming?: boolean;
}

export function EventFilters({
  onFilterChange,
  initialFilters = {},
}: EventFiltersProps) {
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || "");

  const updateFilters = (newFilters: Partial<EventFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
    onFilterChange({});
  };

  const handleSearch = () => {
    updateFilters({ search: searchInput || undefined });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>

        {/* Quick Filters - Desktop */}
        <div className="hidden md:flex gap-2">
          <Select
            value={filters.eventType || "all"}
            onValueChange={(value) =>
              updateFilters({ eventType: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Event Type" />
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
            value={filters.category || "all"}
            onValueChange={(value) =>
              updateFilters({ category: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
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

          <Select
            value={filters.locationType || "all"}
            onValueChange={(value) =>
              updateFilters({ locationType: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATION_TYPES.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
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
                  value={filters.eventType || "all"}
                  onValueChange={(value) =>
                    updateFilters({
                      eventType: value === "all" ? undefined : value,
                    })
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
                  value={filters.category || "all"}
                  onValueChange={(value) =>
                    updateFilters({
                      category: value === "all" ? undefined : value,
                    })
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Location Type</label>
                <Select
                  value={filters.locationType || "all"}
                  onValueChange={(value) =>
                    updateFilters({
                      locationType: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {LOCATION_TYPES.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={clearFilters} variant="outline" className="flex-1">
                  Clear All
                </Button>
                <Button className="flex-1">Apply Filters</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Button */}
        <Button onClick={handleSearch} className="shrink-0">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchInput("");
                  updateFilters({ search: undefined });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.eventType && (
            <Badge variant="secondary" className="gap-1">
              {EVENT_TYPES.find((t) => t.value === filters.eventType)?.label}
              <button
                onClick={() => updateFilters({ eventType: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {EVENT_CATEGORIES.find((c) => c.value === filters.category)?.label}
              <button
                onClick={() => updateFilters({ category: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.locationType && (
            <Badge variant="secondary" className="gap-1">
              {LOCATION_TYPES.find((l) => l.value === filters.locationType)?.label}
              <button
                onClick={() => updateFilters({ locationType: undefined })}
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

      {/* Event Type Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!filters.eventType ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilters({ eventType: undefined })}
        >
          All
        </Button>
        {EVENT_TYPES.slice(0, 6).map((type) => (
          <Button
            key={type.value}
            variant={filters.eventType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() =>
              updateFilters({
                eventType:
                  filters.eventType === type.value ? undefined : type.value,
              })
            }
          >
            {type.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
