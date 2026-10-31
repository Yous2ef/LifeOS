export const CHART_COLORS = [
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
];

export const colorAt = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

export const TOOLTIP_STYLE = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
};

export const AXIS_PROPS = {
    stroke: "var(--muted-foreground)",
    fontSize: 12,
};

/** Amount formatters every report gets from the page (privacy-masked) */
export interface ReportFormat {
    /** "1,234 EGP", masked in privacy mode */
    currency: (amount: number) => string;
    /** Axis ticks ("12k"), masked in privacy mode */
    axis: (amount: number) => string;
    /** dd/mm/yyyy */
    date: (date: string) => string;
}

/** "Nov 2026" from YYYY-MM */
export const monthLabel = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    return new Date(year, monthNum - 1, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });
};

/** "+1,234 EGP" / "−1,234 EGP" */
export const signed = (amount: number, currency: ReportFormat["currency"]) =>
    `${amount < 0 ? "−" : "+"}${currency(Math.abs(amount))}`;

/** "850", "1.5k", "12k": thousands only once there is a thousand */
export const axisAmount = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs < 1000) return String(Math.round(amount));
    const thousands = amount / 1000;
    return `${abs < 10000 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`;
};

// Shared enter animation: report sections fade up, staggered by their parent
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};
