import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";

export interface RelationComboBoxOption {
  value: string | number;
  label: string;
}

interface RelationComboBoxProps {
  value?: string | number;
  onValueChange?: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  loadOptions: (params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<{
    data: RelationComboBoxOption[];
    total: number;
    hasMore: boolean;
  }>;
  pageSize?: number;
  enableSearch?: boolean;
  resolveOption?: (params: {
    value: string | number;
    options: RelationComboBoxOption[];
  }) => RelationComboBoxOption | null;
}

export function RelationComboBox({
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyText = "No option found.",
  disabled = false,
  className,
  loadOptions,
  pageSize = 20,
  enableSearch = true,
  resolveOption,
}: RelationComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<RelationComboBoxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolvingValue, setIsResolvingValue] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [resolvedValue, setResolvedValue] =
    useState<RelationComboBoxOption | null>(null);
  const [loadError, setLoadError] = useState(false);

  const selectedOption = resolvedValue;

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasLoadedInitialData = useRef(false);

  const loadData = useCallback(
    async (
      searchTerm: string = "",
      pageNum: number = 1,
      append: boolean = false
    ) => {
      // Prevent re-fetching if already loading
      if (loading) return;

      setLoading(true);
      setLoadError(false); // Reset error state on new attempt
      try {
        const result = await loadOptions({
          search: searchTerm,
          page: pageNum,
          pageSize,
        });

        // Filter out invalid options with null/undefined values
        const validOptions = result.data.filter(
          (option) => option.value != null && option.value !== ""
        );

        if (append) {
          setOptions((prev) => [...prev, ...validOptions]);
        } else {
          setOptions(validOptions);
        }

        setHasMore(result.hasMore);
        setTotal(result.total);
        setPage(pageNum);
        setLoadError(false); // Clear error on successful load
        hasLoadedInitialData.current = true;
      } catch (error) {
        console.error("Failed to load relation options:", error);
        setLoadError(true); // Set error state
        if (!append) {
          setOptions([]);
        }
        setHasMore(false); // Prevent further loading attempts
      } finally {
        setLoading(false);
      }
    },
    [loadOptions, pageSize]
  );

  // Resolve initial value if provided
  useEffect(() => {
    if (resolveOption && value) {
      setIsResolvingValue(true);
      try {
        const resolved = resolveOption({ value, options });
        setResolvedValue(resolved);
      } catch (error) {
        console.error("Failed to resolve initial value:", error);
        setResolvedValue(null);
      } finally {
        setIsResolvingValue(false);
      }
    } else {
      setResolvedValue(null);
      setIsResolvingValue(false);
    }
  }, [value, resolveOption, options]);

  // Initial load when opening
  useEffect(() => {
    if (open && options.length === 0) {
      loadData("", 1, false);
    }
  }, [open, loadData, options.length]);

  // Auto-load options when value exists but options are empty (for initial resolve)
  useEffect(() => {
    if (value && options.length === 0 && !loading && !open && !loadError && !hasLoadedInitialData.current) {
      // Load initial data to populate options for resolve
      loadData("", 1, false);
    }
  }, [value, options.length, loading, open, loadData, loadError]);

  // Handle search with debouncing
  const handleSearch = useCallback(
    (searchValue: string) => {
      setSearch(searchValue);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        loadData(searchValue, 1, false);
      }, 300);
    },
    [loadData]
  );

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (isNearBottom && hasMore && !loading && !loadError) {
        loadData(search, page + 1, true);
      }
    },
    [hasMore, loading, search, page, loadData, loadError]
  );

  // Reset when closing
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch("");
      setPage(1);
      setOptions([]);
      setHasMore(true);
      setLoadError(false); // Reset error state when reopening
      hasLoadedInitialData.current = false; // Reset for next time
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || isResolvingValue}
        >
          {isResolvingValue ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          {enableSearch && (
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={handleSearch}
            />
          )}
          <CommandList ref={listRef} onScroll={handleScroll}>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : loadError ? (
                <div className="flex items-center justify-center py-2 text-red-500">
                  Failed to load options. Try again.
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) => option.value != null && option.value !== "")
                .map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={String(option.value)}
                    onSelect={(currentValue) => {
                      const isSelected = String(option.value) === String(value);
                      const newValue = isSelected ? "" : option.value;
                      onValueChange?.(newValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              {loading && options.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading more...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
