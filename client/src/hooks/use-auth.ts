import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  username: string | null;
}

const USER_STORAGE_KEY = 'dwtl_user';
const SESSION_TOKEN_KEY = 'dwtl_session_token';

function saveSessionToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Failed to save session token:', e);
  }
}

function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function saveUserToStorage(userData: User | null) {
  try {
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Failed to save user to storage:', e);
  }
}

function loadUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load user from storage:', e);
  }
  return null;
}

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authFetch("/api/auth/me");
        const data = await response.json();
        if (data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.displayName || data.user.firstName || data.user.email?.split("@")[0] || null,
            firstName: data.user.firstName || null,
            lastName: data.user.lastName || null,
            profileImageUrl: data.user.profileImageUrl || null,
            username: data.user.username || data.user.email?.split("@")[0] || null,
          };
          setUser(userData);
          saveUserToStorage(userData);
        } else {
          const stored = loadUserFromStorage();
          const token = getSessionToken();
          if (stored && token) {
            setUser(stored);
          } else {
            setUser(null);
            saveUserToStorage(null);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
        const stored = loadUserFromStorage();
        if (stored) {
          setUser(stored);
        }
      }
      setIsLoading(false);
    };
    
    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      if (data.sessionToken) {
        saveSessionToken(data.sessionToken);
      }
      
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName || data.user.firstName || data.user.email?.split("@")[0] || null,
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        profileImageUrl: data.user.profileImageUrl || null,
        username: data.user.username || data.user.email?.split("@")[0] || null,
      };
      
      setUser(userData);
      saveUserToStorage(userData);
      return { success: true, user: userData };
    } catch (err: any) {
      const message = err.message || "Login failed";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string, username?: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password, displayName, username }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      if (data.sessionToken) {
        saveSessionToken(data.sessionToken);
      }
      
      const userData: User = {
        id: data.userId,
        email: email,
        displayName: displayName || username || email.split("@")[0] || null,
        firstName: displayName?.split(' ')[0] || null,
        lastName: displayName?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: null,
        username: username || email.split("@")[0] || null,
      };
      
      setUser(userData);
      saveUserToStorage(userData);
      return { success: true, user: userData, emailVerificationRequired: data.emailVerificationRequired };
    } catch (err: any) {
      const message = err.message || "Registration failed";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: 'include' });
      queryClient.clear();
      setUser(null);
      saveUserToStorage(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [queryClient]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reset email");
      }
      return { success: true };
    } catch (err: any) {
      const message = err.message || "Failed to send reset email";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    return getSessionToken();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    clearError: () => setError(null),
    login,
    signup,
    loginWithGoogle: async () => ({ success: false, error: "Not available" }),
    loginWithGithub: async () => ({ success: false, error: "Not available" }),
    logout,
    isLoggingOut,
    resetPassword,
    getAuthToken,
  };
}

export const useFirebaseAuth = useAuth;
