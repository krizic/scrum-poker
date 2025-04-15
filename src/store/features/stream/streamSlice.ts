import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { Session } from "../../../api/model";
import { EstimationService } from "../../../api";

const FEATURE_NAME = "stream";

// Define a type for the slice state
interface FeatureState {
  estimationSubConnectionUrl?: string;
  estimationChangeStream?: Record<any, any>;
  voteSubConnectionUrl?: string;
  voteChangeStream?: Record<any, any>;
}

// Define the initial state using that type
const initialState: FeatureState = {};

export const subscribeToEstimationChanges = createAsyncThunk<
  string | undefined,
  string,
  { state: { [FEATURE_NAME]: FeatureState } }
>(
  `${FEATURE_NAME}/subscribeToEstimationChanges`,
  async (sessionId: Session["id"], thunkAPI) => {
    const service = new EstimationService();
    const state = thunkAPI.getState();

    if (!state[FEATURE_NAME].estimationSubConnectionUrl) {
      console.log("Estimation changes - SUBSCRIBED");
      const subscription = service
        .changes("session_id", sessionId, (payload) => {
          thunkAPI.dispatch(setEstimationStream(payload));
        })
        .subscribe();
      return subscription.socket.conn.url as string;
    }
  }
);

export const streamSlice = createSlice({
  name: FEATURE_NAME,
  initialState,
  reducers: {
    setEstimationStream: (state, action) => {
      state.estimationChangeStream = action.payload;
    },
    setVoteStream: (state, action) => {
      state.voteChangeStream = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(subscribeToEstimationChanges.fulfilled, (state, { payload }) => {
        payload !== undefined && (state.estimationSubConnectionUrl = payload);
      })
      .addCase(subscribeToEstimationChanges.rejected, (state, { payload }) => {
        console.error("Error subscribing to estimation changes:", payload);
      });
  },
});

export const { setEstimationStream, setVoteStream } = streamSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEstimationChangeStream = (state: RootState) =>
  state[FEATURE_NAME].estimationChangeStream;

export const selectVotesChangeStream = (state: RootState) =>
  state[FEATURE_NAME].voteChangeStream;

export const streamReducer = streamSlice.reducer;
