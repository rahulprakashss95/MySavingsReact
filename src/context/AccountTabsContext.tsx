import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { ACCOUNT_TYPES, AccountType } from "../models/AccountModel";

/**
 * The order the Cash, Deposits & Dues tabs are drawn in. Not `ACCOUNT_TYPES`
 * order: that list is grouped by how the records behave, whereas the tab strip
 * leads with the two everyday types (a balance, then cash) and leaves the
 * slower-moving deposits and the two loan directions behind them.
 */
export const DEFAULT_ACCOUNT_TAB_ORDER: AccountType[] = [
  "Account Balance",
  "Cash",
  "Fixed Deposit",
  "Recurring Deposit",
  "Lent",
  "Borrowed",
];

// Same prefix as the dashboard keys: these address data on users' devices, and
// the app's storage namespace predates the AssetDiary name.
const STORAGE_KEY = "@homevault/account-tab-order";

const isAccountType = (value: unknown): value is AccountType =>
  (ACCOUNT_TYPES as readonly string[]).includes(value as string);

/**
 * Makes a stored order safe to render as the type list changes between
 * releases: anything unrecognised is dropped, duplicates collapse, and types the
 * stored order predates are appended rather than silently missing. A tab that
 * exists must always be reachable, and one that no longer exists must never be
 * drawn — an empty tab whose type nothing can be filed under is a dead end.
 */
export const normalizeAccountTabOrder = (stored: unknown): AccountType[] => {
  const order: AccountType[] = [];
  if (Array.isArray(stored)) {
    stored.forEach((key) => {
      if (isAccountType(key) && !order.includes(key)) order.push(key);
    });
  }
  // New types join at the end, so a customised order survives the upgrade
  // intact instead of being reshuffled around the newcomer.
  DEFAULT_ACCOUNT_TAB_ORDER.forEach((key) => {
    if (!order.includes(key)) order.push(key);
  });
  return order;
};

const persist = (order: AccountType[]) => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(order)).catch((error) => {
    console.log("Unable to persist account tab order", error);
  });
};

type AccountTabsStore = {
  order: AccountType[];
  /** Swaps a tab with its neighbour. A no-op at the ends. */
  move: (type: AccountType, direction: -1 | 1) => void;
  reset: () => void;
  /** Rehydrate the persisted order once at cold start. */
  restore: () => Promise<void>;
};

/**
 * The tab order for the accounts list, persisted to AsyncStorage. Same shape as
 * the dashboard layout store: written through immediately so the strip never
 * waits on storage, and rehydrated once from `bootstrapApp`.
 */
export const useAccountTabsStore = create<AccountTabsStore>((set, get) => ({
  order: [...DEFAULT_ACCOUNT_TAB_ORDER],
  move: (type, direction) => {
    const order = [...get().order];
    const from = order.indexOf(type);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    set({ order });
    persist(order);
  },
  reset: () => {
    const order = [...DEFAULT_ACCOUNT_TAB_ORDER];
    set({ order });
    persist(order);
  },
  restore: async () => {
    try {
      // The splash waits on this, so a wedged storage read must not blank the
      // screen forever — fall back to the default order after 3s.
      const stored = await Promise.race([
        AsyncStorage.getItem(STORAGE_KEY),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (stored) set({ order: normalizeAccountTabOrder(JSON.parse(stored)) });
    } catch (error) {
      console.log("Unable to restore account tab order", error);
    }
  },
}));
