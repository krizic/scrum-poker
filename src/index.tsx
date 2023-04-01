import React from "react";
import ReactDOM from "react-dom";
import trianglify from "trianglify";

import * as serviceWorker from "./serviceWorker";
import App from "./App";

import "semantic-ui-css/semantic.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

ReactDOM.render(<App />, document.getElementById("root"));

var pattern = trianglify({
  width: window.innerWidth,
  height: window.innerHeight,
  xColors: [
    "#f7fcf0",
    "#e0f3db",
    "#ccebc5",
    "#a8ddb5",
    "#7bccc4",
    "#4eb3d3",
    "#2b8cbe",
    "#0868ac",
    "#084081",
  ],
  yColors: "match",
  variance: 0.63,
  cellSize: 129,
  colorFunction: trianglify.colorFunctions.interpolateLinear(0.37),
  fill: true,
  strokeWidth: 1,
});

const canvas = pattern.toCanvas() as HTMLCanvasElement;
canvas.className = "trianglify";

document.body.appendChild(canvas);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
