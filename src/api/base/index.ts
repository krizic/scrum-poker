import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { AvailableTables, Database } from "../model";

export abstract class BaseApi<
  T extends { id: string },
  N extends AvailableTables = AvailableTables
> {
  protected table: ReturnType<SupabaseClient<Database, "public">["from"]>;

  constructor(
    protected store: SupabaseClient<Database, "public">,
    private tableName: N
  ) {
    this.table = this.store.from(this.tableName);
  }

  async create(createData): Promise<T> {
    const { data, error } = await this.table
      .insert(createData)
      .select();
    if (error) {
      throw error;
    }
    return data[0];
  }

  async get(id: T["id"]): Promise<T> {
    const { data, error } = await this.table
      .select()
      .eq("id", id as any)
      .single();
    if (error) {
      throw error;
    }
    return data as T;
  }

  /**
   * Does not provide reactivity, extend with isDeleted property
   * @param id 
   */
  async delete(id: string) {
    const { error } = await this.table.delete().eq("id", id as any);
    if (error) {
      throw error;
    }
  }

  async update(id: string, updateData) {
    const { data, error } = await this.table
      .update(updateData)
      .eq("id", id as any)
      .single();
    if (error) {
      throw error;
    }
    return data as T;
  }

  changes(
    filterProperty: keyof T,
    id: string,
    callback: (payload: Record<string, any>) => void
  ): RealtimeChannel {
    return this.store.channel("schema-db-changes").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: this.tableName,
        filter: `${filterProperty as string}=eq.${id}`,
      },
      (payload) => {
        console.log(payload);
        callback(payload);
      }
    );
  }
}
