import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

const FEATURE_NAME = "stream";

// Define a type for the slice state
interface FeatureState {
  estimationsStream?: Record<string, any>;
  votesStream?: Record<string, any>;
}

// Define the initial state using that type
const initialState: FeatureState = {
  estimationsStream: {},
  votesStream: {},
};

export const streamSlice = createSlice({
  name: FEATURE_NAME,
  initialState,
  reducers: {
    setEstimationStream: (state, action) => {
      state.estimationsStream = action.payload;
    },
    setVotesStream: (state, action) => {
      state.votesStream = action.payload;
    },
  },
});


export const { setEstimationStream, setVotesStream } = streamSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEstimationStream = (state: RootState) =>
  state[FEATURE_NAME].estimationsStream;

export const selectVotesStream = (state: RootState) =>
  state[FEATURE_NAME].votesStream;

export const streamReducer = streamSlice.reducer;
