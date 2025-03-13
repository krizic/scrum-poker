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
    value,
    created_at,
    estimation_id,
    player_id,
    Player(*)
  )
  `
  )
  .single();
export type EstimationWithVotes = QueryData<typeof _estimationWithVotes>;

const _estimationWithPlayerVote = supabase
  .from("Estimation")
  .select(
    `*, 
  Vote (
    id,
    value,
    created_at,
    estimation_id,
    player_id,
    Player (*)
    )
  `
  )
  .single();

export type EstimationWithPlayerVote = QueryData<
  typeof _estimationWithPlayerVote
>;

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
    const forUpdate: Estimation[] = [];

    estimations.forEach((estimation) => {
      if (estimation.isActive) {
        forUpdate.push({ ...estimation, isActive: false });
      }
      if (estimation.id === estimationId && !estimation.isActive) {
        forUpdate.push({ ...estimation, isActive });
      }
    });

    const { data, error } = await this.table.upsert(forUpdate);
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

  getActiveEstimationWithPlayerVote = async (
    sessionId: string,
    playerId: string
  ): Promise<EstimationWithPlayerVote | null> => {
    const estimationWithVotes = await this.table
      .select(
        `*, 
        Vote (
          id,
          value,
          created_at,
          estimation_id,
          player_id,
          Player (*)
          )
        `
      )
      .eq("isActive", true)
      .eq("session_id", sessionId)
      .eq("Vote.Player.id", playerId)
      .single();

    const { data, error } = await estimationWithVotes;

    if (error) {
      // throw error;
      return null;
    }
    return data;
  };

  getWithVotes = async (id: string): Promise<EstimationWithVotes[]> => {
    const estimationWithVotes = await this.table
      .select(
        `*, 
        Vote (
          id,
          value,
          created_at,
          estimation_id,
          player_id,
          Player(*)
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
