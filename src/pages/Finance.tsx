/**
 * Finance Page - V2 "2026 FinTech" Design
 *
 * This is the new Finance module featuring:
 * - Bento Grid aesthetics with glassmorphism
 * - 3-column desktop layout (Wallet | Feed | Future)
 * - 1-column mobile with carousel & bottom sheets
 * - Gamified goals and installments
 * - Smart date filtering
 *
 * To restore the old version, import from '@/pages/FinanceLegacy'
 */

import { FinanceV2 } from "@/components/finance/v2/FinanceV2";

export const Finance = () => {
    return <FinanceV2 />;
};

export default Finance;
