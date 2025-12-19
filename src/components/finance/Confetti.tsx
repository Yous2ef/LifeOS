import { useEffect, useState, useCallback } from "react";

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    speedX: number;
    speedY: number;
    rotationSpeed: number;
}

interface ConfettiProps {
    isActive: boolean;
    duration?: number;
    particleCount?: number;
    onComplete?: () => void;
}

const COLORS = [
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#f59e0b", // Orange
    "#ec4899", // Pink
    "#8b5cf6", // Purple
    "#14b8a6", // Teal
    "#f43f5e", // Rose
    "#eab308", // Yellow
];

const Confetti = ({
    isActive,
    duration = 3000,
    particleCount = 100,
    onComplete,
}: ConfettiProps) => {
    const [particles, setParticles] = useState<ConfettiPiece[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    const createParticles = useCallback(() => {
        const newParticles: ConfettiPiece[] = [];
        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: -10 - Math.random() * 20,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random() * 0.5,
                speedX: (Math.random() - 0.5) * 4,
                speedY: 2 + Math.random() * 4,
                rotationSpeed: (Math.random() - 0.5) * 10,
            });
        }
        return newParticles;
    }, [particleCount]);

    useEffect(() => {
        if (isActive) {
            setParticles(createParticles());
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
                setParticles([]);
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isActive, duration, createParticles, onComplete]);

    if (!isVisible || particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-confetti-fall"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                        animation: `confetti-fall ${
                            1.5 + Math.random()
                        }s ease-out forwards`,
                        animationDelay: `${Math.random() * 0.5}s`,
                    }}>
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: particle.color }}
                    />
                </div>
            ))}

            <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(var(--scale, 1));
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(var(--scale, 1));
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
};

// Success celebration message
interface CelebrationMessageProps {
    message: string;
    subMessage?: string;
    emoji?: string;
    isVisible: boolean;
    onClose?: () => void;
}

export const CelebrationMessage = ({
    message,
    subMessage,
    emoji = "🎉",
    isVisible,
    onClose,
}: CelebrationMessageProps) => {
    useEffect(() => {
        if (isVisible && onClose) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none">
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl 
                   animate-bounce-in border-2 border-green-500/20
                   text-center max-w-sm mx-4">
                <div className="text-6xl mb-4 animate-pulse">{emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {message}
                </h3>
                {subMessage && (
                    <p className="text-gray-600 dark:text-gray-400">
                        {subMessage}
                    </p>
                )}
            </div>

            <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

// Hook to trigger celebration
export const useCelebration = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState<{
        message: string;
        subMessage?: string;
        emoji?: string;
    } | null>(null);

    const celebrate = useCallback(
        (message: string, subMessage?: string, emoji?: string) => {
            setShowConfetti(true);
            setCelebrationMessage({ message, subMessage, emoji });
        },
        []
    );

    const endCelebration = useCallback(() => {
        setShowConfetti(false);
        setCelebrationMessage(null);
    }, []);

    return {
        showConfetti,
        celebrationMessage,
        celebrate,
        endCelebration,
        setShowConfetti,
        setCelebrationMessage,
    };
};

export default Confetti;
