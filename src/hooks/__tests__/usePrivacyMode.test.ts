import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { isPrivacyModeOn, setPrivacyMode, usePrivacyMode } from "../usePrivacyMode";

describe("usePrivacyMode", () => {
    afterEach(() => setPrivacyMode(false));

    it("remembers the choice on this device", () => {
        setPrivacyMode(true);
        expect(isPrivacyModeOn()).toBe(true);
        expect(localStorage.getItem("lifeos-finance-privacy")).toBe("1");
        setPrivacyMode(false);
        expect(localStorage.getItem("lifeos-finance-privacy")).toBeNull();
    });

    it("re-renders every subscriber on toggle", () => {
        const first = renderHook(() => usePrivacyMode());
        const second = renderHook(() => usePrivacyMode());
        expect(first.result.current.isHidden).toBe(false);
        act(() => first.result.current.toggle());
        expect(first.result.current.isHidden).toBe(true);
        expect(second.result.current.isHidden).toBe(true);
    });
});
