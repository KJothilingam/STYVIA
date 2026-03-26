import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { RootErrorBoundary } from "./components/RootErrorBoundary";

const el = document.getElementById("root");
if (!el) {
  throw new Error('Missing #root element');
}

createRoot(el).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
