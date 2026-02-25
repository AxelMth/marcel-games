"use client";

import { useState, useEffect, useCallback } from "react";
import { storage } from "./storage";

const AUTH_TOKEN_KEY = "mg:auth_token";
const AUTH_USER_KEY = "mg:auth_user";

export interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
}

export interface UseAuthReturn extends AuthState {
  login: (token: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Shared auth hook used by both earthunt and wordclimb.
 * Persists token via Capacitor Preferences on native or localStorage on web.
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    token: null,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [token, username] = await Promise.all([
        storage.get(AUTH_TOKEN_KEY),
        storage.get(AUTH_USER_KEY),
      ]);
      if (!cancelled) {
        setState({ token, username, isLoading: false });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (token: string, username: string) => {
    await Promise.all([
      storage.set(AUTH_TOKEN_KEY, token),
      storage.set(AUTH_USER_KEY, username),
    ]);
    setState({ token, username, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      storage.remove(AUTH_TOKEN_KEY),
      storage.remove(AUTH_USER_KEY),
    ]);
    setState({ token: null, username: null, isLoading: false });
  }, []);

  return {
    ...state,
    isAuthenticated: !!state.token,
    login,
    logout,
  };
}
