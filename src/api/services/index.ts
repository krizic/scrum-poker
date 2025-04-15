import { supabase } from "../provider";
import { BaseApi } from "../base";
import { Estimation, Player, Session, Vote } from "../model";
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

  setAsDeleted = async (id: string): Promise<Estimation> => {
    const { data, error } = await this.table
      .update({ isDeleted: true })
      .eq("id", id)
      .single();
    if (error) {
      throw error;
    }
    return data;
  };

  changeEstimationStatus = async (
    session_id: string,
    estimationId: string,
    isActive: boolean
  ): Promise<Estimation> => {
    const estimationResponse = await this.getBySessionId(session_id);
    const forUpdate: Estimation[] = [];

    const estimations = Array.isArray(estimationResponse)
      ? estimationResponse
      : [estimationResponse];

    estimations.forEach((estimation) => {
      if (estimation.isActive) {
        forUpdate.push({ ...estimation, isActive: false, isEnded: true });
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
      .eq("session_id", sessionId)
      .eq("isDeleted", false);
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
      .eq("isDeleted", false)
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

  getPerSessionWithVotes = async (
    sessionId: string
  ): Promise<EstimationWithVotes[]> => {
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
      .eq("isDeleted", false)
      .eq("session_id", sessionId);

    const { data, error } = await estimationWithVotes;

    if (error) {
      throw error;
    }
    return data;
  };

  getOneWithVotes = async (id: string): Promise<EstimationWithVotes> => {
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
      .eq("isDeleted", false)
      .eq("id", id)
      .single();

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

  upsert = async (vote: Partial<Vote>): Promise<Vote> => {
    const { data, error } = await this.table.upsert(vote).select();
    if (error) {
      throw error;
    }
    return data[0];
  };

  getByEstimationAndPlayer = async (
    estimationId: string,
    playerId: string
  ): Promise<Vote | null> => {
    const { data, error } = await this.table
      .select()
      .eq("estimation_id", estimationId)
      .eq("player_id", playerId)
      .limit(1);

    if (error) {
      // throw error;
      return null;
    }
    return data?.[0] || null;
  };
}

export class PlayerService extends BaseApi<Player, "Player"> {
  constructor() {
    super(supabase, "Player");
  }
}
