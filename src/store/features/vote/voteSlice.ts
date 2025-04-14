import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { Estimation, Player, Vote } from "../../../api/model";
import { VoteService } from "../../../api";

const FEATURE_NAME = "vote";

// Define a type for the slice state
interface VoteState {
  current?: Vote;
  isLoadingValue?: Vote["value"];
}

// Define the initial state using that type
const initialState: VoteState = {
  current: undefined,
};

// First, create the thunk
export const fetchVoteByEstimationAndPlayer = createAsyncThunk(
  `${FEATURE_NAME}/fetchVoteByEstimationAndPlayer`,
  async (
    {
      estimationId,
      playerId,
    }: { estimationId: Estimation["id"]; playerId: Player["id"] },
    thunkAPI
  ) => {
    const service = new VoteService();
    const response = await service.getByEstimationAndPlayer(
      estimationId,
      playerId
    );
    if (response === null) {
      const newVote = await service.upsert({
        estimation_id: estimationId,
        player_id: playerId,
      });
      return newVote;
    }

    return response;
  }
);

// First, create the thunk
export const updateVote = createAsyncThunk(
  `${FEATURE_NAME}/updateVote`,
  async (
    { voteId, value }: { voteId: Vote["id"]; value: Vote["value"] },
    thunkAPI
  ) => {
    const service = new VoteService();
    const response = await service.upsert({ id: voteId, value });

    return response;
  }
);

export const voteSlice = createSlice({
  name: "vote",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchVoteByEstimationAndPlayer.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchVoteByEstimationAndPlayer.rejected, (state, action) => {
        console.error("Error fetching vote:", action.error.message);
      })
      .addCase(updateVote.fulfilled, (state, action) => {
        state.current = action.payload;
        state.isLoadingValue = undefined;
      })
      .addCase(updateVote.pending, (state, action) => {
        state.isLoadingValue = action.meta.arg.value;
      });
  },
});

export const {} = voteSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectVote = (state: RootState) => state[FEATURE_NAME].current;
export const selectVoteLoading = (state: RootState) =>
  state[FEATURE_NAME].isLoadingValue;

export const voteReducer = voteSlice.reducer;
