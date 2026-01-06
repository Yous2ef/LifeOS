import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FinanceShellProps {
    children?: ReactNode;
    className?: string;
    leftColumn?: ReactNode;
    centerColumn?: ReactNode;
    rightColumn?: ReactNode; // Optional - if not provided, uses 2-column layout
}

/**
 * FinanceShell - Responsive 2 or 3-column layout for desktop, 1-column for mobile
 *
 * Desktop 2-col: [Left: Wallet (sticky)] [Center: Feed + Goals/Installments preview]
 * Desktop 3-col: [Left: Wallet] [Center: Feed] [Right: Future]
 * Mobile: Single column vertical scroll
 */
export const FinanceShell = ({
    children,
    className,
    leftColumn,
    centerColumn,
    rightColumn,
}: FinanceShellProps) => {
    // If using named columns, render column layout
    if (leftColumn || centerColumn) {
        const isTwoColumn = !rightColumn;

        return (
            <div className={cn("min-h-screen  mt-5 pb-24 lg:pb-8", className)}>
                {/* Mobile Layout - Single Column */}
                <div className="lg:hidden space-y-4">
                    {leftColumn}
                    {rightColumn}
                    {centerColumn}
                </div>

                {/* Desktop Layout */}
                {isTwoColumn ? (
                    // 2-Column Layout: Left (4 cols) + Center (8 cols)
                    <div className="hidden lg:grid lg:grid-cols-12 gap-6 px-6">
                        {/* Left Column - The Wallet (4 cols, sticky) */}
                        <aside className="lg:col-span-4 space-y-4 sticky top-24 self-start overflow-y-auto scrollbar-none">
                            {leftColumn}
                        </aside>

                        {/* Center Column - Feed + Future widgets (8 cols) */}
                        <main className="lg:col-span-8 space-y-4">
                            {centerColumn}
                        </main>
                    </div>
                ) : (
                    // 3-Column Layout: Left (3 cols) + Center (6 cols) + Right (3 cols)
                    <div className="hidden lg:grid lg:grid-cols-12 gap-6 px-6">
                        {/* Left Column - The Wallet (3 cols) */}
                        <aside className="lg:col-span-3 space-y-4 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-none">
                            {leftColumn}
                        </aside>

                        {/* Center Column - The Feed (6 cols) */}
                        <main className="lg:col-span-6 space-y-4">
                            {centerColumn}
                        </main>

                        {/* Right Column - The Future (3 cols) */}
                        <aside className="lg:col-span-3 space-y-4 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-none">
                            {rightColumn}
                        </aside>
                    </div>
                )}
            </div>
        );
    }

    // Default: just render children
    return (
        <div
            className={cn(
                "min-h-screen pb-24 lg:pb-8 px-4 lg:px-6",
                className
            )}>
            {children}
        </div>
    );
};

/**
 * FinanceSection - A labeled section within a column
 */
interface FinanceSectionProps {
    title?: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

export const FinanceSection = ({
    title,
    subtitle,
    action,
    children,
    className,
}: FinanceSectionProps) => {
    return (
        <section className={cn("space-y-3", className)}>
            {(title || action) && (
                <div className="flex items-center justify-between px-1">
                    <div>
                        {title && (
                            <h2 className="text-lg font-semibold text-foreground">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
};
