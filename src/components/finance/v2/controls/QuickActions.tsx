import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
    /** Opens the quick-add sheet (Expense · Income · Transfer · Loan) */
    onAdd: () => void;
    className?: string;
}

/** Floating add button */
export const QuickActions = ({ onAdd, className }: QuickActionsProps) => (
    <div className={cn("fixed bottom-24 right-4 z-50 lg:bottom-8", className)}>
        <motion.button
            type="button"
            onClick={onAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Add"
            aria-label="Add"
            className={cn(
                "w-14 h-14 rounded-full",
                "bg-primary text-primary-foreground",
                "shadow-lg shadow-primary/30",
                "flex items-center justify-center",
                "transition-all duration-200",
                "hover:shadow-xl hover:shadow-primary/40",
            )}>
            <Plus className="w-6 h-6" />
        </motion.button>
    </div>
);
