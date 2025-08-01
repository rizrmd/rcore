import type * as models from "shared/models";
import type { defineDB, ModelOperations } from "rlib/server";
import type { PrismaClient } from "shared/models";

declare global {
  var db: PrismaClient;
}

export {};
