import React from "react";
import ReactDOM from "react-dom/client";

import { AlarmOverlay } from "@/alarm/AlarmOverlay";
import "@/alarm/alarm.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AlarmOverlay />
  </React.StrictMode>,
);
