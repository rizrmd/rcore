/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 * it also listen the iframe action to handle auth.
 *
 * It is included in `src/index.html`.
 */

import { Root } from "@/components/app/root";
import { createRoot } from "react-dom/client";
import "./globals.css";

const elem = document.getElementById("root")!;
const app = <Root />;

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
