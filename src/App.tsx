import React from "react";
import {BrowserRouter, Switch, Route} from "react-router-dom";

import StartPage from "./pages/start";
import DeveloperPage from  "./pages/developer";
import PoPage from  "./pages/po-page";
import "./App.css";

declare let particlesJS: any

particlesJS.load('particles-js', "particlesjs-config.json", () => {
  console.log('callback - particles.js config loaded');
});

function App() {

  const baseName = process.env.REACT_APP_BASE;

  return (
    <BrowserRouter basename={baseName}>
      {/* Sharable across the pages */}
      <div id="particles-js"></div>
      <Switch>
        <Route path="/dev">
          <DeveloperPage/>
        </Route>
        <Route path="/po">
          <PoPage/>
        </Route>
        <Route path="/">
          <StartPage/>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
