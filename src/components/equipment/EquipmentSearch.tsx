"use client";

import { useState } from "react";
import { useEquipmentSearch } from "@/hooks/use-equipment-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search,
  SlidersHorizontal, 
  X, 
  Loader2,
  MapPin,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { EQUIPMENT_CATEGORIES as VALID_CATEGORIES } from "@/lib/constants";

// Match the exact categories accepted by the listing API.
const EQUIPMENT_CATEGORIES = [
  { value: "all", label: "All Categories" },
  ...VALID_CATEGORIES.map(name => ({ value: name, label: name })),
];

// Sort options
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Daily rate (low to high)" },
  { value: "price_desc", label: "Daily rate (high to low)" },
  { value: "newest", label: "Newest first" },
];

// Format price as currency
const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Format distance
const formatDistance = (distance: number | undefined): string => {
  if (distance === undefined) return "";
  return `${distance.toFixed(1)} km away`;
};

interface EquipmentCardProps {
  equipment: any;
}

// Equipment card component
const EquipmentCard = ({ equipment }: EquipmentCardProps) => {
  // Default image if none available
  const imageUrl = equipment.images && equipment.images.length > 0
    ? equipment.images[0]
    : "/images/placeholder.svg";

  // Primary price (daily rate or hourly rate)
  const primaryPrice = equipment.dailyRate || equipment.hourlyRate;
  const priceLabel = equipment.dailyRate ? "/day" : "/hour";

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={equipment.title}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
        {equipment.distance && (
          <Badge className="absolute top-2 right-2 bg-jacker-blue/90">
            <MapPin className="w-3 h-3 mr-1" />
            {formatDistance(equipment.distance)}
          </Badge>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg line-clamp-2">{equipment.title}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <span className="text-sm text-gray-500 line-clamp-1">{equipment.category}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-2 flex-grow">
        <p className="text-sm text-gray-600 line-clamp-2">{equipment.description}</p>
        {equipment.tags && equipment.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {equipment.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {equipment.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{equipment.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center border-t">
        <div className="font-semibold text-jacker-orange">
          {formatPrice(primaryPrice)}
          <span className="text-xs text-gray-500 font-normal">{priceLabel}</span>
        </div>
        <Button asChild size="sm">
          <Link href={`/routes/equipment/${equipment.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Equipment search component
export function EquipmentSearch() {
  // State for filters UI
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  // Use our custom hook for equipment search
  const {
    results,
    isLoading,
    isError,
    error,
    pagination,
    updateParams,
    searchParams,
    resetSearch,
  } = useEquipmentSearch();

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateParams({ query: e.target.value });
  };

  // Handle price range changes
  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    updateParams({ priceMin: value[0], priceMax: value[1] });
  };

  // Handle page changes for pagination
  const handlePageChange = (page: number) => {
    updateParams({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear all filters
  const handleClearFilters = () => {
    resetSearch();
    setPriceRange([0, 500]);
    setFiltersOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Search bar and filters */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-2 w-full">
          <div className="relative flex-grow">
            <Input
              placeholder="Search equipment..."
              className="pr-10"
              value={searchParams.query || ""}
              onChange={handleSearchChange}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Search Filters</SheetTitle>
                <SheetDescription>
                  Refine your equipment search
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                {/* Category filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={searchParams.category || "all"}
                    onValueChange={(value) => updateParams({ category: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Price range filter */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Price Range</Label>
                    <span className="text-sm text-gray-500">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                  />
                </div>
                
                {/* Location text filtering works with existing listing city/state data.
                    Distance searching will require geocoded listing coordinates. */}
                <div className="space-y-2">
                  <Label htmlFor="city-filter">City or state</Label>
                  <Input
                    id="city-filter"
                    value={searchParams.location || ""}
                    onChange={(event) => updateParams({ location: event.target.value })}
                    placeholder="e.g. Providence, RI"
                    maxLength={100}
                  />
                </div>

                {/* Sort options */}
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort Results</Label>
                  <Select
                    value={searchParams.sortBy || "relevance"}
                    onValueChange={(value) => updateParams({ sortBy: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <SheetFooter>
                <div className="flex justify-between w-full gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>
                  <SheetClose asChild>
                    <Button type="submit">Apply Filters</Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          {/* Sort dropdown for larger screens */}
          <div className="hidden md:flex">
            <Select
              value={searchParams.sortBy || "relevance"}
              onValueChange={(value) => updateParams({ sortBy: value as any })}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active filters display */}
        {(searchParams.category && searchParams.category !== "all" || 
          searchParams.priceMin || 
          searchParams.priceMax || 
          searchParams.location) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            
            {searchParams.category && searchParams.category !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {EQUIPMENT_CATEGORIES.find(c => c.value === searchParams.category)?.label}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => updateParams({ category: undefined })}
                />
              </Badge>
            )}
            
            {(searchParams.priceMin !== undefined || searchParams.priceMax !== undefined) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Price: {formatPrice(searchParams.priceMin || 0)} - {formatPrice(searchParams.priceMax || 1000)}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => {
                    updateParams({ priceMin: undefined, priceMax: undefined });
                    setPriceRange([0, 500]);
                  }}
                />
              </Badge>
            )}
            
            {searchParams.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {searchParams.location}
                <X className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => updateParams({ location: undefined })} />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={handleClearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12" data-testid="equipment-search-loading">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Searching equipment...</span>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="text-center py-12" data-testid="equipment-search-error">
          <p className="text-red-500">Error: {error?.message || "Failed to load results"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              updateParams({ ...searchParams });
            }}
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Results grid */}
      {!isLoading && !isError && (
        <>
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-500">
            {pagination.total === 0 
              ? "No equipment found" 
              : `Showing ${results.length} of ${pagination.total} items`}
          </div>
          
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="equipment-grid">
              {results.map((equipment) => (
                <EquipmentCard key={equipment.id} equipment={equipment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No equipment found with the current filters</p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 