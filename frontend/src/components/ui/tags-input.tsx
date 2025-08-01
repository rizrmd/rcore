import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Tag {
  value: string;
  label: string;
}

interface TagsInputProps {
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function TagsInput({
  tags,
  selectedTags,
  onTagsChange,
  placeholder = "Add tags...",
  searchPlaceholder = "Search tags...",
  emptyText = "No tags found.",
  className,
}: TagsInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedTagObjects = tags.filter((tag) =>
    selectedTags.includes(tag.value)
  );

  const availableTags = tags.filter(
    (tag) => !selectedTags.includes(tag.value)
  );

  const filteredTags = availableTags.filter((tag) =>
    tag.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (tagValue: string) => {
    onTagsChange([...selectedTags, tagValue]);
    setInputValue("");
    setOpen(false);
  };

  const handleRemove = (tagValue: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagValue));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className="flex min-h-[2.5rem] w-full flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring cursor-text"
            onClick={() => setOpen(true)}
          >
            {selectedTagObjects.map((tag) => (
              <Badge
                key={tag.value}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {tag.label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(tag.value);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedTags.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag.value}
                  value={tag.label}
                  onSelect={() => handleSelect(tag.value)}
                >
                  {tag.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}