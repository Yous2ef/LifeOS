import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
}

interface ParticleTrailProps {
    isActive: boolean;
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
    color?: string;
    particleCount?: number;
    duration?: number;
    onComplete?: () => void;
}

export const ParticleTrail = ({
    isActive,
    startPosition,
    endPosition,
    color = "#22c55e",
    particleCount = 15,
    duration = 800,
    onComplete,
}: ParticleTrailProps) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (isActive) {
            // Create particles with staggered delays
            const newParticles: Particle[] = Array.from(
                { length: particleCount },
                (_, i) => ({
                    id: i,
                    x: startPosition.x + (Math.random() - 0.5) * 20,
                    y: startPosition.y + (Math.random() - 0.5) * 20,
                    size: 4 + Math.random() * 4,
                })
            );

            setParticles(newParticles);

            // Clear and callback after animation
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, duration + 200);

            return () => clearTimeout(timer);
        }
    }, [
        isActive,
        startPosition,
        endPosition,
        particleCount,
        duration,
        onComplete,
    ]);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <AnimatePresence>
                {particles.map((particle, index) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            scale: 0,
                            opacity: 0,
                        }}
                        animate={{
                            x: [
                                particle.x,
                                particle.x +
                                    (endPosition.x - startPosition.x) * 0.3,
                                endPosition.x + (Math.random() - 0.5) * 30,
                            ],
                            y: [
                                particle.y,
                                particle.y +
                                    (endPosition.y - startPosition.y) * 0.5 -
                                    50,
                                endPosition.y + (Math.random() - 0.5) * 30,
                            ],
                            scale: [0, 1.2, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: duration / 1000,
                            delay: (index / particleCount) * 0.3,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: color,
                            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
                        }}
                        className="absolute rounded-full"
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Hook to use particle trail
export const useParticleTrail = () => {
    const [trail, setTrail] = useState<{
        isActive: boolean;
        start: { x: number; y: number };
        end: { x: number; y: number };
        color: string;
    }>({
        isActive: false,
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        color: "#22c55e",
    });

    const triggerTrail = (
        startElement: HTMLElement,
        endElement: HTMLElement,
        color?: string
    ) => {
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();

        setTrail({
            isActive: true,
            start: {
                x: startRect.left + startRect.width / 2,
                y: startRect.top + startRect.height / 2,
            },
            end: {
                x: endRect.left + endRect.width / 2,
                y: endRect.top + endRect.height / 2,
            },
            color: color || "#22c55e",
        });
    };

    const endTrail = () => {
        setTrail((prev) => ({ ...prev, isActive: false }));
    };

    return { trail, triggerTrail, endTrail };
};
