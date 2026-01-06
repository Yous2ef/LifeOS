import { motion } from "framer-motion";
import {
    Wallet,
    CreditCard,
    Landmark,
    Smartphone,
    HandCoins,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/types/modules/finance";

interface AccountCardProps {
    account: Account;
    balance: number;
    formatCurrency: (amount: number) => string;
    onClick?: () => void;
    isSelected?: boolean;
    compact?: boolean;
    className?: string;
}

const getAccountIcon = (type: AccountType) => {
    switch (type) {
        case "bank":
            return <Landmark className="w-5 h-5" />;
        case "mobile-wallet":
            return <Smartphone className="w-5 h-5" />;
        case "cash":
            return <Wallet className="w-5 h-5" />;
        case "credit-card":
            return <CreditCard className="w-5 h-5" />;
        case "savings":
            return <HandCoins className="w-5 h-5" />;
        case "investment":
            return <TrendingUp className="w-5 h-5" />;
        default:
            return <Wallet className="w-5 h-5" />;
    }
};

const getGradient = (color: string, compact: boolean) => {
    // Create a subtle gradient based on account color
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : { r: 59, g: 130, b: 246 };
    };

    const rgb = hexToRgb(color);

    // Create a darker shade for the gradient
    const darkerR = Math.max(0, rgb.r - 40);
    const darkerG = Math.max(0, rgb.g - 40);
    const darkerB = Math.max(0, rgb.b - 40);

    return `linear-gradient(135deg, 
    rgb(${rgb.r}, ${rgb.g}, ${rgb.b},0.25) 0%, 
    rgb(${darkerR}, ${darkerG}, ${darkerB},${compact ? 0.1 : 1}) 100%)`;
};

export const AccountCard = ({
    account,
    balance,
    formatCurrency,
    onClick,
    isSelected = false,
    compact = false,
    className,
}: AccountCardProps) => {
    const gradient = getGradient(account.color, compact);

    if (compact) {
        return (
            <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl w-full",
                    "transition-all duration-200",
                    "border-2",
                    isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-transparent hover:border-primary/30"
                )}>
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: gradient }}>
                    {account.icon ? (
                        <span className="text-lg">{account.icon}</span>
                    ) : (
                        getAccountIcon(account.type)
                    )}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm truncate">
                        {account.name}
                    </p>
                    <p
                        className={cn(
                            "text-xs",
                            balance >= 0
                                ? "text-muted-foreground"
                                : "text-red-500"
                        )}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </motion.button>
        );
    }

    // Full "Virtual Credit Card" style
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative overflow-hidden rounded-3xl p-5",
                "cursor-pointer select-none",
                "min-w-[260px] h-[160px]",
                "shadow-xl transition-all duration-300",
                isSelected
                    ? "ring-4 ring-primary ring-offset-4 ring-offset-background shadow-2xl"
                    : "ring-2 ring-transparent",
                className
            )}
            style={{
                background: gradient,
                boxShadow: isSelected
                    ? `0 30px 60px -15px ${account.color}80, 0 0 0 2px white`
                    : `0 20px 40px -12px ${account.color}40`,
            }}>
            {/* Decorative circles */}
            <div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
                style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10"
                style={{ background: "rgba(255,255,255,0.3)" }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between text-white">
                {/* Top row - Icon and Type */}
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {account.icon ? (
                            <span className="text-2xl">{account.icon}</span>
                        ) : (
                            getAccountIcon(account.type)
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                            {account.type.replace("-", " ")}
                        </span>
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-primary-foreground"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom row - Name and Balance */}
                <div>
                    <p className="text-sm font-medium opacity-80 mb-1">
                        {account.name}
                    </p>
                    <motion.p
                        key={balance}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl font-bold tracking-tight tabular-nums">
                        {formatCurrency(balance)}
                    </motion.p>
                </div>
            </div>

            {/* Shine effect */}
            <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ x: "200%", opacity: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
            />
        </motion.div>
    );
};
