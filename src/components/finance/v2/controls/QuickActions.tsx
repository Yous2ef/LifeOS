import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

type ActionType = "income" | "expense" | "transfer";

interface QuickActionsProps {
    onAddIncome: () => void;
    onAddExpense: () => void;
    onAddTransfer: () => void;
    className?: string;
    variant?: "fab" | "inline";
}

export const QuickActions = ({
    onAddIncome,
    onAddExpense,
    onAddTransfer,
    className,
    variant = "fab",
}: QuickActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        {
            type: "income" as ActionType,
            label: "Add Income",
            icon: <ArrowUpRight className="w-4 h-4" />,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
            onClick: onAddIncome,
        },
        {
            type: "expense" as ActionType,
            label: "Add Expense",
            icon: <ArrowDownLeft className="w-4 h-4" />,
            color: "text-red-500",
            bgColor: "bg-red-500/10 hover:bg-red-500/20",
            onClick: onAddExpense,
        },
        {
            type: "transfer" as ActionType,
            label: "Transfer",
            icon: <ArrowLeftRight className="w-4 h-4" />,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
            onClick: onAddTransfer,
        },
    ];

    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {actions.map((action) => (
                    <Button
                        key={action.type}
                        variant="ghost"
                        size="sm"
                        onClick={action.onClick}
                        className={cn(
                            "rounded-full gap-2",
                            action.bgColor,
                            action.color
                        )}>
                        {action.icon}
                        <span className="hidden sm:inline">
                            {action.label.replace("Add ", "")}
                        </span>
                    </Button>
                ))}
            </div>
        );
    }

    // FAB variant - Floating Action Button
    return (
        <div
            className={cn(
                "fixed bottom-24 right-4 z-50 lg:bottom-8",
                className
            )}>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "w-14 h-14 rounded-full",
                            "bg-primary text-primary-foreground",
                            "shadow-lg shadow-primary/30",
                            "flex items-center justify-center",
                            "transition-all duration-200",
                            "hover:shadow-xl hover:shadow-primary/40"
                        )}>
                        <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.2 }}>
                            <Plus className="w-6 h-6" />
                        </motion.div>
                    </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="w-48 p-2 rounded-2xl"
                    align="end"
                    side="top"
                    sideOffset={12}>
                    <AnimatePresence>
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.type}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}>
                                <DropdownMenuItem
                                    onClick={action.onClick}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer my-2",
                                        "transition-colors duration-150",
                                        action.bgColor
                                    )}>
                                    <span
                                        className={cn(
                                            "p-2 rounded-lg",
                                            action.bgColor,
                                            action.color
                                        )}>
                                        {action.icon}
                                    </span>
                                    <span
                                        className={cn(
                                            "font-medium",
                                            action.color
                                        )}>
                                        {action.label}
                                    </span>
                                </DropdownMenuItem>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
