import type { Tables } from "./database.types";

export type { Database } from "./database.types";

export type Session = Tables<"Session">;
export type Estimation = Tables<"Estimation">;
export type Vote = Tables<"Vote">;
