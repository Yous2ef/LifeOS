import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    GraduationCap,
    Briefcase,
    Code2,
    Home as HomeIcon,
    FolderOpen,
    Wallet,
    Settings,
    Download,
    Upload,
    ChevronLeft,
    ChevronRight,
    Github,
    LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportData } from "../../utils/storage";
import { NotificationCenter } from "../ui/NotificationCenter";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMenu, SyncStatus } from "../auth";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
    onImport: () => void;
}

const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/university", icon: GraduationCap, label: "University" },
    { to: "/freelancing", icon: Briefcase, label: "Freelancing" },
    { to: "/programming", icon: Code2, label: "Programming" },
    { to: "/finance", icon: Wallet, label: "Finance" },
    { to: "/home", icon: HomeIcon, label: "Home & Life" },
    { to: "/misc", icon: FolderOpen, label: "Miscellaneous" },
];

export const Sidebar: React.FC<SidebarProps> = ({ onImport }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isAuthenticated, user, login, isGoogleLoaded } = useAuth();

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col sticky top-0 transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}>
            {/* Logo */}
            <div
                className={cn(
                    "border-b border-sidebar-border",
                    isCollapsed ? "p-3" : "p-6"
                )}>
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img
                                src="../Logo.png"
                                alt="LifeOS Logo"
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0">
                            <img
                                src="../Logo.png"
                                alt="LifeOS Logo"
                                className="w-14 h-14 object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-sidebar-foreground">
                                LifeOS
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Your Life, Organized
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <NotificationCenter />
                            <ThemeToggle />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className={cn("px-3 space-y-1", isCollapsed && "px-2")}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            title={isCollapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center rounded-lg transition-all duration-200 group text-sm font-medium",
                                    isCollapsed
                                        ? "justify-center p-2.5"
                                        : "gap-3 px-3 py-2.5",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )
                            }>
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={18}
                                        className={cn(
                                            "transition-all duration-200 shrink-0",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground group-hover:text-sidebar-foreground"
                                        )}
                                    />
                                    {!isCollapsed && <span>{item.label}</span>}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>

            {/* Bottom Actions */}
            <Separator />
            <div className={cn("space-y-1", isCollapsed ? "p-2" : "p-3")}>
                {/* Auth Section */}
                {!isAuthenticated && !isCollapsed && (
                    <>
                        <Button
                            onClick={login}
                            variant="outline"
                            size="sm"
                            disabled={!isGoogleLoaded}
                            className="w-full justify-start gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10">
                            <LogIn size={16} className="text-primary" />
                            <span className="text-sm">Sign in with Google</span>
                        </Button>
                        <Separator className="my-2" />
                    </>
                )}
                {!isAuthenticated && isCollapsed && (
                    <>
                        <button
                            onClick={login}
                            disabled={!isGoogleLoaded}
                            title="Sign in with Google"
                            className="w-full p-2.5 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors border border-primary/20">
                            <LogIn size={16} />
                        </button>
                        <Separator className="my-2" />
                    </>
                )}
                {/* Logged in user section */}
                {isAuthenticated && user && !isCollapsed && (
                    <>
                        <UserMenu variant="full" className="w-full" />
                        <div className="px-3 py-1">
                            <SyncStatus showLabel showTime />
                        </div>
                        <Separator className="my-2" />
                    </>
                )}
                {isAuthenticated && user && isCollapsed && (
                    <>
                        <UserMenu />
                        <div className="flex justify-center py-1">
                            <SyncStatus />
                        </div>
                        <Separator className="my-2" />
                    </>
                )}
                {/* Show sync status for local mode too */}
                {!isAuthenticated && !isCollapsed && (
                    <div className="px-3 py-1 mb-2">
                        <SyncStatus showLabel showTime />
                    </div>
                )}
                {!isAuthenticated && isCollapsed && (
                    <div className="flex justify-center py-1 mb-2">
                        <SyncStatus />
                    </div>
                )}
                {!isCollapsed ? (
                    <>
                        <Button
                            onClick={exportData}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                            <Download size={16} />
                            Export Data
                        </Button>

                        <Button
                            onClick={onImport}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                            <Upload size={16} />
                            Import Data
                        </Button>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )
                            }>
                            <Settings size={16} />
                            Settings
                        </NavLink>
                        <Button
                            onClick={() =>
                                window.open(
                                    "https://github.com/Yous2ef/LifeOS",
                                    "_blank"
                                )
                            }
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                            <Github size={16} />
                            GitHub
                        </Button>
                        <Separator className="my-2" />
                        <Button
                            onClick={toggleCollapse}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                            <ChevronLeft size={16} />
                            Collapse
                        </Button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={exportData}
                            title="Export Data"
                            className="w-full p-2.5 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                            <Download size={16} />
                        </button>

                        <button
                            onClick={onImport}
                            title="Import Data"
                            className="w-full p-2.5 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                            <Upload size={16} />
                        </button>

                        <NavLink
                            to="/settings"
                            title="Settings"
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-center p-2.5 rounded-lg transition-colors duration-200",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )
                            }>
                            <Settings size={16} />
                        </NavLink>

                        <button
                            onClick={() =>
                                window.open(
                                    "https://github.com/Yous2ef/LifeOS",
                                    "_blank"
                                )
                            }
                            title="GitHub"
                            className="w-full p-2.5 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                            <Github size={16} />
                        </button>

                        <Separator className="my-2" />

                        <button
                            onClick={toggleCollapse}
                            className="w-full h-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            aria-label="Expand sidebar">
                            <ChevronRight size={16} />
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};
