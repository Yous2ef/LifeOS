import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    shape: "circle" | "square" | "star";
}

interface ConfettiCelebrationProps {
    isActive: boolean;
    onComplete?: () => void;
    duration?: number;
    particleCount?: number;
    colors?: string[];
}

const COLORS = [
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
];

const createPiece = (index: number, colors: string[]): ConfettiPiece => ({
    id: index,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: ["circle", "square", "star"][
        Math.floor(Math.random() * 3)
    ] as ConfettiPiece["shape"],
});

export const ConfettiCelebration = ({
    isActive,
    onComplete,
    duration = 3000,
    particleCount = 50,
    colors = COLORS,
}: ConfettiCelebrationProps) => {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    const startCelebration = useCallback(() => {
        const newPieces = Array.from({ length: particleCount }, (_, i) =>
            createPiece(i, colors)
        );
        setPieces(newPieces);

        // Clear after duration
        setTimeout(() => {
            setPieces([]);
            onComplete?.();
        }, duration);
    }, [particleCount, colors, duration, onComplete]);

    useEffect(() => {
        if (isActive) {
            startCelebration();
        }
    }, [isActive, startCelebration]);

    const renderShape = (piece: ConfettiPiece) => {
        const size = 10 * piece.scale;

        switch (piece.shape) {
            case "circle":
                return (
                    <div
                        className="rounded-full"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: piece.color,
                        }}
                    />
                );
            case "square":
                return (
                    <div
                        className="rounded-sm"
                        style={{
                            width: size,
                            height: size,
                            backgroundColor: piece.color,
                        }}
                    />
                );
            case "star":
                return (
                    <div style={{ fontSize: size, color: piece.color }}>✦</div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            <AnimatePresence>
                {pieces.map((piece) => (
                    <motion.div
                        key={piece.id}
                        initial={{
                            x: `${piece.x}vw`,
                            y: `${piece.y}vh`,
                            rotate: piece.rotation,
                            opacity: 1,
                        }}
                        animate={{
                            y: "110vh",
                            rotate: piece.rotation + Math.random() * 720,
                            opacity: [1, 1, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className="absolute">
                        {renderShape(piece)}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Celebration Message Component
interface CelebrationMessageProps {
    isVisible: boolean;
    title: string;
    subtitle?: string;
    emoji?: string;
    onClose?: () => void;
}

export const CelebrationMessage = ({
    isVisible,
    title,
    subtitle,
    emoji = "🎉",
    onClose,
}: CelebrationMessageProps) => {
    useEffect(() => {
        if (isVisible && onClose) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] pointer-events-none">
                    <div className="bg-card/95 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-2xl border border-border/50 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring" }}
                            className="text-6xl mb-4">
                            {emoji}
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-bold mb-2">
                            {title}
                        </motion.h2>
                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-muted-foreground">
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
