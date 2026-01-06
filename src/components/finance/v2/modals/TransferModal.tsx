/**
 * TransferModal V2 - Glassmorphic account transfer
 *
 * Features:
 * - Electric blue theme for transfers
 * - Visual card-to-card transfer animation
 * - Source and destination account selection
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type { Account, Currency } from "@/types/modules/finance";

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transfer: TransferFormData) => void;
    accounts: Account[];
    defaultCurrency: Currency;
    calculateBalance: (accountId: string) => number;
    formatCurrency: (amount: number) => string;
}

export interface TransferFormData {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    notes?: string;
}

export const TransferModal = ({
    isOpen,
    onClose,
    onSubmit,
    accounts,
    defaultCurrency,
    calculateBalance,
    formatCurrency,
}: TransferModalProps) => {
    const activeAccounts = accounts.filter((a) => a.isActive);

    const [formData, setFormData] = useState<TransferFormData>({
        fromAccountId: activeAccounts[0]?.id || "",
        toAccountId: activeAccounts[1]?.id || "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [isTransferring, setIsTransferring] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            const active = accounts.filter((a) => a.isActive);
            setFormData({
                fromAccountId: active[0]?.id || "",
                toAccountId: active[1]?.id || "",
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
            setIsTransferring(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSubmit = async () => {
        if (
            !formData.fromAccountId ||
            !formData.toAccountId ||
            formData.amount <= 0
        ) {
            return;
        }
        if (formData.fromAccountId === formData.toAccountId) {
            return;
        }

        // Trigger animation
        setIsTransferring(true);

        // Wait for animation
        await new Promise((resolve) => setTimeout(resolve, 800));

        onSubmit(formData);
        onClose();
    };

    const fromAccount = accounts.find((a) => a.id === formData.fromAccountId);
    const toAccount = accounts.find((a) => a.id === formData.toAccountId);
    const fromBalance = fromAccount ? calculateBalance(fromAccount.id) : 0;
    const toBalance = toAccount ? calculateBalance(toAccount.id) : 0;

    const isValid =
        formData.fromAccountId &&
        formData.toAccountId &&
        formData.fromAccountId !== formData.toAccountId &&
        formData.amount > 0 &&
        formData.amount <= fromBalance;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[51]">
                        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                        <ArrowRight className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Transfer Money
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Move money between accounts
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    title="Close"
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {/* Amount Input */}
                                <div className="text-center py-4">
                                    <div className="text-4xl font-bold text-blue-500 mb-2">
                                        <span className="text-2xl text-muted-foreground mr-1">
                                            {defaultCurrency}
                                        </span>
                                        <input
                                            type="number"
                                            value={formData.amount || ""}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    amount:
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0,
                                                }))
                                            }
                                            placeholder="0.00"
                                            className="bg-transparent text-center w-40 outline-none text-4xl font-bold"
                                            autoFocus
                                        />
                                    </div>
                                    {fromAccount &&
                                        formData.amount > fromBalance && (
                                            <p className="text-sm text-rose-500">
                                                Insufficient balance (Available:{" "}
                                                {formatCurrency(fromBalance)})
                                            </p>
                                        )}
                                </div>

                                {/* Visual Transfer */}
                                <div className="relative flex items-center justify-center gap-4 py-6">
                                    {/* From Account */}
                                    <motion.div
                                        animate={
                                            isTransferring
                                                ? { scale: 0.95 }
                                                : { scale: 1 }
                                        }
                                        className={cn(
                                            "flex-1 p-4 rounded-2xl border-2 transition-all",
                                            formData.fromAccountId
                                                ? "border-blue-500/50 bg-blue-500/10"
                                                : "border-dashed border-muted-foreground/30"
                                        )}>
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                            From
                                        </Label>
                                        <select
                                            value={formData.fromAccountId}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    fromAccountId:
                                                        e.target.value,
                                                }))
                                            }
                                            className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer">
                                            <option value="">
                                                Select account
                                            </option>
                                            {activeAccounts.map((acc) => (
                                                <option
                                                    key={acc.id}
                                                    value={acc.id}
                                                    disabled={
                                                        acc.id ===
                                                        formData.toAccountId
                                                    }>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                        {fromAccount && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            fromAccount.color,
                                                    }}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatCurrency(
                                                        fromBalance
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Transfer Arrow with Particles */}
                                    <div className="relative">
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    fromAccountId:
                                                        prev.toAccountId,
                                                    toAccountId:
                                                        prev.fromAccountId,
                                                }));
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            animate={
                                                isTransferring
                                                    ? {
                                                          x: [0, 20, 40, 60],
                                                          opacity: [1, 1, 1, 0],
                                                      }
                                                    : {}
                                            }
                                            transition={{
                                                duration: 0.6,
                                                ease: "easeOut",
                                            }}
                                            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                                            <ArrowRight className="w-5 h-5 text-white" />
                                        </motion.button>

                                        {/* Particle Trail */}
                                        {isTransferring && (
                                            <>
                                                {[...Array(5)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{
                                                            x: 0,
                                                            opacity: 0,
                                                            scale: 0,
                                                        }}
                                                        animate={{
                                                            x: [0, 30, 60],
                                                            opacity: [0, 1, 0],
                                                            scale: [
                                                                0.5, 1, 0.5,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 0.6,
                                                            delay: i * 0.08,
                                                            ease: "easeOut",
                                                        }}
                                                        className="absolute top-1/2 left-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400"
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* To Account */}
                                    <motion.div
                                        animate={
                                            isTransferring
                                                ? { scale: 1.05 }
                                                : { scale: 1 }
                                        }
                                        className={cn(
                                            "flex-1 p-4 rounded-2xl border-2 transition-all",
                                            formData.toAccountId
                                                ? "border-blue-500/50 bg-blue-500/10"
                                                : "border-dashed border-muted-foreground/30"
                                        )}>
                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                            To
                                        </Label>
                                        <select
                                            value={formData.toAccountId}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    toAccountId: e.target.value,
                                                }))
                                            }
                                            className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer">
                                            <option value="">
                                                Select account
                                            </option>
                                            {activeAccounts.map((acc) => (
                                                <option
                                                    key={acc.id}
                                                    value={acc.id}
                                                    disabled={
                                                        acc.id ===
                                                        formData.fromAccountId
                                                    }>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                        {toAccount && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            toAccount.color,
                                                    }}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatCurrency(toBalance)}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Date */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Date
                                    </Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                date: e.target.value,
                                            }))
                                        }
                                        className="rounded-xl"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                        <FileText className="w-3 h-3" />
                                        Notes (optional)
                                    </Label>
                                    <TextArea
                                        value={formData.notes || ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="Add any notes..."
                                        className="rounded-xl min-h-[60px]"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl"
                                    disabled={isTransferring}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!isValid || isTransferring}
                                    className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600">
                                    {isTransferring ? (
                                        <motion.span
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1,
                                            }}>
                                            Transferring...
                                        </motion.span>
                                    ) : (
                                        "Transfer"
                                    )}
                                </Button>
                            </div>

                            {/* Preview */}
                            {isValid && !isTransferring && (
                                <div className="px-4 pb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-sm text-center">
                                        <span className="text-muted-foreground">
                                            {fromAccount?.name}
                                        </span>
                                        <span className="mx-2 text-blue-500">
                                            →
                                        </span>
                                        <span className="text-muted-foreground">
                                            {toAccount?.name}
                                        </span>
                                        <span className="ml-2 font-semibold text-blue-500">
                                            {defaultCurrency}{" "}
                                            {formData.amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
