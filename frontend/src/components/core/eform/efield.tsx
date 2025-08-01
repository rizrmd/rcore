import { Checkbox } from "@/components/ui/checkbox";
import { ComboBox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RelationComboBox,
  type RelationComboBoxOption,
} from "@/components/ui/relation-combobox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useEffect, useRef } from "react";
import { useSnapshot } from "valtio";

export type EFieldType =
  | "text"
  | "password"
  | "email"
  | "url"
  | "textarea"
  | "number"
  | "select"
  | "select-multiple"
  | "tags"
  | "checkbox"
  | "radio"
  | "date"
  | "time"
  | "datetime-local"
  | "datetime"
  | "relation"
  | "hidden"
  | "custom"
  | "jsonb"
  | "file";

const inputClassName = "border-slate-500/50";

// Store file references outside of valtio to avoid proxying
export const fileStore = new Map<string, File[]>();

// Cleanup old file store entries to prevent memory leaks
const cleanupFileStore = () => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [key] of fileStore) {
    const timestamp = parseInt(key.split("_").pop() || "0");
    if (now - timestamp > maxAge) {
      fileStore.delete(key);
    }
  }
};

// Run cleanup periodically
setInterval(cleanupFileStore, 5 * 60 * 1000); // every 5 minutes

// Helper function to extract actual File objects from metadata for form submission
export const getActualFilesFromMetadata = (fileMetadata: any[]): File[] => {
  if (!Array.isArray(fileMetadata)) return [];

  return fileMetadata
    .map((metadata) => {
      if (
        !metadata ||
        !metadata._fileStoreKey ||
        typeof metadata._fileIndex !== "number"
      ) {
        return null;
      }

      const storedFiles = fileStore.get(metadata._fileStoreKey);
      return storedFiles?.[metadata._fileIndex] || null;
    })
    .filter((file): file is File => file !== null);
};

export const EField = function <
  K extends Exclude<keyof V, symbol | number>,
  V extends Record<string, any> = Record<string, any>
>(
  this: { data: V },
  {
    name,
    label,
    type = "text",
    className,
    input,
    disabled,
    readOnly,
    optional,
    options,
    required,
    relationLoading,
    relationConfig,
    fileUploadConfig,
    customComponent,
    customProps,
    api, // Add this line
  }: {
    name: K;
    label?: string;
    type?: EFieldType;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    optional?: boolean;
    input?:
      | React.ComponentProps<"input">
      | React.ComponentProps<"textarea">
      | React.ComponentProps<"select">;
    options?: Record<string, any>;
    required?: boolean;
    relationLoading?: boolean;
    relationConfig?: {
      pageSize?: number;
      enableSearch?: boolean;
      loadOptions: (params: {
        search?: string;
        page?: number;
        pageSize?: number;
      }) => Promise<{
        data: RelationComboBoxOption[];
        total: number;
        hasMore: boolean;
      }>;
      resolve?: (params: {
        value?: string | number;
        options: RelationComboBoxOption[];
      }) => RelationComboBoxOption | null;
    };
    fileUploadConfig?: {
      accept?: string;
      maxFiles?: number;
      maxSize?: number;
    };
    customComponent?: React.ComponentType<{
      value: any;
      onChange: (value: any) => void;
      disabled?: boolean;
      readOnly?: boolean;
      required?: boolean;
      name: string;
      [key: string]: any;
    }>;
    customProps?: Record<string, any>;
    api?: any; // Add this line
  }
) {
  const read = useSnapshot(this.data);
  const write = this.data as any;

  // Handle hidden fields early - no UI rendering needed
  if (type === "hidden") {
    return (
      <input type="hidden" name={name} value={(read as any)[name] || ""} />
    );
  }

  // Refs for cursor position preservation
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosition = useRef<number | null>(null);

  // Preserve cursor position for text inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: K
  ) => {
    const target = e.currentTarget;
    cursorPosition.current = target.selectionStart;
    write[fieldName] = target.value;
  };

  // Restore cursor position after render
  useEffect(() => {
    if (cursorPosition.current !== null) {
      const input = inputRef.current || textareaRef.current;
      if (input) {
        input.setSelectionRange(cursorPosition.current, cursorPosition.current);
        cursorPosition.current = null;
      }
    }
  });

  return (
    <Label className={cn(className)}>
      {type !== "checkbox" && (
        <div
          className={cn("pb-[5px]", !label && "capitalize")}
          onClick={() => {}}
        >
          {label || name}
          {required && <span className="text-red-500 ml-1">*</span>}
          {optional && (
            <span className="text-gray-500 lowercase"> (opsional)</span>
          )}
        </div>
      )}
      {(type === "text" ||
        type === "password" ||
        type === "email" ||
        type === "url") && (
        <Input
          ref={inputRef}
          id={name}
          type={type}
          spellCheck={false}
          value={(read as any)[name] || ""}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(inputClassName, disabled && "bg-muted")}
          onChange={(e) => handleInputChange(e, name)}
          required={required}
          {...(input as React.ComponentProps<"input">)}
        />
      )}
      {type === "number" && (
        <Input
          ref={inputRef}
          id={name}
          type="text"
          value={
            (read as any)[name]
              ? Number((read as any)[name]).toLocaleString("id-ID")
              : ""
          }
          disabled={disabled}
          readOnly={readOnly}
          className={cn(inputClassName, disabled && readOnly && "bg-muted")}
          onChange={(e) => {
            const target = e.currentTarget;
            cursorPosition.current = target.selectionStart;
            const rawValue = target.value.replace(/\./g, "");
            // Only update if the value is a valid number or empty
            if (rawValue === "" || /^\d+$/.test(rawValue)) {
              write[name] = rawValue === "" ? null : Number(rawValue);
            }
          }}
          onKeyDown={(e) => {
            // Allow: backspace, delete, tab, escape, enter, home, end, left, right arrows
            if (
              [
                "Backspace",
                "Delete",
                "Tab",
                "Escape",
                "Enter",
                "Home",
                "End",
                "ArrowLeft",
                "ArrowRight",
              ].includes(e.key)
            ) {
              return;
            }
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
            if (
              e.ctrlKey &&
              ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase())
            ) {
              return;
            }
            // Block: letters, special characters (except digits and dots)
            if (!/[0-9.]/.test(e.key)) {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            const cleanedText = pastedText
              .replace(/[^0-9.]/g, "")
              .replace(/\./g, "");
            if (/^\d*$/.test(cleanedText)) {
              const target = e.currentTarget;
              cursorPosition.current = target.selectionStart;
              write[name] = cleanedText === "" ? null : Number(cleanedText);
            }
          }}
          required={required}
          {...(input as React.ComponentProps<"input">)}
        />
      )}
      {type === "textarea" && (
        <Textarea
          ref={textareaRef}
          id={name}
          spellCheck={false}
          value={(read as any)[name] || ""}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(inputClassName, disabled && "bg-muted")}
          onChange={(e) => handleInputChange(e, name)}
          required={required}
          {...(input as React.ComponentProps<"textarea">)}
        />
      )}
      {type === "jsonb" && (
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            id={name}
            spellCheck={false}
            value={(() => {
              const value = (read as any)[name];
              if (value === null || value === undefined) {
                return "";
              }
              if (typeof value === "string") {
                try {
                  // Try to parse and re-stringify for beautiful formatting in UI
                  const parsed = JSON.parse(value);
                  return JSON.stringify(parsed, null, 2);
                } catch {
                  // If not valid JSON, return as is
                  return value;
                }
              }
              // If it's already an object, stringify it with formatting
              return JSON.stringify(value, null, 2);
            })()}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              inputClassName,
              disabled && "bg-muted",
              "font-mono text-sm min-h-[120px]"
            )}
            placeholder="Enter JSON data, plain string, or array of strings..."
            onChange={(e) => {
              const target = e.currentTarget;
              cursorPosition.current = target.selectionStart;
              const inputValue = target.value.trim();

              if (inputValue === "") {
                write[name] = null;
                return;
              }

              // Try to parse as JSON first
              try {
                const parsed = JSON.parse(inputValue);
                // Store as compact JSON in the data (for database storage)
                write[name] = JSON.stringify(parsed);
              } catch {
                // If not valid JSON, treat as plain string
                write[name] = inputValue;
              }
            }}
            required={required}
            {...(input as React.ComponentProps<"textarea">)}
          />
          <div className="text-xs text-gray-500">
            Supports JSON objects, arrays, or plain strings. JSON will be
            automatically formatted for display but stored compactly.
          </div>
        </div>
      )}
      {type === "select" && (
        <>
          {" "}
          <ComboBox
            options={(options || []).map(
              (option: {
                value: any;
                label: string;
                description?: string;
              }) => ({
                value: String(option.value),
                label: option.label || String(option.value),
                description: option.description,
              })
            )}
            value={
              (read as any)[name] !== null && (read as any)[name] !== undefined
                ? String((read as any)[name])
                : ""
            }
            onValueChange={(value) => {
              if (!value) {
                write[name] = null;
              } else if (value === "true") {
                write[name] = true;
              } else if (value === "false") {
                write[name] = false;
              } else {
                write[name] = value;
              }
            }}
            placeholder={
              required
                ? "Pilih salah satu..."
                : "Pilih salah satu... (opsional)"
            }
            searchPlaceholder="Search..."
            emptyText="No options found"
            disabled={disabled}
            className={cn(inputClassName, disabled && "bg-muted")}
          />
        </>
      )}
      {type === "select-multiple" && (
        <select
          id={name}
          multiple
          value={(read as any)[name] || []}
          disabled={disabled}
          className={cn(
            inputClassName,
            disabled && "bg-muted",
            "min-h-[120px] p-2"
          )}
          onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions).map(
              (option) => option.value
            );
            write[name] = selectedOptions;
          }}
          required={required}
        >
          {(options || []).map((option: { value: any; label: string }) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label || String(option.value)}
            </option>
          ))}
        </select>
      )}
      {type === "tags" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {((read as any)[name] || []).map(
              (selectedValue: string, index: number) => {
                const option = (options || []).find(
                  (opt: { value: any }) => String(opt.value) === selectedValue
                );
                return (
                  <div
                    key={index}
                    className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                  >
                    <span>{option?.label || selectedValue}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValues = (read as any)[name] || [];
                        write[name] = currentValues.filter(
                          (_: any, i: number) => i !== index
                        );
                      }}
                      className="ml-2 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center"
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </div>
                );
              }
            )}
          </div>
          <ComboBox
            options={(options || [])
              .filter((option: { value: any }) => {
                const currentValues = (read as any)[name] || [];
                return !currentValues.includes(String(option.value));
              })
              .map(
                (option: {
                  value: any;
                  label: string;
                  description?: string;
                }) => ({
                  value: String(option.value),
                  label: option.label || String(option.value),
                  description: option.description,
                })
              )}
            value=""
            onValueChange={(value) => {
              if (value) {
                const currentValues = (read as any)[name] || [];
                write[name] = [...currentValues, value];
              }
            }}
            placeholder={
              required ? "Pilih tags..." : "Pilih tags... (opsional)"
            }
            searchPlaceholder="Search..."
            emptyText="No options found"
            disabled={disabled}
            className={cn(inputClassName, disabled && "bg-muted")}
          />
        </div>
      )}
      {type === "checkbox" && (
        <div className={cn("flex items-center space-x-2", inputClassName)}>
          <Checkbox
            id={name}
            checked={(read as any)[name]}
            onCheckedChange={(checked) => (write[name] = checked)}
            disabled={disabled}
            required={required}
          />
          <div className="text-sm cursor-pointer">
            {label || name}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
        </div>
      )}
      {type === "radio" && (
        <div className="flex flex-col">
          {(options || []).map((option: { key: any; label: string }) => (
            <div
              key={option.key}
              className={cn(
                "flex items-center text-gray-800 text-sm",
                inputClassName
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.key}
                checked={(read as any)[name] === option.key}
                disabled={disabled}
                readOnly={readOnly}
                className="mr-2"
                onChange={() => (write[name] = option.key)}
              />
              {option.label || option.key}
            </div>
          ))}
        </div>
      )}
      {(type === "date" ||
        type === "time" ||
        type === "datetime-local" ||
        type === "datetime") && (
        <Input
          ref={inputRef}
          id={name}
          type={type === "datetime" ? "datetime-local" : type}
          value={
            (read as any)[name]
              ? type === "date"
                ? new Date((read as any)[name]).toISOString().split("T")[0]
                : type === "time"
                ? new Date((read as any)[name])
                    .toTimeString()
                    .split(" ")[0]
                    .slice(0, 5)
                : type === "datetime" || type === "datetime-local"
                ? new Date((read as any)[name]).toISOString().slice(0, 16)
                : (read as any)[name]
              : ""
          }
          disabled={disabled}
          readOnly={readOnly}
          className={cn(inputClassName, disabled && "bg-muted")}
          onChange={(e) => handleInputChange(e, name)}
          required={required}
          {...(input as React.ComponentProps<"input">)}
        />
      )}
      {type === "relation" &&
        (relationConfig?.loadOptions ? (
          <RelationComboBox
            value={(read as any)[name] || ""}
            onValueChange={(value) => (write[name] = value || null)}
            placeholder={
              required
                ? "Pilih salah satu..."
                : "Pilih salah satu... (opsional)"
            }
            searchPlaceholder="Search..."
            emptyText="No options found"
            disabled={disabled}
            className={cn(inputClassName, disabled && "bg-muted")}
            loadOptions={async (params) => {
              const result = await relationConfig.loadOptions(params);
              return {
                data: result.data.map((item) => ({
                  value: item.value,
                  label: item.label || String(item.value),
                })),
                total: result.total,
                hasMore: result.hasMore,
              };
            }}
            resolveOption={relationConfig?.resolve}
            pageSize={relationConfig?.pageSize || 20}
            enableSearch={relationConfig?.enableSearch !== false}
          />
        ) : (
          <ComboBox
            options={(options || []).map(
              (option: { key: any; label: string }) => ({
                value: String(option.key),
                label: option.label || String(option.key),
              })
            )}
            value={(read as any)[name] ? String((read as any)[name]) : ""}
            onValueChange={(value) => (write[name] = value || null)}
            placeholder={
              relationLoading
                ? "Loading..."
                : required
                ? "Pilih salah satu..."
                : "Pilih salah satu (optional)"
            }
            searchPlaceholder="Search..."
            emptyText={
              relationLoading ? "Loading options..." : "No options found"
            }
            disabled={disabled || relationLoading}
            className={cn(inputClassName, disabled && "bg-muted")}
          />
        ))}
      {type === "file" && (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            id={name}
            type="file"
            accept={fileUploadConfig?.accept || "image/*"}
            multiple={fileUploadConfig?.maxFiles !== 1}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(inputClassName, disabled && "bg-muted")}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);

              // Apply maxFiles limit
              const maxFiles = fileUploadConfig?.maxFiles || 1;
              const limitedFiles = files.slice(0, maxFiles);

              // Apply maxSize limit
              const maxSize = fileUploadConfig?.maxSize || 5 * 1024 * 1024;
              const validFiles = limitedFiles.filter(
                (file) => file.size <= maxSize
              );

              if (validFiles.length < limitedFiles.length) {
                alert(
                  `Some files were too large. Maximum size: ${(
                    maxSize /
                    1024 /
                    1024
                  ).toFixed(1)}MB`
                );
              }

              // Create a unique key for this field
              const fieldKey = `${name}_${Date.now()}`;

              // Store actual File objects outside of valtio
              fileStore.set(fieldKey, validFiles);

              // Store only metadata in valtio state with reference to external store
              const fileMetadata = validFiles.map((file, index) => ({
                _fileStoreKey: fieldKey,
                _fileIndex: index,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
              }));

              write[name] = fileMetadata;
            }}
            required={required}
            {...(input as React.ComponentProps<"input">)}
          />

          {/* Show current file info and preview */}
          {(read as any)[name] &&
            Array.isArray((read as any)[name]) &&
            (read as any)[name].length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  {(read as any)[name].length} file(s) selected
                </div>

                {/* Image preview with robust error handling */}
                <div className="flex flex-wrap gap-2">
                  {(read as any)[name].map((fileData: any, index: number) => {
                    // Create a safe preview function that works with our external file store
                    const createPreview = () => {
                      try {
                        // Check if we have valid file metadata
                        if (!fileData || typeof fileData !== "object") {
                          console.warn(
                            `File data ${index} is not an object:`,
                            fileData
                          );
                          return null;
                        }

                        // Check if it has type property from metadata
                        const fileType = fileData.type || "";
                        if (typeof fileType !== "string") {
                          console.warn(
                            `File ${index} has no valid type:`,
                            fileData
                          );
                          return null;
                        }

                        // Only show preview for images
                        if (!fileType.startsWith("image/")) {
                          return null;
                        }

                        // Get the actual file from external store
                        const fileStoreKey = fileData._fileStoreKey;
                        const fileIndex = fileData._fileIndex;

                        if (!fileStoreKey || typeof fileIndex !== "number") {
                          console.warn(
                            `File ${index} has no valid store reference:`,
                            fileData
                          );
                          return null;
                        }

                        const storedFiles = fileStore.get(fileStoreKey);
                        if (!storedFiles || !storedFiles[fileIndex]) {
                          console.warn(
                            `File ${index} not found in store:`,
                            fileStoreKey,
                            fileIndex
                          );
                          return null;
                        }

                        const actualFile = storedFiles[fileIndex];

                        // Try to create object URL with the unproxied file
                        let imageUrl: string;
                        try {
                          imageUrl = URL.createObjectURL(actualFile);
                        } catch (urlError) {
                          console.warn(
                            `Failed to create URL for file ${index}:`,
                            urlError
                          );
                          return null;
                        }

                        return (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                              onLoad={() => {
                                URL.revokeObjectURL(imageUrl);
                              }}
                              onError={() => {
                                URL.revokeObjectURL(imageUrl);
                                console.warn(
                                  `Failed to load preview image ${index}`
                                );
                              }}
                            />
                            <div className="mt-1 text-xs text-gray-500 truncate max-w-20">
                              {fileData.name}
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.warn(
                          `Error creating preview for file ${index}:`,
                          error
                        );
                        return null;
                      }
                    };

                    return createPreview();
                  })}
                </div>
              </div>
            )}

          {/* Show initial image if it's a string URL */}
          {typeof (read as any)[name] === "string" &&
            (read as any)[name] &&
            (read as any)[name].trim() !== "" && (() => {
              // Parse JSON array if needed
              let imageUrl = (read as any)[name];
              if (typeof imageUrl === "string" && imageUrl.startsWith("[")) {
                try {
                  const imgArray = JSON.parse(imageUrl);
                  imageUrl = imgArray[0] || "";
                } catch {
                  // If parsing fails, use original string
                }
              }
              
              return imageUrl ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Current file:{" "}
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View
                    </a>
                  </div>

                  {/* Enhanced preview for existing image URLs with loading state */}
                  <div className="relative">
                    <img
                      key={imageUrl} // Force re-render when URL changes
                      src={imageUrl}
                    alt="Current image"
                    className="w-20 h-20 object-cover border rounded transition-opacity duration-200"
                    style={{ display: "block" }} // Start visible
                    onError={(e) => {
                      // Hide image if it fails to load and show placeholder
                      const target = e.target as HTMLElement;
                      target.style.display = "none";
                      const placeholder =
                        target.nextElementSibling as HTMLElement;
                      if (
                        placeholder &&
                        placeholder.classList.contains("image-placeholder")
                      ) {
                        placeholder.style.display = "flex";
                      }
                    }}
                    onLoad={(e) => {
                      // Ensure image is visible when it loads successfully
                      const target = e.target as HTMLElement;
                      target.style.display = "block";
                      target.style.opacity = "1";
                      const placeholder =
                        target.nextElementSibling as HTMLElement;
                      if (
                        placeholder &&
                        placeholder.classList.contains("image-placeholder")
                      ) {
                        placeholder.style.display = "none";
                      }
                    }}
                  />
                  {/* Fallback placeholder for broken images */}
                  <div
                    className="image-placeholder w-20 h-20 border rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500"
                    style={{ display: "none" }}
                  >
                    Image unavailable
                  </div>
                </div>
              </div>
              ) : null;
            })()}
        </div>
      )}
      {type === "custom" &&
        customComponent &&
        React.createElement(customComponent, {
          value: (read as any)[name],
          onChange: (value: any) => (write[name] = value),
          disabled,
          readOnly,
          required,
          name,
          ...customProps,
        })}
    </Label>
  );
};
