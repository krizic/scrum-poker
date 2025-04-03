import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { Session } from "../../../api/model";
import { SessionService } from "../../../api";

// Define a type for the slice state
interface SessionState {
  current?: Session;
}

// Define the initial state using that type
const initialState: SessionState = {
  current: undefined,
};

// First, create the thunk
export const fetchSessionById = createAsyncThunk(
  "session/fetchSessionById",
  async (sessionId: Session["id"], thunkAPI) => {
    const sessionService = new SessionService();
    const response = await sessionService.get(sessionId);
    return response;
  }
);

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        console.error("Error fetching session:", action.error.message);
      });
  },
});

export const {  } = sessionSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectSession = (state: RootState) => state.session.current;

export const sessionReducer  = sessionSlice.reducer;
