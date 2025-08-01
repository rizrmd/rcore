import type {
  user,
  session,
  post,
  comment,
  tag,
  post_tag,
  setting,
} from "shared/models";
import type { JsonValue } from "shared/models/runtime/library";
import type { User } from "shared/types";

// Extended types with relations
export type UserWithRelations = Partial<user> &
  Partial<{
    sessions: Partial<session>[];
    posts: Partial<post>[];
    comments: Partial<comment>[];
  }>;

export type PostWithRelations = Partial<post> &
  Partial<{
    user: Partial<user>;
    comments: Partial<comment>[];
    tags: Partial<post_tag & { tag: Partial<tag> }>[];
  }>;

export type CommentWithRelations = Partial<comment> &
  Partial<{
    user: Partial<user>;
    post: Partial<post>;
  }>;

export type TagWithRelations = Partial<tag> &
  Partial<{
    posts: Partial<post_tag & { post: Partial<post> }>[];
  }>;

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

// Settings type
export type SettingItem = Partial<setting> & {
  value: JsonValue;
};