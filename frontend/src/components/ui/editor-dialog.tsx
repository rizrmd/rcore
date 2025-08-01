import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Editor } from "@/components/ui/editor";
import { type YooptaContentValue } from "@yoopta/editor";
import { EditIcon } from "lucide-react";

interface EditorDialogProps {
  value?: YooptaContentValue;
  onChange?: (value: YooptaContentValue) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
  triggerText?: string;
}

export const EditorDialog: React.FC<EditorDialogProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  disabled = false,
  className = "",
  triggerText = "Edit Content",
}) => {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState<YooptaContentValue>();

  const handleOpen = useCallback(() => {
    setTempValue(value);
    setOpen(true);
  }, [value]);

  const handleSave = useCallback(() => {
    if (onChange && tempValue) {
      onChange(tempValue);
    }
    setOpen(false);
  }, [onChange, tempValue]);

  const handleCancel = useCallback(() => {
    setTempValue(value);
    setOpen(false);
  }, [value]);

  const getDisplayText = () => {
    if (!value || Object.keys(value).length === 0) {
      return "Click to add content...";
    }
    
    // Try to extract some text from the content for preview
    try {
      const firstBlock = Object.values(value)[0];
      if (firstBlock && typeof firstBlock === "object" && "value" in firstBlock) {
        const blockValue = firstBlock.value;
        if (Array.isArray(blockValue) && blockValue[0] && 'children' in blockValue[0] && Array.isArray(blockValue[0].children) && blockValue[0].children[0] && 'text' in blockValue[0].children[0]) {
          const text = blockValue[0].children[0].text;
          return text.length > 50 ? text.substring(0, 50) + "..." : text;
        }
      }
    } catch (e) {
      // Fallback if content structure is different
    }
    
    return "Content available - click to edit";
  };

  if (readOnly) {
    return (
      <div className={className}>
        <div className="min-h-[100px] p-3 border border-input rounded-md bg-muted text-sm">
          {getDisplayText()}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full min-h-[100px] p-3 justify-start text-left border-blue-900/60"
            disabled={disabled}
            onClick={handleOpen}
          >
            <div className="flex items-center gap-2 w-full">
              <EditIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">
                {getDisplayText()}
              </span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Make changes to your content here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Editor
              data={tempValue}
              onChange={setTempValue}
              placeholder={placeholder}
              className="min-h-[400px] border border-input rounded-md p-4"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};