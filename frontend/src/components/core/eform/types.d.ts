import type { EField } from "./efield";

export type ExtFieldType<K extends string> = typeof EField<K>;

type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

type EFormChildren<T, K extends string> = {
  Field: ExtFieldType<K>;
  submit: () => void;
  read: DeepReadonly<T>;
  write: T;
};
