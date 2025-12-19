import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    GraduationCap,
    Briefcase,
    Code2,
    Home as HomeIcon,
    FolderOpen,
    Settings,
    Download,
    Upload,
    Menu,
    X,
    Sparkles,
    Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportData } from "../../utils/storage";
import { NotificationCenter } from "../ui/NotificationCenter";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
    onImport: () => void;
}

const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/university", icon: GraduationCap, label: "University" },
    { to: "/freelancing", icon: Briefcase, label: "Freelancing" },
    { to: "/programming", icon: Code2, label: "Programming" },
    { to: "/home", icon: HomeIcon, label: "Home & Life" },
    { to: "/misc", icon: FolderOpen, label: "Miscellaneous" },
];

export const MobileNav: React.FC<MobileNavProps> = ({ onImport }) => {
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-40 bg-accent border-b border-sidebar-border shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                            <Sparkles
                                className="text-primary-foreground"
                                size={20}
                            />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-sidebar-foreground">
                                LifeOS
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationCenter />
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
                            aria-label="Toggle menu">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={closeMenu}
                    />
                    <div className="lg:hidden fixed inset-y-0 right-0 w-64 bg-accent border-l border-sidebar-border z-50 flex flex-col animate-slideInRight">
                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto py-4">
                            <nav className="px-3 space-y-1">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={closeMenu}
                                        className={({ isActive }) =>
                                            cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
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
                                                <span>{item.label}</span>
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>

                        {/* Bottom Actions */}
                        <Separator />
                        <div className="p-3 space-y-1">
                            <Button
                                onClick={() => {
                                    exportData();
                                    closeMenu();
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                                <Download size={16} />
                                Export Data
                            </Button>

                            <Button
                                onClick={() => {
                                    onImport();
                                    closeMenu();
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                                <Upload size={16} />
                                Import Data
                            </Button>

                            <NavLink
                                to="/settings"
                                onClick={closeMenu}
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
                                onClick={() => {
                                    window.open(
                                        "https://github.com/Yous2ef/LifeOS",
                                        "_blank"
                                    );
                                    closeMenu();
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground">
                                <Github size={16} />
                                GitHub
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};
