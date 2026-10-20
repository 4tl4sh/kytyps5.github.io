import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/big-shoulders";
import "@fontsource-variable/public-sans";
import App from "./App";
import "./styles.css";
import "./enhancements.css";
import "./hero-deck.css";
import "./theme-ripple.css";
import "./feature-updates.css";
import "./community.css";
import { registerAssetCache } from "./lib/service-worker";

registerAssetCache();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
