import { setupWorker } from "msw/browser";
import { handlers } from "@/api/mock/handler.ts";

export const worker = setupWorker(...handlers);
