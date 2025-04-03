import { configureStore } from "@reduxjs/toolkit";
import { sessionReducer } from "./features/session/sessionSlice";
import { estimationReducer } from "./features/estimation/estimationSlice";
import { streamReducer } from "./features/stream/streamSlice";
// ...

export const store = configureStore({
  devTools: true,
  reducer: {
    session: sessionReducer,
    estimation: estimationReducer,
    stream: streamReducer,
    // comments: commentsReducer,
    // users: usersReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
