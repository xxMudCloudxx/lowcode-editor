import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("[Clerk] VITE_CLERK_PUBLISHABLE_KEY 未配置，协同功能将不可用");
}

// 使用 Dnd 作为拖拽逻辑实现的方法
createRoot(document.getElementById("root")!).render(
  <DndProvider backend={HTML5Backend}>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY || ""}
      afterSignOutUrl="/lowcode-editor/"
    >
      <BrowserRouter basename="/lowcode-editor">
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </DndProvider>
);
