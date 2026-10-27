import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { User } from "@fredericton-grad-jobs/shared";
import { API_URL } from "@/config";

export const apiUrl = (path: string) => `${API_URL}${path}`;

export const apiError = (status: number, code: string, message: string, details?: unknown) =>
  HttpResponse.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, { status });

// GET /auth/me: who the app thinks is signed in.
export const signedInAs = (user: User | null) =>
  http.get(apiUrl("/auth/me"), () =>
    user ? HttpResponse.json({ user }) : apiError(401, "UNAUTHORIZED", "Not signed in"),
  );

// Default: nobody is signed in. Tests add the handlers they need.
export const server = setupServer(signedInAs(null));
