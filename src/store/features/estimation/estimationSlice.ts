import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Estimation, Session, Player } from "../../../api/model";
import { EstimationService } from "../../../api";

import type { RootState } from "../../store";

const FEATURE_NAME = "estimation";

// Define a type for the slice state
interface FeatureState {
  current?: Estimation[];
  activeForPlayer?: Awaited<
    ReturnType<EstimationService["getActiveEstimationWithPlayerVote"]>
  >;

}

// Define the initial state using that type
const initialState: FeatureState = {
  current: [],
};

// First, create the thunk
export const fetchEstimationBySessionId = createAsyncThunk(
  `${FEATURE_NAME}/fetchEstimationBySessionId`,
  async (sessionId: Session["id"], thunkAPI) => {
    const service = new EstimationService();
    const response = await service.getBySessionId(sessionId);
    return response;
  }
);

export const fetchActiveEstimationForPlayer = createAsyncThunk(
  `${FEATURE_NAME}/fetchActiveEstimationForPlayer`,
  async (
    {
      sessionId,
      playerId,
    }: { sessionId: Session["id"]; playerId: Player["id"] },
    thunkAPI
  ) => {
    const service = new EstimationService();
    try {
      const response = await service.getActiveEstimationWithPlayerVote(
        sessionId,
        playerId
      );
      return response;
    } catch (error) {
      console.error("Error fetching active estimation for player:", error);
      return thunkAPI.rejectWithValue(error);
    }
  }
);


export const estimationSlice = createSlice({
  name: FEATURE_NAME,
  initialState,
  reducers: {

  },
  extraReducers(builder) {
    builder
      .addCase(fetchEstimationBySessionId.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchEstimationBySessionId.rejected, (state, action) => {
        console.error("Error fetching estimations:", action.error.message);
      })
      .addCase(fetchActiveEstimationForPlayer.fulfilled, (state, action) => {
        state.activeForPlayer = action.payload;
      })
      .addCase(fetchActiveEstimationForPlayer.rejected, (state, action) => {
        state.activeForPlayer = undefined;
      })
  },
});

export const estimationReducer = estimationSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectEstimations = (state: RootState) =>
  state[FEATURE_NAME].current;

export const selectActiveEstimationForPlayer = (state: RootState) =>
  state[FEATURE_NAME].activeForPlayer;

export const selectCurrentSelectedPlayerEstimation = (state: RootState) => {
  return (playerId: Player["id"]) =>
    state[FEATURE_NAME].activeForPlayer?.Vote.find(
      (vote) => vote.player_id === playerId
    );
};

export const selectActiveEstimation = (state: RootState) => {
  return state[FEATURE_NAME].current.find(
    (estimation) => estimation.isActive === true
  );
};


