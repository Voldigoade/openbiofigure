import { createRoot } from "react-dom/client";
import { App } from "./App";
import {
  applyAppearancePreferences,
  loadPreferences,
} from "./domain/preferences/preferences";
import "./design-system.css";
import "./styles.css";
import "./product-surfaces.css";
import { registerServiceWorker } from "./registerServiceWorker";

applyAppearancePreferences(loadPreferences(window.localStorage));
createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
