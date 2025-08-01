import { cn } from "@/lib/utils";
import { useRef, useMemo } from "react";
import { proxy, useSnapshot } from "valtio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EForm } from "../eform/eform";
import { Filter, Trash2 } from "lucide-react";

export interface FilterConfig {
  key: string;
  label: string;
  type:
    | "text"
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "number"
    | "boolean"
    | "relation";
  options?: { value: string | boolean; label: string }[];
  relationConfig?: import("../ecrud/types").ModelRelationConfig;
  placeholder?: string;
  defaultValue?: any;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
}

interface EFilterProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
  onReset: () => void;
  onRemoveFilter: (key: string) => void;
  className?: string;
  compact?: boolean; // Hide text in compact mode
  apiFunction?: any; // For relation filters
}

export const EFilter = (props: EFilterProps) => {
  const { apiFunction, compact = false } = props;
  const write = useRef(
    proxy({
      popoverOpen: false,
    })
  ).current;

  // Create stable relation configs using the same backend API as forms
  const relationConfigs = useMemo(() => {
    const configs: Record<string, any> = {};
    
    props.filters.forEach((filter) => {
      if (filter.type === "relation" && filter.relationConfig && apiFunction) {
        // Create a stable loadOptions function that won't cause infinite loops
        const loadOptions = async ({ search = "", page = 1, pageSize = 100 }: any) => {
          try {
            // For filters, we load all available options from the relation model
            // Use the same nested_list API but with a special approach for filters
            const params: any = {
              action: "nested_list", 
              nested_model: filter.relationConfig!.model,
              parent_id: "filter", // Special identifier for filter usage
              search,
              page,
              limit: pageSize,
              fields: filter.relationConfig!.labelFields.join(','),
            };

            // Add filters if specified
            if (filter.relationConfig!.filters) {
              Object.assign(params, filter.relationConfig!.filters);
            }

            // Add include for related models if specified
            if (filter.relationConfig!.include && filter.relationConfig!.include.length > 0) {
              params.include = filter.relationConfig!.include.join(',');
            }

            console.log(`Loading filter options with params:`, params);
            const response = await apiFunction(params);
            console.log(`Filter response:`, response);

            if (response.success && response.data) {
              console.log(`Received ${response.data.length} ${filter.relationConfig!.model} records for filter`);
              
              const options = response.data.map((item: any, index: number) => {
                try {
                  return {
                    value: String(item.id),
                    label: filter.relationConfig!.renderLabel!(item),
                  };
                } catch (labelError) {
                  console.error(`Error rendering label for item ${index}:`, labelError, item);
                  // Fallback label
                  return {
                    value: String(item.id),
                    label: `Item ${item.id}`,
                  };
                }
              });

              return {
                data: options,
                total: response.total || options.length,
                hasMore: page * pageSize < (response.total || options.length),
              };
            }
          } catch (error) {
            console.error(`Failed to load ${filter.relationConfig!.model} options for filter:`, error);
          }

          return { data: [], total: 0, hasMore: false };
        };

        configs[filter.key] = {
          pageSize: filter.relationConfig.pageSize || 100,
          enableSearch: filter.relationConfig.enableSearch !== false,
          loadOptions,
          resolve: ({ value, options }: any) => {
            if (!value) return null;
            const found = options?.find((opt: any) => String(opt.value) === String(value));
            if (found) {
              return { value: found.value, label: found.label };
            }
            return null;
          },
        };
      }
    });
    
    return configs;
  }, [props.filters, apiFunction]);
  const read = useSnapshot(write);

  const { filters, values, onApply, onReset, onRemoveFilter, className } =
    props;

  const handleFilterSubmit = (formData: any) => {
    onApply(formData);
    write.popoverOpen = false;
  };

  const handleFilterReset = () => {
    onReset();
    write.popoverOpen = false;
  };

  const getFilterInitialData = () => {
    return { ...values };
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover
        open={read.popoverOpen}
        onOpenChange={(open) => (write.popoverOpen = open)}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter size={16} className={compact ? "" : "mr-2"} />
            {!compact && "Filter"}
            {Object.keys(values).length > 0 && (
              <Badge variant="secondary" className={compact ? "ml-1 -mr-1" : "ml-2"}>
                {Object.keys(values).length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Data</h4>
              <Button variant="ghost" size="sm" onClick={handleFilterReset}>
                Reset
              </Button>
            </div>
            <EForm
              data={getFilterInitialData()}
              onSubmit={({ write: formData }) => handleFilterSubmit(formData)}
            >
              {({ Field }) => (
                <div className="space-y-3">
                  {filters.map((filter) => {
                    // Get the pre-computed relation config to prevent infinite loops
                    const relationConfig = relationConfigs[filter.key];
                    
                    return (
                      <div key={filter.key} className="flex items-end gap-2">
                        <Field
                          name={filter.key}
                          label={filter.label}
                          type={filter.type as any}
                          className={"flex-1"}
                          options={filter.options?.map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                          }))}
                          relationConfig={relationConfig}
                        />
                        {values[filter.key] && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => onRemoveFilter(filter.key)}
                            className="h-8 w-8 p-0 mb-[2px]"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex justify-end gap-2 pt-2 ">
                    <Button type="submit" size="sm" className="bg-(--esensi-color) text-(--esensi-color-i) hover:bg-(--esensi-color-alt)">
                      Filter Data
                    </Button>
                  </div>
                </div>
              )}
            </EForm>
          </div>
        </PopoverContent>
      </Popover>

      {/* {Object.keys(values).length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {Object.entries(values).map(([key, value]) => {
            const filter = filters.find(f => f.key === key);
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {filter?.label}: {value}
                <button
                  onClick={() => onRemoveFilter(key)}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </Badge>
            );
          })}
        </div>
      )} */}
    </div>
  );
};
