/**
 * Finance Module V2 - "2026 FinTech" Design System
 *
 * A complete rebuild with Bento Grid aesthetics, glassmorphism,
 * and gamified financial tracking.
 */

// Layout Components
export { BentoGrid, BentoCard } from "./layout/BentoGrid";
export { GlassCard } from "./layout/GlassCard";
export { FinanceHeader } from "./layout/FinanceHeader";
export { FinanceShell } from "./layout/FinanceShell";

// Navigation & Controls
export { SmartDatePicker } from "./controls/SmartDatePicker";
export { QuickActions } from "./controls/QuickActions";

// Wallet (Left Column)
export { AccountCard } from "./wallet/AccountCard";
export { AccountCarousel } from "./wallet/AccountCarousel";
export { AccountList } from "./wallet/AccountList";
export { NetWorthDisplay } from "./wallet/NetWorthDisplay";

// Feed (Center Column)
export { TransactionFeed } from "./feed/TransactionFeed";
export { TransactionRow } from "./feed/TransactionRow";
export { CashFlowChart } from "./feed/CashFlowChart";

// Future (Right Column)
export { GoalRing } from "./future/GoalRing";
export { GoalsGrid } from "./future/GoalsGrid";
export { InstallmentBar } from "./future/InstallmentBar";
export { InstallmentsTimeline } from "./future/InstallmentsTimeline";

// Modals & Overlays
export { BottomSheet } from "./modals/BottomSheet";
export { ExpenseModal } from "./modals/ExpenseModal";
export { IncomeModal } from "./modals/IncomeModal";
export { TransferModal } from "./modals/TransferModal";
export { GoalModal } from "./modals/GoalModal";
export { InstallmentModal } from "./modals/InstallmentModal";
export type { ExpenseFormData } from "./modals/ExpenseModal";
export type { IncomeFormData } from "./modals/IncomeModal";
export type { TransferFormData } from "./modals/TransferModal";
export type { GoalFormData } from "./modals/GoalModal";
export type { InstallmentFormData } from "./modals/InstallmentModal";

// Settings
export { AccountManager } from "./settings/AccountManager";
export { CategoryStudio } from "./settings/CategoryStudio";
export { SettingsPanel } from "./settings/SettingsPanel";
export type { NewCategoryForm } from "./settings/CategoryStudio";
export type { SettingsTab } from "./settings/SettingsPanel";

// Effects & Feedback
export { ConfettiCelebration } from "./effects/ConfettiCelebration";
export { ParticleTrail } from "./effects/ParticleTrail";
export { SkeletonCard } from "./effects/SkeletonCard";
