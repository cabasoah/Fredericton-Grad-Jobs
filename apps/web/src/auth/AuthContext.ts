import { createContext, useContext } from "react";
import type { LoginInput, RegisterInput, User } from "@fredericton-grad-jobs/shared";

export type AuthContextValue = {
  // "loading" until GET /auth/me has answered once.
  status: "loading" | "ready";
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
};

// Only relative paths, so ?returnTo= cannot send users to another site.
export const safeReturnTo = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
