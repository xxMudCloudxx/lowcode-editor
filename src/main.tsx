import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
createRoot(document.getElementById("root")!).render(
  <DndProvider backend={HTML5Backend}>
    <App />
  </DndProvider>
);
