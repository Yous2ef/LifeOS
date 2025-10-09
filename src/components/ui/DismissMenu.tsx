import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface DismissMenuProps {
    onDismiss: (period: "session" | "day" | "week" | "never") => void;
}

export const DismissMenu: React.FC<DismissMenuProps> = ({ onDismiss }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (period: "session" | "day" | "week" | "never") => {
        onDismiss(period);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-lg transition-colors duration-200 flex items-center gap-1"
                title="Dismiss options"
                aria-label="Dismiss options">
                <X size={20} />
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
                    <div className="py-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect("session");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors duration-150">
                            <div className="font-medium">For this session</div>
                            <div className="text-xs text-muted-foreground">
                                Show again when you reopen
                            </div>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect("day");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors duration-150">
                            <div className="font-medium">For 1 day</div>
                            <div className="text-xs text-muted-foreground">
                                Show again in 24 hours
                            </div>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect("week");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors duration-150">
                            <div className="font-medium">For 1 week</div>
                            <div className="text-xs text-muted-foreground">
                                Show again in 7 days
                            </div>
                        </button>
                        <div className="border-t border-border my-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect("never");
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150">
                            <div className="font-medium">Never show again</div>
                            <div className="text-xs text-destructive/80">
                                Permanently hide this notification
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
