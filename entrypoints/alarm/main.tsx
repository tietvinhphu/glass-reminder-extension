import React from "react";
import ReactDOM from "react-dom/client";

import { AlarmOverlay } from "@/src/alarm/AlarmOverlay";
import "@/src/alarm/alarm.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AlarmOverlay />
  </React.StrictMode>,
);
