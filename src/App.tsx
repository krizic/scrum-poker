import React from "react";
import {BrowserRouter, Switch, Route} from "react-router-dom";

import HomePage from "./pages/home";
import DeveloperPage from "./pages/developer";
import PoPage from "./pages/po-page";
import "./App.css";
import {AppRoutes} from "./constants";

declare let particlesJS: any;

particlesJS.load("particles-js", "particlesjs-config.json", () => {
  console.log("callback - particles.js config loaded");
});

function App() {
  const baseName = process.env.REACT_APP_BASE;

  return (
    <BrowserRouter basename={baseName}>
      {/* Sharable across the pages */}
      <div id="particles-js"></div>
      <Switch>
        <Route exact path={AppRoutes.Join}>
          <DeveloperPage />
        </Route>
        <Route exact path={`${AppRoutes.Session}/:id`}>
          <PoPage />
        </Route>
        <Route exact path={AppRoutes.Home}>
          <HomePage />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
