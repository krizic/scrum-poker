import type { Tables, Database } from "./database.types";

export type { Database } from "./database.types";

export type Session = Tables<"Session">;
export type Estimation = Tables<"Estimation">;
export type Vote = Tables<"Vote">;
export type Player = Tables<"Player">;

export type AvailableTables = keyof Database[Extract<
  keyof Database,
  "public"
>]["Tables"];
