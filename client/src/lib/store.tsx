import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const STORAGE_KEY = "darkwave-chain-preferences";

export interface UserPreferences {
  favorites: string[];
  theme: "dark" | "light" | "system";
  notifications: boolean;
  recentSearches: string[];
  dismissedNotifications: string[];
}

const defaultPreferences: UserPreferences = {
  favorites: [],
  theme: "dark",
  notifications: true,
  recentSearches: [],
  dismissedNotifications: [],
};

function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn("Failed to load preferences:", e);
  }
  return defaultPreferences;
}

function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("Failed to save preferences:", e);
  }
}

interface PreferencesContextType {
  preferences: UserPreferences;
  toggleFavorite: (appId: string) => void;
  isFavorite: (appId: string) => boolean;
  setTheme: (theme: "dark" | "light" | "system") => void;
  toggleNotifications: () => void;
  addRecentSearch: (query: string) => void;
  dismissNotification: (id: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const toggleFavorite = useCallback((appId: string) => {
    setPreferences((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(appId)
        ? prev.favorites.filter((id) => id !== appId)
        : [...prev.favorites, appId],
    }));
  }, []);

  const isFavorite = useCallback(
    (appId: string) => preferences.favorites.includes(appId),
    [preferences.favorites]
  );

  const setTheme = useCallback((theme: "dark" | "light" | "system") => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const toggleNotifications = useCallback(() => {
    setPreferences((prev) => ({ ...prev, notifications: !prev.notifications }));
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setPreferences((prev) => ({
      ...prev,
      recentSearches: [query, ...prev.recentSearches.filter((s) => s !== query)].slice(0, 10),
    }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setPreferences((prev) => ({
      ...prev,
      dismissedNotifications: [...prev.dismissedNotifications, id],
    }));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        toggleFavorite,
        isFavorite,
        setTheme,
        toggleNotifications,
        addRecentSearch,
        dismissNotification,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "ecosystem";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "welcome",
      type: "info",
      title: "Welcome to Trust Layer",
      message: "Explore the Trust Layer ecosystem and start building decentralized apps.",
      timestamp: new Date(),
      read: false,
    },
    {
      id: "new-app",
      type: "ecosystem",
      title: "New App Registered",
      message: "GarageBot has joined the ecosystem with IoT-powered garage automation.",
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
  ]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, markAsRead, markAllAsRead, unreadCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
