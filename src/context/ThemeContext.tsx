import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { create } from "zustand";
import { DarkColors, LightColors, ThemeColors } from "../utils/Color";
import {
  AccentKey,
  DEFAULT_ACCENT,
  getAccentPreset,
  isAccentKey,
} from "../utils/AccentColors";

export type ThemeMode = "system" | "light" | "dark";

// Keeps the pre-AssetDiary prefix: it addresses a preference already stored on
// the device. Renaming it would reset everyone back to system theme.
const THEME_STORAGE_KEY = "@homevault/theme-mode";
const ACCENT_STORAGE_KEY = "@assetdiary/accent-color";

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";

type ThemeStore = {
  /** What the user picked. "system" follows the OS setting. */
  mode: ThemeMode;
  /** The chosen interactive-tint preset — see utils/AccentColors. */
  accent: AccentKey;
  /** True until the stored theme preference has been read from storage. */
  isRestoring: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  /** Rehydrate the persisted preference once at cold start. */
  restore: () => Promise<void>;
};

/**
 * Theme preference, persisted to AsyncStorage. Was a React context + provider;
 * now a Zustand store. Only the raw `mode`/`accent` live here — the resolved
 * palette depends on the live OS colour scheme, so it's computed in the
 * `useTheme` hook below, which keeps the old return shape (`mode`, `setMode`,
 * `colors`, `isDark`, `isRestoring`) so no call site changed.
 */
export const useThemeStore = create<ThemeStore>((set) => ({
  mode: "system",
  accent: DEFAULT_ACCENT,
  isRestoring: true,
  setMode: (nextMode) => {
    // Update immediately so the UI never waits on storage.
    set({ mode: nextMode });
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch((error) => {
      console.log("Unable to persist theme preference", error);
    });
  },
  setAccent: (nextAccent) => {
    set({ accent: nextAccent });
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, nextAccent).catch((error) => {
      console.log("Unable to persist accent preference", error);
    });
  },
  restore: async () => {
    try {
      // The splash is held until this resolves, so never let a wedged storage
      // read blank the screen forever — fall back to the default after 3s.
      const [storedMode, storedAccent] = await Promise.race([
        Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_STORAGE_KEY),
        ]),
        new Promise<[null, null]>((resolve) =>
          setTimeout(() => resolve([null, null]), 3000)
        ),
      ]);
      if (isThemeMode(storedMode)) {
        set({ mode: storedMode });
      }
      if (isAccentKey(storedAccent)) {
        set({ accent: storedAccent });
      }
    } catch (error) {
      console.log("Unable to restore theme preference", error);
    } finally {
      set({ isRestoring: false });
    }
  },
}));

type ThemeValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  /** The resolved palette for the currently active scheme. */
  colors: ThemeColors;
  isDark: boolean;
  isRestoring: boolean;
};

export const useTheme = (): ThemeValue => {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const accent = useThemeStore((state) => state.accent);
  const setAccent = useThemeStore((state) => state.setAccent);
  const isRestoring = useThemeStore((state) => state.isRestoring);

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const base = isDark ? DarkColors : LightColors;
  const accentOverride = getAccentPreset(accent)[isDark ? "dark" : "light"];

  return {
    mode,
    setMode,
    accent,
    setAccent,
    isDark,
    colors: { ...base, ...accentOverride },
    isRestoring,
  };
};
