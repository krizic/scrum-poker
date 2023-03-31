import React, { Suspense } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";

import "./App.css";

const StartPage = React.lazy(() => import("./pages/start"));
const DeveloperPage = React.lazy(() => import("./pages/developer"));
const PoPage = React.lazy(() => import("./pages/po-page"));

enum Path {
  Start = "/",
  Developer = "/dev",
  Po = "/po",
}

function App() {
  const baseName = process.env.REACT_APP_BASE;

  return (
    <BrowserRouter basename={baseName}>
      <Routes>
        <Route
          path={Path.Developer}
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <DeveloperPage />
            </Suspense>
          }
        />
        <Route
          path={Path.Po}
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <PoPage />
            </Suspense>
          }
        />
        <Route
          path={Path.Start}
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <StartPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
