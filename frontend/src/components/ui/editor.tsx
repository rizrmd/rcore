import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import YooptaEditor, {
  createYooptaEditor,
  type YooptaContentValue,
} from "@yoopta/editor";

import Paragraph from "@yoopta/paragraph";
import { HeadingOne, HeadingTwo, HeadingThree } from "@yoopta/headings";
import { BulletedList, NumberedList } from "@yoopta/lists";
import Blockquote from "@yoopta/blockquote";
import ActionMenuList, {
  DefaultActionMenuRender,
} from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";

const plugins = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  BulletedList,
  NumberedList,
];

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
};

interface EditorProps {
  data?: YooptaContentValue;
  onChange?: (data: YooptaContentValue) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export const Editor: React.FC<EditorProps> = ({
  data,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  className = "",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [editor] = useState(() => createYooptaEditor());

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleChange = useCallback(
    (value: YooptaContentValue) => {
      if (onChange && isMounted) {
        try {
          onChange(value);
        } catch (error) {
          console.warn("Editor onChange error:", error);
        }
      }
    },
    [onChange, isMounted]
  );

  const normalizedData = useMemo(() => {
    if (!data || typeof data === "string" || Array.isArray(data)) {
      return {};
    }
    try {
      // Handle potential Valtio proxy by creating a clean copy
      const cleanData = JSON.parse(JSON.stringify(data));
      return cleanData && typeof cleanData === "object" ? cleanData : {};
    } catch {
      return {};
    }
  }, [data]);

  if (!isMounted) {
    return <div className={className} style={{ minHeight: "200px" }} />;
  }

  return (
    <div className={className} key="yoopta-editor">
      <YooptaEditor
        editor={editor}
        plugins={plugins}
        tools={TOOLS}
        value={normalizedData}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
};