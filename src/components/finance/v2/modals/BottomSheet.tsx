import { useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showHandle?: boolean;
    snapPoints?: number[];
}

export const BottomSheet = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showHandle = true,
}: BottomSheetProps) => {
    const dragControls = useDragControls();

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleDragEnd = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        // Close if dragged down fast enough or far enough
        if (info.velocity.y > 500 || info.offset.y > 200) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                        }}
                        drag="y"
                        dragControls={dragControls}
                        dragConstraints={{ top: 0 }}
                        dragElastic={{ top: 0, bottom: 0.2 }}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-50",
                            "bg-background",
                            "rounded-t-[32px]",
                            "shadow-2xl",
                            "max-h-[90vh]",
                            "flex flex-col",
                            className
                        )}>
                        {/* Handle Bar */}
                        {showHandle && (
                            <div
                                onPointerDown={(e) => dragControls.start(e)}
                                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none">
                                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                            </div>
                        )}

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
                                <h2 className="text-lg font-semibold">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    title="Close"
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                            {children}
                        </div>

                        {/* Safe area padding for iOS */}
                        <div className="h-safe-area-inset-bottom" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
