import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Estimation, Session } from "../../../api/model";
import { EstimationService } from "../../../api";

import type { RootState } from "../../store";

const FEATURE_NAME = "estimation";

// Define a type for the slice state
interface FeatureState {
  current?: Estimation[];
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

export const estimationSlice = createSlice({
  name: FEATURE_NAME,
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchEstimationBySessionId.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchEstimationBySessionId.rejected, (state, action) => {
        console.error("Error fetching estimations:", action.error.message);
      });
  },
});

export const {} = estimationSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectEstimations = (state: RootState) =>
  state[FEATURE_NAME].current;

export const estimationReducer = estimationSlice.reducer;
