import { supabase } from "../provider";
import { BaseApi } from "../base";
import { Estimation, Session, Vote } from "../model";
import { QueryData } from "@supabase/supabase-js";

export class SessionService extends BaseApi<Session, "Session"> {
  constructor() {
    super(supabase, "Session");
  }

  // Providing a healtcheck method to test the connection
  status = async (): Promise<number> => {
    const { error, status } = await this.table.select();
    if (error) {
      throw error;
    }
    return status;
  };
}

const _estimationWithVotes = supabase
  .from("Estimation")
  .select(
    `*, 
  Vote (
    id,
    pattern,
    username,
    email,
    value,
    created_at,
    estimation_id
  )
  `
  )
  .single();

export type EstimationWithVotes = QueryData<typeof _estimationWithVotes>;

export class EstimationService extends BaseApi<Estimation, "Estimation"> {
  constructor() {
    super(supabase, "Estimation");
  }

  bulkCreate = async (estimations: Estimation[]): Promise<Estimation[]> => {
    const { data, error } = await this.table.insert(estimations).select();
    if (error) {
      throw error;
    }
    return data as Estimation[];
  };

  changeEstimationStatus = async (
    session_id: string,
    estimationId: string,
    isActive: boolean
  ): Promise<Estimation> => {
    const estimations = await this.getBySessionId(session_id);
    const estimationsWithUpdatedStatus = estimations.map((estimation) => {
      if (estimation.isActive) {
        return { ...estimation, isActive: false };
      }
      if (estimation.id === estimationId) {
        return { ...estimation, isActive };
      }
      return estimation;
    });

    const { data, error } = await this.table.upsert(
      estimationsWithUpdatedStatus
    );
    if (error) {
      throw error;
    }
    return data;
  };

  getBySessionId = async (sessionId: string): Promise<Estimation[]> => {
    const { data, error } = await this.table
      .select()
      .eq("session_id", sessionId);
    if (error) {
      throw error;
    }
    return data;
  };

  getWithVotes = async (id: string): Promise<EstimationWithVotes[]> => {
    const estimationWithVotes = await this.table
      .select(
        `*, 
        Vote (
          id,
          pattern,
          username,
          email,
          value,
          created_at,
          estimation_id
        )
        `
      )
      .eq("session_id", id);

    const { data, error } = await estimationWithVotes;

    if (error) {
      throw error;
    }
    return data;
  };
}
export class VoteService extends BaseApi<Vote, "Vote"> {
  constructor() {
    super(supabase, "Vote");
  }
}
