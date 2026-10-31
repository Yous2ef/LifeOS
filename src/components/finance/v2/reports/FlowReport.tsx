import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Briefcase, Crown, PieChart, TrendingUp } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart as RechartsPieChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { FinanceProject } from "@/types/modules/finance";
import {
    NO_PROJECT_KEY,
    sumAmounts,
    topByTitle,
    totalsByCategory,
    totalsByProject,
} from "@/utils/finance/aggregations";
import { AXIS_PROPS, TOOLTIP_STYLE, colorAt, type ReportFormat } from "./chartTheme";
import { ReportCard, StatTile } from "./ReportCard";

/** An income or expense, reduced to what the reports read */
export interface FlowRow {
    id: string;
    title: string;
    amount: number;
    date: string;
    categoryId: string;
    projectId?: string;
}

export interface FlowCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export type FlowKind = "income" | "expense";

interface FlowReportProps {
    kind: FlowKind;
    rows: FlowRow[];
    categories: FlowCategory[];
    projects: FinanceProject[];
    /** One entry per month of the selected range, empty months included */
    monthly: { key: string; month: string; amount: number }[];
    /** Length of the range in months, for the average */
    monthCount: number;
    format: ReportFormat;
}

// Rows whose category was deleted still count, under one "Other" bucket
const OTHER_CATEGORY: FlowCategory = {
    id: "__other__",
    name: "Other",
    icon: "❔",
    color: "#94a3b8",
};

const COPY = {
    income: {
        total: "Total income",
        byCategory: "Income by Category",
        totalHint: "total earned",
        trend: "Monthly Income",
        top: "Top Sources",
        breakdown: "Income Breakdown",
        breakdownHint: "Where your money comes from",
        empty: "No income in this time period",
        noProjects: "Tag income with a project to see it here.",
        gradient: "from-emerald-500 to-teal-500",
        bar: "#10b981",
    },
    expense: {
        total: "Total spent",
        byCategory: "Expenses by Category",
        totalHint: "total spent",
        trend: "Monthly Spending",
        top: "Top Spending",
        breakdown: "Spending Breakdown",
        breakdownHint: "Where your money goes",
        empty: "No expenses in this time period",
        noProjects: "Tag expenses with a project to see it here.",
        gradient: "from-rose-500 to-red-500",
        bar: "#ef4444",
    },
} as const;

/**
 * One report layout for both income and expenses, so the two always offer the
 * same depth: totals, average per month, by category (with drill-down), by
 * project, monthly trend and top sources.
 */
export const FlowReport = ({
    kind,
    rows,
    categories,
    projects,
    monthly,
    monthCount,
    format,
}: FlowReportProps) => {
    const copy = COPY[kind];
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        null,
    );

    const { byCategory, groupedRows } = useMemo(() => {
        const known = new Set(categories.map((c) => c.id));
        const grouped = rows.map((row) =>
            known.has(row.categoryId)
                ? row
                : { ...row, categoryId: OTHER_CATEGORY.id },
        );
        const list = grouped.some((row) => row.categoryId === OTHER_CATEGORY.id)
            ? [...categories, OTHER_CATEGORY]
            : categories;
        return {
            byCategory: totalsByCategory(grouped, list).filter((c) => c.amount > 0),
            groupedRows: grouped,
        };
    }, [rows, categories]);

    const total = sumAmounts(rows);
    const average = total / Math.max(monthCount, 1);
    const top = byCategory[0];

    const byProject = useMemo(() => {
        const names = new Map(projects.map((p) => [p.id, p.name]));
        return totalsByProject(rows).map((group) => ({
            ...group,
            name:
                group.key === NO_PROJECT_KEY
                    ? "No project"
                    : (names.get(group.key) ?? "Deleted project"),
        }));
    }, [rows, projects]);
    const hasProjects = byProject.some((group) => group.key !== NO_PROJECT_KEY);

    const topSources = useMemo(() => topByTitle(rows, 5), [rows]);

    const selectedRows = useMemo(
        () =>
            selectedCategoryId
                ? groupedRows
                      .filter((row) => row.categoryId === selectedCategoryId)
                      .sort((a, b) => b.date.localeCompare(a.date))
                : [],
        [groupedRows, selectedCategoryId],
    );

    const formatTooltip = (value: number) => format.currency(value);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                    label={copy.total}
                    value={format.currency(total)}
                    accent={kind === "income" ? "text-emerald-500" : "text-rose-500"}
                />
                <StatTile
                    label="Average per month"
                    value={format.currency(average)}
                    hint={`Over ${monthCount} ${monthCount === 1 ? "month" : "months"}`}
                />
                <StatTile label="Transactions" value={String(rows.length)} />
                <StatTile
                    label="Top category"
                    value={top ? `${top.category.icon} ${top.category.name}` : "—"}
                    hint={top ? `${top.percentage.toFixed(0)}% of the total` : undefined}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportCard
                    icon={<PieChart className="w-5 h-5" />}
                    gradient="from-violet-500 to-purple-500"
                    title={copy.byCategory}
                    subtitle={`${format.currency(total)} ${copy.totalHint}`}>
                    {byCategory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {copy.empty}
                        </p>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="h-[200px] w-[200px] shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={byCategory.slice(0, 6).map((c) => ({
                                                name: c.category.name,
                                                amount: c.amount,
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="amount"
                                            nameKey="name">
                                            {byCategory.slice(0, 6).map((c, index) => (
                                                <Cell key={c.category.id} fill={colorAt(index)} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={formatTooltip}
                                            contentStyle={TOOLTIP_STYLE}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 w-full space-y-2">
                                {byCategory.slice(0, 6).map((c, index) => (
                                    <div key={c.category.id} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: colorAt(index) }}
                                        />
                                        <span className="text-sm truncate flex-1">
                                            {c.category.icon} {c.category.name}
                                        </span>
                                        <span className="text-sm tabular-nums">
                                            {format.currency(c.amount)}
                                        </span>
                                        <span className="text-xs text-muted-foreground w-9 text-right">
                                            {c.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ReportCard>

                <ReportCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    gradient={copy.gradient}
                    title={copy.trend}
                    subtitle={`Dashed line: average ${format.currency(average)}`}>
                    <div className="h-[230px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthly}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                    opacity={0.5}
                                />
                                <XAxis dataKey="month" {...AXIS_PROPS} />
                                <YAxis {...AXIS_PROPS} tickFormatter={format.axis} />
                                <Tooltip
                                    formatter={formatTooltip}
                                    contentStyle={TOOLTIP_STYLE}
                                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                                />
                                <Bar
                                    dataKey="amount"
                                    name={kind === "income" ? "Income" : "Expenses"}
                                    fill={copy.bar}
                                    radius={[6, 6, 0, 0]}
                                />
                                <ReferenceLine
                                    y={average}
                                    stroke="var(--muted-foreground)"
                                    strokeDasharray="5 5"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ReportCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportCard
                    icon={<Briefcase className="w-5 h-5" />}
                    gradient="from-indigo-500 to-blue-500"
                    title="By Project">
                    {hasProjects ? (
                        <ShareList
                            items={byProject.map((group) => ({
                                id: group.key,
                                label: group.name,
                                amount: group.amount,
                                count: group.count,
                                percentage: group.percentage,
                                muted: group.key === NO_PROJECT_KEY,
                            }))}
                            format={format}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            {copy.noProjects}
                        </p>
                    )}
                </ReportCard>

                <ReportCard
                    icon={<Crown className="w-5 h-5" />}
                    gradient="from-amber-400 to-orange-500"
                    title={copy.top}
                    subtitle="Grouped by title">
                    {topSources.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            {copy.empty}
                        </p>
                    ) : (
                        <ShareList
                            items={topSources.map((source) => ({
                                id: source.key,
                                label: source.title,
                                amount: source.amount,
                                count: source.count,
                                percentage: source.percentage,
                            }))}
                            format={format}
                        />
                    )}
                </ReportCard>
            </div>

            <ReportCard
                icon={<BarChart3 className="w-5 h-5" />}
                gradient="from-cyan-500 to-blue-500"
                title={copy.breakdown}
                subtitle={`${copy.breakdownHint} · tap a category for its transactions`}>
                <div className="space-y-4">
                    {byCategory.map((c, index) => (
                        <motion.div
                            key={c.category.id}
                            className={cn(
                                "space-y-2 p-3 rounded-xl transition-colors cursor-pointer",
                                selectedCategoryId === c.category.id
                                    ? "bg-primary/10 ring-1 ring-primary/30"
                                    : "hover:bg-muted/50",
                            )}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() =>
                                setSelectedCategoryId((prev) =>
                                    prev === c.category.id ? null : c.category.id,
                                )
                            }>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-2xl">{c.category.icon}</span>
                                    <span className="font-semibold truncate">
                                        {c.category.name}
                                    </span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-bold text-lg tabular-nums">
                                        {format.currency(c.amount)}
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-muted">
                                        {c.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${colorAt(index)}, ${colorAt(index + 1)})`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${c.percentage}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                />
                            </div>

                            {selectedCategoryId === c.category.id && (
                                <div className="mt-3 rounded-xl bg-background/60 border border-border p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold">
                                            Transactions ({c.count})
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Tap again to close
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {selectedRows.map((row) => (
                                            <div
                                                key={row.id}
                                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {row.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        <span dir="ltr">
                                                            {format.date(row.date)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <p className="text-sm font-bold tabular-nums">
                                                    {format.currency(row.amount)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {byCategory.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            {copy.empty}
                        </p>
                    )}
                </div>
            </ReportCard>
        </div>
    );
};

interface ShareListProps {
    items: {
        id: string;
        label: string;
        amount: number;
        count: number;
        percentage: number;
        muted?: boolean;
    }[];
    format: ReportFormat;
}

const ShareList = ({ items, format }: ShareListProps) => (
    <div className="space-y-3">
        {items.map((item, index) => (
            <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                    <span
                        className={cn(
                            "truncate font-medium",
                            item.muted && "text-muted-foreground",
                        )}>
                        {item.label}
                        <span className="text-xs text-muted-foreground ml-1.5">
                            ×{item.count}
                        </span>
                    </span>
                    <span className="tabular-nums font-semibold shrink-0">
                        {format.currency(item.amount)}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.muted
                                ? "var(--muted-foreground)"
                                : colorAt(index),
                        }}
                    />
                </div>
            </div>
        ))}
    </div>
);
