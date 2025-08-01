import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useRef, type ReactNode } from "react";
import { proxy, ref, snapshot, useSnapshot } from "valtio";
import { EField } from "./efield";
import type { DeepReadonly, EFormChildren, ExtFieldType } from "./types";

export const EForm = forwardRef<
  HTMLFormElement,
  {
    data: any;
    children: (opt: EFormChildren<any, any>) => ReactNode;
    onSubmit?: (opt: { read: DeepReadonly<any>; write: any }) => void;
    className?: string;
    props?: React.ComponentProps<"form">;
  }
>(function EForm<
  T extends Record<string, any>,
  K extends Exclude<keyof T, number | symbol>
>(
  opt: {
    data: T;
    children: (opt: EFormChildren<T, K>) => ReactNode;
    onSubmit?: (opt: { read: DeepReadonly<T>; write: T }) => void;
    className?: string;
    props?: React.ComponentProps<"form">;
  },
  formRef: React.Ref<HTMLFormElement>
) {
  const write = useRef(
    proxy({
      data: opt.data,
      Field: ref(() => {}) as unknown as ExtFieldType<K>,
      submit: ref(() => {}),
    })
  ).current;
  const read = useSnapshot(write);

  useEffect(() => {
    // Properly update valtio state to ensure reactivity when async data loads
    // Instead of Object.assign, we need to assign each property individually
    // to ensure valtio's proxy system detects all changes
    if (opt.data && typeof opt.data === "object") {
      // Clear existing properties that might not be in new data
      for (const key in write.data) {
        if (!(key in opt.data)) {
          delete write.data[key];
        }
      }

      // Assign new data properties
      for (const key in opt.data) {
        if (opt.data.hasOwnProperty(key)) {
          write.data[key] = opt.data[key];
        }
      }
    } else {
      write.data = opt.data;
    }
    write.Field = ref(EField.bind(write));
    write.submit = ref(() => {
      opt.onSubmit?.({ read: snapshot(write.data) as any, write: write.data });
    });

    // Expose write context globally for custom components
    (window as any).currentFormWrite = write;

    // Clean up on unmount
    return () => {
      (window as any).currentFormWrite = null;
    };
  }, [opt.data]);

  return (
    <form
      ref={formRef}
      className={cn(opt.className, "flex flex-col flex-1")}
      onSubmit={(e) => {
        e.preventDefault();
        read.submit();
      }}
      {...opt.props}
    >
      {opt.children({
        Field: read.Field,
        submit: () => {
          read.submit();
        },
        read: read.data as any,
        write: write.data as any,
      })}
      <button type="submit" className="hidden"></button>
    </form>
  );
});
