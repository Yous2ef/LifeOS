import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { X, Cloud, Shield, Smartphone, Sparkles } from "lucide-react";
import { GoogleLoginButton } from "./GoogleLoginButton";

const BANNER_DISMISSED_KEY = "lifeos_login_banner_dismissed";
const BANNER_NEVER_SHOW_KEY = "lifeos_login_banner_never_show";

interface LoginPromptBannerProps {
    variant?: "full" | "compact";
    className?: string;
}

export const LoginPromptBanner: React.FC<LoginPromptBannerProps> = ({
    variant = "full",
    className = "",
}) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isDismissed, setIsDismissed] = useState(false);
    const [neverShow, setNeverShow] = useState(false);

    // Check if banner was dismissed or set to never show
    useEffect(() => {
        const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
        const neverShowStored = localStorage.getItem(BANNER_NEVER_SHOW_KEY);

        if (dismissed === "true") {
            setIsDismissed(true);
        }
        if (neverShowStored === "true") {
            setNeverShow(true);
        }
    }, []);

    // Don't show if user is authenticated, loading, dismissed, or set to never show
    if (isAuthenticated || isLoading || isDismissed || neverShow) {
        return null;
    }

    const handleDismiss = () => {
        sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
        setIsDismissed(true);
    };

    const handleNeverShow = () => {
        localStorage.setItem(BANNER_NEVER_SHOW_KEY, "true");
        setNeverShow(true);
    };

    const benefits = [
        {
            icon: Cloud,
            title: "Cloud Sync",
            description: "Access your data from anywhere",
        },
        {
            icon: Shield,
            title: "Secure Backup",
            description: "Never lose your data",
        },
        {
            icon: Smartphone,
            title: "Multi-Device",
            description: "Sync across all devices",
        },
    ];

    if (variant === "compact") {
        return (
            <Card className={`p-4 bg-primary/5 border-primary/20 ${className}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Cloud className="text-primary" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">
                                Sign in to sync your data
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Keep your data safe with Google Drive backup
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <GoogleLoginButton />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismiss}
                            className="text-muted-foreground hover:text-foreground">
                            <X size={16} />
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card
            className={`p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Sparkles className="text-primary" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Unlock Cloud Features
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Sign in with Google to enable cloud sync and backup
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground -mt-2 -mr-2">
                    <X size={18} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {benefits.map((benefit) => (
                    <div
                        key={benefit.title}
                        className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <benefit.icon className="text-primary" size={18} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground text-sm">
                                {benefit.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {benefit.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNeverShow}
                    className="text-muted-foreground text-xs">
                    Don't show again
                </Button>
                <GoogleLoginButton />
            </div>
        </Card>
    );
};
