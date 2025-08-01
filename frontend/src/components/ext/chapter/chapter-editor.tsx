import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/gen/publish.esensi";
import {
  Bold,
  Check,
  Clock,
  Expand,
  Image,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minimize,
  Quote,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { chapter } from "shared/models";
import type { BaseEditor, Descendant } from "slate";
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Transforms,
} from "slate";
import type { HistoryEditor } from "slate-history";
import { withHistory } from "slate-history";
import type { RenderElementProps, RenderLeafProps } from "slate-react";
import { Editable, ReactEditor, Slate, useSlate, withReact } from "slate-react";

// Define custom types for Slate
type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

type ParagraphElement = {
  type: "paragraph";
  align?: string;
  children: Descendant[];
};

type BlockQuoteElement = {
  type: "block-quote";
  align?: string;
  children: Descendant[];
};

type BulletedListElement = {
  type: "bulleted-list";
  align?: string;
  children: Descendant[];
};

type NumberedListElement = {
  type: "numbered-list";
  align?: string;
  children: Descendant[];
};

type ListItemElement = {
  type: "list-item";
  children: Descendant[];
};

type HeadingElement = {
  type: "heading-one" | "heading-two";
  align?: string;
  children: Descendant[];
};


type ImageElement = {
  type: "image";
  url: string;
  alt?: string;
  children: Descendant[];
};

type CustomElement =
  | ParagraphElement
  | BlockQuoteElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement
  | HeadingElement
  | ImageElement;

type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CustomText = FormattedText;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface ChapterEditorProps {
  chapterId: string;
  onSave?: (content: string) => void;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  customButtons?: React.ReactNode;
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const style = { textAlign: (element as any).align };
  switch (element.type) {
    case "block-quote":
      return (
        <blockquote
          style={style}
          {...attributes}
          className="border-l-4 border-gray-300 pl-4 italic my-4"
        >
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul
          style={style}
          {...attributes}
          className="list-disc list-inside my-4"
        >
          {children}
        </ul>
      );
    case "numbered-list":
      return (
        <ol
          style={style}
          {...attributes}
          className="list-decimal list-inside my-4"
        >
          {children}
        </ol>
      );
    case "list-item":
      return (
        <li style={style} {...attributes} className="my-1">
          {children}
        </li>
      );
    case "heading-one":
      return (
        <h1 style={style} {...attributes} className="text-2xl font-bold mb-4">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2
          style={style}
          {...attributes}
          className="text-xl font-semibold mb-3"
        >
          {children}
        </h2>
      );
    case "image":
      return (
        <div {...attributes} className="my-4">
          <div contentEditable={false} className="relative">
            <img
              src={(element as any).url}
              alt={(element as any).alt || ""}
              className="max-w-full h-auto rounded"
              style={{ display: "block" }}
            />
          </div>
          {children}
        </div>
      );
    default:
      return (
        <p style={style} {...attributes} className="my-2">
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

const createEmptyDocument = (): Descendant[] => [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

const validateSlateValue = (value: any): Descendant[] => {
  if (!value || !Array.isArray(value)) {
    return createEmptyDocument();
  }

  // Helper function to ensure a valid text node
  const ensureValidTextNode = (node: any): any => {
    if (!node || typeof node !== "object") {
      return { text: "" };
    }
    
    // If it's a text node, ensure it has a text property
    if (!node.type && typeof node.text !== "string") {
      return { text: String(node.text || "") };
    }
    
    return node;
  };

  // Helper function to validate children array
  const validateChildren = (children: any): any[] => {
    if (!children || !Array.isArray(children)) {
      return [{ text: "" }];
    }
    
    const validated = children.map((child: any) => {
      if (!child || typeof child !== "object") {
        return { text: "" };
      }
      
      // If it's a text node
      if (!child.type && child.text !== undefined) {
        return ensureValidTextNode(child);
      }
      
      // If it's an element node
      if (child.type) {
        return {
          ...child,
          children: validateChildren(child.children),
        };
      }
      
      // Default to text node
      return { text: "" };
    });
    
    // Ensure we always have at least one child
    return validated.length > 0 ? validated : [{ text: "" }];
  };

  // Ensure all nodes have the required structure
  const validatedValue = value.map((node: any) => {
    if (!node || typeof node !== "object") {
      return {
        type: "paragraph",
        children: [{ text: "" }],
      };
    }

    // Handle image nodes specially
    if (node.type === "image") {
      return {
        type: "image",
        url: node.url || "",
        alt: node.alt || "",
        children: [{ text: "" }],
      };
    }

    // Ensure valid node type
    const validTypes = [
      "paragraph",
      "block-quote",
      "bulleted-list",
      "numbered-list",
      "list-item",
      "heading-one",
      "heading-two",
      "image",
    ];
    
    const nodeType = validTypes.includes(node.type) ? node.type : "paragraph";

    return {
      ...node,
      type: nodeType,
      children: validateChildren(node.children),
    };
  });

  // Ensure we have at least one valid block
  return validatedValue.length > 0
    ? validatedValue
    : createEmptyDocument();
};

// Slate utility functions
const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const isBlockActive = (editor: Editor, format: string, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor: Editor, format: string) => {
  try {
    const isActive = isBlockActive(
      editor,
      format,
      TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        LIST_TYPES.includes(n.type) &&
        !TEXT_ALIGN_TYPES.includes(format),
      split: true,
    });
    
    let newProperties: Partial<SlateElement>;
    if (TEXT_ALIGN_TYPES.includes(format)) {
      newProperties = {
        align: isActive ? undefined : format,
      };
    } else {
      newProperties = {
        type: isActive ? "paragraph" : isList ? "list-item" : (format as any),
      };
    }
    
    Transforms.setNodes<SlateElement>(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format as any, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  } catch (error) {
    console.warn("Error toggling block format:", error);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Image upload function
const insertImage = (editor: Editor, url: string, alt?: string) => {
  try {
    const image = { type: "image" as const, url, alt, children: [{ text: "" }] };
    Transforms.insertNodes(editor, image as any);
  } catch (error) {
    console.warn("Error inserting image:", error);
  }
};

// Word count utility function
const getWordCount = (value: Descendant[]): number => {
  let text = "";

  const extractText = (nodes: any[]): void => {
    nodes.forEach((node) => {
      if (node.text !== undefined) {
        text += node.text + " ";
      } else if (node.children && Array.isArray(node.children)) {
        extractText(node.children);
      }
    });
  };

  extractText(value);

  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};



// Toolbar component
const Toolbar = ({
  onFullscreenToggle,
  isFullscreen,
  customButtons,
}: {
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  isFullscreen?: boolean;
  customButtons?: React.ReactNode;
}) => {
  const editor = useSlate();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        insertImage(editor, result.url, file.name);
      } else {
        console.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      {/* Text formatting group */}
      <div className="flex items-center gap-1">
        <Button
          variant={isMarkActive(editor, "bold") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, "bold");
          }}
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          variant={isMarkActive(editor, "italic") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleMark(editor, "italic");
          }}
        >
          <Italic className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Block formatting group */}
      <div className="flex items-center gap-1">
        <Button
          variant={isBlockActive(editor, "block-quote") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlock(editor, "block-quote");
          }}
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Button
          variant={isBlockActive(editor, "bulleted-list") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlock(editor, "bulleted-list");
          }}
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          variant={isBlockActive(editor, "numbered-list") ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlock(editor, "numbered-list");
          }}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Media and tools group */}
      <div className="flex items-center gap-1">
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" disabled={uploading} asChild className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
            <span>
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Image className="w-4 h-4" />
              )}
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
          onClick={() => onFullscreenToggle?.(!isFullscreen)}
          title={isFullscreen ? "Keluar layar penuh" : "Masuk layar penuh"}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Expand className="w-4 h-4" />
          )}
        </Button>
      </div>

      {customButtons && (
        <>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center gap-1">
            {customButtons}
          </div>
        </>
      )}
    </div>
  );
};

export const ChapterEditor = ({
  chapterId,
  onSave,
  onFullscreenToggle,
  customButtons,
}: ChapterEditorProps) => {
  const [value, setValue] = useState<Descendant[]>(createEmptyDocument());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useMemo(() => {
    const e = withHistory(withReact(createEditor()));
    
    // Override operations to add error handling
    const { normalizeNode } = e;
    e.normalizeNode = (entry) => {
      try {
        normalizeNode(entry);
      } catch (error) {
        console.warn("Slate normalization error:", error);
      }
    };
    
    return e;
  }, []);

  const renderElement = useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    []
  );
  const renderLeaf = useCallback(
    (props: RenderLeafProps) => <Leaf {...props} />,
    []
  );

  // Debounced autosave function
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedAutosave = useCallback(
    (callback: () => void, delay: number) => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(callback, delay);
    },
    []
  );

  // Load chapter data
  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoading(true);
        const response = await api.chapters({
          action: "get",
          id: chapterId,
        });

        if (response.success && response.data) {
          // Parse and validate content
          let contentValue = createEmptyDocument();

          if (response.data.content) {
            try {
              if (typeof response.data.content === "string") {
                const parsedContent = JSON.parse(response.data.content);
                contentValue = validateSlateValue(parsedContent);
              } else if (typeof response.data.content === "object") {
                contentValue = validateSlateValue(response.data.content);
              } else {
                // If content is not valid, create a paragraph with the content as text
                contentValue = [
                  {
                    type: "paragraph",
                    children: [{ text: String(response.data.content) }],
                  },
                ];
              }
            } catch (error) {
              console.warn("Failed to parse chapter content:", error);
              // If content is not valid JSON, create a paragraph with the text
              contentValue = [
                {
                  type: "paragraph",
                  children: [{ text: String(response.data.content) }],
                },
              ];
            }
          }

          setValue(contentValue);
          
          // Ensure the editor has a valid selection after loading
          setTimeout(() => {
            try {
              if (!editor.selection) {
                Transforms.select(editor, {
                  anchor: { path: [0, 0], offset: 0 },
                  focus: { path: [0, 0], offset: 0 },
                });
              }
            } catch (e) {
              console.warn("Could not set initial selection:", e);
            }
          }, 0);
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
        setValue(createEmptyDocument());
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      loadChapter();
    }
  }, [chapterId, editor]);

  // Save chapter content
  const handleSave = useCallback(
    async (showSavingIndicator = true) => {
      try {
        if (showSavingIndicator) {
          setSaveStatus("saving");
        }
        const validatedValue = validateSlateValue(value);
        const contentJson = JSON.stringify(validatedValue);

        // Use the dedicated chapter content save API for better performance
        const response = await api["chapter-content-save"]({
          id: chapterId,
          content: contentJson,
        });

        if (response.success) {
          setSaveStatus("saved");
          onSave?.(contentJson);
        }
      } catch (error) {
        console.error("Failed to save chapter:", error);
        setSaveStatus("unsaved");
      } finally {
        // Auto-save doesn't need additional cleanup
      }
    },
    [chapterId, value, onSave]
  );

  // Autosave function
  const triggerAutosave = useCallback(() => {
    setSaveStatus("unsaved");
    debouncedAutosave(() => {
      handleSave(false);
    }, 2000); // Save after 2 seconds of inactivity
  }, [debouncedAutosave, handleSave]);

  // Handle editor value changes with validation
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      try {
        // Validate the new value
        const validatedValue = validateSlateValue(newValue);
        
        // Check if the selection is still valid
        const { selection } = editor;
        if (selection) {
          try {
            // Try to get the node at the selection path
            const [start] = Editor.nodes(editor, {
              at: selection.anchor.path,
              match: () => true,
            });
            
            if (!start) {
              // If the selection is invalid, reset it to the start of the document
              Transforms.select(editor, {
                anchor: { path: [0, 0], offset: 0 },
                focus: { path: [0, 0], offset: 0 },
              });
            }
          } catch (e) {
            // If there's an error checking the selection, reset it
            console.warn("Invalid selection, resetting:", e);
            Transforms.select(editor, {
              anchor: { path: [0, 0], offset: 0 },
              focus: { path: [0, 0], offset: 0 },
            });
          }
        }
        
        setValue(validatedValue);
        triggerAutosave();
      } catch (error) {
        console.warn("Invalid editor value, using fallback:", error);
        setValue(createEmptyDocument());
      }
    },
    [triggerAutosave, editor]
  );

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(
    (fullscreen: boolean) => {
      setIsFullscreen(fullscreen);
      onFullscreenToggle?.(fullscreen);
    },
    [onFullscreenToggle]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`h-full flex flex-col bg-white ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      <Slate 
        editor={editor} 
        initialValue={validateSlateValue(value)} 
        onChange={handleChange}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b flex-shrink-0 gap-2">
          <div className="overflow-x-auto">
            <Toolbar
              onFullscreenToggle={handleFullscreenToggle}
              isFullscreen={isFullscreen}
              customButtons={customButtons}
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-sm text-gray-600 min-w-0">
            <span className="text-gray-500 whitespace-nowrap">{getWordCount(value)} kata</span>
            <div className="flex items-center gap-2 min-w-0">
              {saveStatus === "saved" && (
                <>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Tersimpan</span>
                </>
              )}
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Ada perubahan</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 overflow-y-auto overflow-x-hidden cursor-text"
            onClick={() => {
              // Focus the Slate editor when clicking on the editor box
              ReactEditor.focus(editor);
            }}
          >
            <div className="p-4 min-h-full mx-auto w-full">
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Mulai menulis bab Anda..."
                className="outline-none min-h-full"
                spellCheck={false}
                onKeyDown={(event) => {
                  // Handle keyboard shortcuts
                  if (event.ctrlKey || event.metaKey) {
                    switch (event.key) {
                      case "s": {
                        event.preventDefault();
                        handleSave(true);
                        break;
                      }
                      case "b": {
                        event.preventDefault();
                        toggleMark(editor, "bold");
                        break;
                      }
                      case "i": {
                        event.preventDefault();
                        toggleMark(editor, "italic");
                        break;
                      }
                    }
                    return;
                  }

                }}
              />
            </div>
          </div>
        </div>
      </Slate>
    </div>
  );

  // Export chapter data for use in parent component
};

// Export chapter data hook for parent component
export const useChapterData = (chapterId: string) => {
  const [chapterData, setChapterData] = useState<chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoading(true);
        const response = await api.chapters({
          action: "get",
          id: chapterId,
        });

        if (response.success && response.data) {
          setChapterData(response.data);
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) {
      loadChapter();
    }
  }, [chapterId]);

  return { chapterData, loading };
};
