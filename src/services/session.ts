const TOKEN_KEY = "campus-flow-token";

function getStorage(kind: "local" | "session"): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

export function getAccessToken(): string | null {
  return (
    getStorage("local")?.getItem(TOKEN_KEY) ?? getStorage("session")?.getItem(TOKEN_KEY) ?? null
  );
}

export function storeAccessToken(token: string, remember: boolean): void {
  clearAccessToken();
  getStorage(remember ? "local" : "session")?.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  getStorage("local")?.removeItem(TOKEN_KEY);
  getStorage("session")?.removeItem(TOKEN_KEY);
}
