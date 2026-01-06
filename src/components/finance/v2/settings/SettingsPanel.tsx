/**
 * SettingsPanel V2 - Finance settings with tabs
 *
 * Features:
 * - Currency & locale settings
 * - Alert thresholds
 * - Data export/import
 * - Account & category management tabs
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    Wallet,
    Tags,
    Bell,
    Download,
    Upload,
    DollarSign,
    AlertTriangle,
    Shield,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/switch";
import type { FinanceSettings, Currency } from "@/types/modules/finance";

interface SettingsPanelProps {
    settings: FinanceSettings;
    onUpdateSettings: (updates: Partial<FinanceSettings>) => void;
    onExport: () => void;
    onImport: (data: unknown) => void;
    onResetData: () => void;
    accountsContent?: React.ReactNode; // AccountManager component
    categoriesContent?: React.ReactNode; // CategoryStudio component
}

type SettingsTab = "general" | "accounts" | "categories" | "alerts" | "data";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "accounts", label: "Accounts", icon: <Wallet className="w-4 h-4" /> },
    {
        id: "categories",
        label: "Categories",
        icon: <Tags className="w-4 h-4" />,
    },
    { id: "alerts", label: "Alerts", icon: <Bell className="w-4 h-4" /> },
    { id: "data", label: "Data", icon: <Shield className="w-4 h-4" /> },
];

const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
    { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

export const SettingsPanel = ({
    settings,
    onUpdateSettings,
    onExport,
    onImport,
    onResetData,
    accountsContent,
    categoriesContent,
}: SettingsPanelProps) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    onImport(data);
                } catch {
                    console.error("Invalid file format");
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Sidebar Tabs */}
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-48 shrink-0">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                        )}>
                        {tab.icon}
                        <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}>
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">
                                    General Settings
                                </h3>

                                {/* Currency */}
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <DollarSign className="w-4 h-4 text-primary" />
                                        Currency
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {CURRENCIES.map((currency) => (
                                            <button
                                                key={currency.code}
                                                onClick={() =>
                                                    onUpdateSettings({
                                                        defaultCurrency:
                                                            currency.code,
                                                    })
                                                }
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-xl transition-all text-left",
                                                    settings.defaultCurrency ===
                                                        currency.code
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50 hover:bg-muted"
                                                )}>
                                                <span className="text-lg">
                                                    {currency.symbol}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {currency.code}
                                                    </div>
                                                    <div className="text-xs opacity-75">
                                                        {currency.name}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Month Start Day */}
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Settings className="w-4 h-4 text-primary" />
                                        Financial Month Starts On
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={28}
                                            value={settings.monthStartDay}
                                            onChange={(e) =>
                                                onUpdateSettings({
                                                    monthStartDay: Math.min(
                                                        28,
                                                        Math.max(
                                                            1,
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1
                                                        )
                                                    ),
                                                })
                                            }
                                            className="w-20 rounded-xl text-center"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            of each month
                                        </span>
                                    </div>
                                </div>

                                {/* Show Cents */}
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <DollarSign className="w-4 h-4 text-primary" />
                                            Show Decimal Places (Cents)
                                        </div>
                                        <Switch
                                            checked={settings.showCents}
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    showCents: checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "accounts" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Manage Accounts
                                </h3>
                                {accountsContent}
                            </div>
                        )}

                        {activeTab === "categories" && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Manage Categories
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Create and customize expense categories.
                                    Drag to reorder.
                                </p>
                                {categoriesContent}
                            </div>
                        )}

                        {activeTab === "alerts" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">
                                    Alert Settings
                                </h3>

                                {/* Budget Alerts */}
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <span className="font-medium">
                                                Budget Alerts
                                            </span>
                                        </div>
                                        <Switch
                                            checked={
                                                settings.enableBudgetAlerts
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    enableBudgetAlerts: checked,
                                                })
                                            }
                                        />
                                    </div>

                                    {settings.enableBudgetAlerts && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            className="space-y-3">
                                            <Label className="text-xs text-muted-foreground">
                                                Alert when spending reaches % of
                                                budget
                                            </Label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="50"
                                                    max="100"
                                                    step="5"
                                                    value={
                                                        settings.budgetWarningThreshold
                                                    }
                                                    onChange={(e) =>
                                                        onUpdateSettings({
                                                            budgetWarningThreshold:
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ),
                                                        })
                                                    }
                                                    className="flex-1 accent-primary"
                                                />
                                                <span className="text-sm font-mono w-12 text-right">
                                                    {
                                                        settings.budgetWarningThreshold
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Installment Reminders */}
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-violet-500" />
                                            <span className="font-medium">
                                                Installment Due Reminders
                                            </span>
                                        </div>
                                        <Switch
                                            checked={
                                                settings.enableInstallmentReminders
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    enableInstallmentReminders:
                                                        checked,
                                                })
                                            }
                                        />
                                    </div>

                                    {settings.enableInstallmentReminders && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            className="space-y-3">
                                            <Label className="text-xs text-muted-foreground">
                                                Remind days before due date
                                            </Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={14}
                                                    value={
                                                        settings.installmentReminderDays
                                                    }
                                                    onChange={(e) =>
                                                        onUpdateSettings({
                                                            installmentReminderDays:
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 3,
                                                        })
                                                    }
                                                    className="w-20 rounded-xl text-center"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    days
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Insights */}
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">
                                                Smart Insights
                                            </span>
                                        </div>
                                        <Switch
                                            checked={settings.enableInsights}
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    enableInsights: checked,
                                                })
                                            }
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        AI-powered spending analysis and
                                        recommendations
                                    </p>
                                </div>

                                {/* Reports */}
                                <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                                    <div className="font-medium">
                                        Automated Reports
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Weekly Summary
                                        </span>
                                        <Switch
                                            checked={
                                                settings.weeklyReportEnabled
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    weeklyReportEnabled:
                                                        checked,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">
                                            Monthly Report
                                        </span>
                                        <Switch
                                            checked={
                                                settings.monthlyReportEnabled
                                            }
                                            onCheckedChange={(checked) =>
                                                onUpdateSettings({
                                                    monthlyReportEnabled:
                                                        checked,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "data" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold">
                                    Data Management
                                </h3>

                                {/* Export */}
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Download className="w-4 h-4 text-blue-500" />
                                                Export Data
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Download all your finance data
                                                as JSON
                                            </p>
                                        </div>
                                        <Button
                                            onClick={onExport}
                                            variant="outline"
                                            className="rounded-xl">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>

                                {/* Import */}
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 font-medium">
                                                <Upload className="w-4 h-4 text-emerald-500" />
                                                Import Data
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Restore from a previously
                                                exported file
                                            </p>
                                        </div>
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".json"
                                                onChange={handleFileImport}
                                                className="hidden"
                                            />
                                            <Button
                                                variant="outline"
                                                className="rounded-xl"
                                                asChild>
                                                <span>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Import
                                                </span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>

                                {/* Reset */}
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                                    <AnimatePresence mode="wait">
                                        {showResetConfirm ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-center space-y-4">
                                                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                                                <div>
                                                    <p className="font-medium text-red-600 dark:text-red-400">
                                                        Are you absolutely sure?
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        This will permanently
                                                        delete all your finance
                                                        data.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setShowResetConfirm(
                                                                false
                                                            )
                                                        }
                                                        className="flex-1 rounded-xl">
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            onResetData();
                                                            setShowResetConfirm(
                                                                false
                                                            );
                                                        }}
                                                        className="flex-1 rounded-xl">
                                                        Yes, Delete Everything
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                        Reset All Data
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Permanently delete all
                                                        finance data. Cannot be
                                                        undone.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setShowResetConfirm(
                                                            true
                                                        )
                                                    }
                                                    className="rounded-xl">
                                                    Reset
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export type { SettingsTab };
