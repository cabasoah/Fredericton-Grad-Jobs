import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AuthResponseSchema,
  LoginSchema,
  RegisterSchema,
  type LoginInput,
  type RegisterInput,
  type User,
} from "@fredericton-grad-jobs/shared";
import { ApiError, apiFetch, jsonRequest } from "@/lib/api";
import { AuthContext, type AuthContextValue } from "./AuthContext";

// Holds the signed-in user. The session itself is an httpOnly cookie the
// browser sends automatically; this only mirrors GET /auth/me.
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setUser(AuthResponseSchema.parse(await apiFetch("/auth/me")).user);
      } catch (err) {
        // 401 just means "not signed in".
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Could not load the current user", err);
        }
        setUser(null);
      } finally {
        setStatus("ready");
      }
    };
    void loadUser();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const body = LoginSchema.parse(input);
    const signedIn = AuthResponseSchema.parse(await apiFetch("/auth/login", jsonRequest("POST", body))).user;
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const body = RegisterSchema.parse(input);
    const created = AuthResponseSchema.parse(await apiFetch("/auth/register", jsonRequest("POST", body))).user;
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
