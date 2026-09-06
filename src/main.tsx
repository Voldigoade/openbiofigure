import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./design-system.css";
import "./styles.css";
import { registerServiceWorker } from "./registerServiceWorker";

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
