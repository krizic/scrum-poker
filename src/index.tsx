import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";

import * as serviceWorker from "./serviceWorker";
import App from "./App";

import "semantic-ui-css/semantic.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

Sentry.init({
  dsn: `${process.env.REACT_APP_SENTRY}`,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});

const root = createRoot(document.getElementById("root"));
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
