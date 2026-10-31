import { useCallback, useSyncExternalStore } from "react";

// Per device on purpose (not synced): hiding amounts is about who is next to
// this screen, not about the account.
const STORAGE_KEY = "lifeos-finance-privacy";

/** Shown instead of a number while amounts are hidden */
export const PRIVACY_MASK = "••••";

/** The one place a formatted amount turns into the mask */
export const maskAmount = (text: string, hidden: boolean): string =>
    hidden ? PRIVACY_MASK : text;

const readStored = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
};

let hidden = readStored();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const isPrivacyModeOn = (): boolean => hidden;

export const setPrivacyMode = (value: boolean) => {
    hidden = value;
    try {
        if (value) localStorage.setItem(STORAGE_KEY, "1");
        else localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage blocked: the choice still holds for this session
    }
    notify();
};

// Keeps other tabs of the app in step
const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    hidden = readStored();
    notify();
};

const subscribe = (listener: () => void) => {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
};

/** Shared "hide amounts" switch; every subscriber re-renders on toggle */
export const usePrivacyMode = () => {
    const isHidden = useSyncExternalStore(subscribe, isPrivacyModeOn, () => false);
    const toggle = useCallback(() => setPrivacyMode(!isPrivacyModeOn()), []);
    /** Masks an already formatted amount while privacy mode is on */
    const mask = useCallback(
        (text: string) => maskAmount(text, isHidden),
        [isHidden],
    );
    return { isHidden, toggle, setHidden: setPrivacyMode, mask };
};
