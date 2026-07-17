import { setupWorker } from "msw/browser";
import { handlers } from "@/api/mock/handler";

export const worker = setupWorker(...handlers);
