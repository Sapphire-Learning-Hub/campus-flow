import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { i18nReady } from "./i18n";
import "./style/base.css";
import { initializeAppSettings } from "@/services/preferences";

initializeAppSettings();

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true") {
    const { worker } = await import("@/api/mock/browser.ts");

    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    });
  }
}

async function bootstrap() {
  await Promise.all([enableMocking(), i18nReady]);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
