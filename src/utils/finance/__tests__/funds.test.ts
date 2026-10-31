import { describe, expect, it } from "vitest";
import type { Fund } from "@/types/modules/finance";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    focusWithoutFund,
    getFundDeleteBlocker,
    groupFunds,
    resolveFocusedFundIds,
} from "../funds";
import { normalizeFinanceData } from "../normalize";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    transfer,
} from "./fixtures";

const fund = (over: Partial<Fund> = {}): Fund => ({
    id: "fund_inv",
    name: "Investment",
    icon: "📈",
    color: "#000",
    kind: "custom",
    isVisible: true,
    order: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...over,
});

describe("normalizeFinanceData funds", () => {
    it("adds Me to data saved before funds existed", () => {
        const data = normalizeFinanceData({ accounts: [account()] });
        expect(data.funds.map((f) => f.id)).toEqual([FUND_ME_ID]);
        expect(data.funds[0].name).toBe("Me");
        expect(data.settings.focusedFundIds).toEqual([FUND_ME_ID]);
    });

    it("keeps an existing (renamed) Me and other funds untouched", () => {
        const me = fund({ id: FUND_ME_ID, name: "Mine", order: 0 });
        const data = normalizeFinanceData({ funds: [me, fund()] });
        expect(data.funds).toEqual([me, fund()]);
    });

    it("keeps a saved focus, including All (empty)", () => {
        const data = normalizeFinanceData({
            settings: {
                ...normalizeFinanceData().settings,
                focusedFundIds: [],
            },
        });
        expect(data.settings.focusedFundIds).toEqual([]);
    });
});

describe("fund focus", () => {
    const funds = [fund({ id: FUND_ME_ID, order: 0 }), fund()];

    it("drops unknown funds and falls back to Me when none is left", () => {
        expect(resolveFocusedFundIds(funds, ["fund_inv", "gone"])).toEqual([
            "fund_inv",
        ]);
        expect(resolveFocusedFundIds(funds, ["gone"])).toEqual([FUND_ME_ID]);
        expect(resolveFocusedFundIds(funds, [])).toEqual([]);
    });

    it("removing the only focused fund goes back to Me, not All", () => {
        expect(focusWithoutFund(["fund_inv"], "fund_inv")).toEqual([FUND_ME_ID]);
        expect(focusWithoutFund([], "fund_inv")).toEqual([]);
        expect(focusWithoutFund([FUND_ME_ID, "fund_inv"], "fund_inv")).toEqual([
            FUND_ME_ID,
        ]);
    });

    it("lists hidden funds after visible ones", () => {
        const { visible, hidden } = groupFunds([
            fund({ id: "c", order: 3, isVisible: false }),
            fund({ id: "b", order: 2 }),
            fund({ id: "a", order: 1 }),
        ]);
        expect(visible.map((f) => f.id)).toEqual(["a", "b"]);
        expect(hidden.map((f) => f.id)).toEqual(["c"]);
    });
});

describe("getFundDeleteBlocker", () => {
    const base = { accounts: [account({ initialBalance: 100 })] };

    it("never deletes Me or Charity", () => {
        const data = financeData(base);
        expect(getFundDeleteBlocker(data, FUND_ME_ID)).not.toBeNull();
        expect(getFundDeleteBlocker(data, FUND_CHARITY_ID)).not.toBeNull();
    });

    it("allows deleting an unused, empty fund", () => {
        expect(getFundDeleteBlocker(financeData(base), "fund_inv")).toBeNull();
    });

    it("blocks while an income, expense, transfer, loan or repayment references it", () => {
        const cases = [
            { incomes: [income({ fundId: "fund_inv" })] },
            { expenses: [expense({ fundId: "fund_inv" })] },
            {
                transfers: [
                    transfer({ toAccountId: "acc_1", toFundId: "fund_inv" }),
                ],
            },
            {
                transfers: [
                    transfer({ toAccountId: "acc_1", fromFundId: "fund_inv" }),
                ],
            },
            { loans: [loan({ fundId: "fund_inv" })] },
            {
                loans: [loan()],
                loanPayments: [loanPayment({ fundId: "fund_inv" })],
            },
        ];
        cases.forEach((records) => {
            const data = financeData({ ...base, ...records });
            expect(getFundDeleteBlocker(data, "fund_inv")).not.toBeNull();
        });
    });
});
