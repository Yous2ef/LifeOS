import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp } from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { MonthlyFlow } from "@/utils/finance/aggregations";
import type { Forecast } from "@/utils/finance/reports";
import { AXIS_PROPS, TOOLTIP_STYLE, type ReportFormat } from "./chartTheme";
import { ReportCard } from "./ReportCard";

interface ForecastCardProps {
    forecast: Forecast;
    /** The months shown as actuals before the projection */
    recent: MonthlyFlow[];
    format: ReportFormat;
}

/** Next three months at the average of recent complete months */
export const ForecastCard = ({ forecast, recent, format }: ForecastCardProps) => {
    const data = [
        ...recent.map((m) => ({ month: m.month, income: m.income, expense: m.expense })),
        ...forecast.months.map((m) => ({
            month: m.month,
            income: m.income,
            expense: m.expense,
            forecast: m.net,
        })),
    ];
    const formatTooltip = (value: number) => format.currency(value);
    const basis = forecast.partial
        ? "Based on this month so far"
        : forecast.basedOn === 1
          ? "Average of your last month"
          : `Average of your last ${forecast.basedOn} months`;

    return (
        <ReportCard
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="from-teal-500 to-emerald-500"
            title="Cash Flow Forecast"
            subtitle={basis}>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <ForecastTile
                    label="3-Month Forecast"
                    value={forecast.avgMonthly * 3}
                    format={format}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
                />
                <ForecastTile
                    label="Monthly Average"
                    value={forecast.avgMonthly}
                    format={format}
                    icon={<TrendingUp className="w-4 h-4" />}
                    className="bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/25"
                />
            </div>

            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="forecastIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="forecastExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="month" {...AXIS_PROPS} />
                        <YAxis {...AXIS_PROPS} tickFormatter={format.axis} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={formatTooltip} />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#forecastIncomeGradient)"
                            name="Income"
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#forecastExpenseGradient)"
                            name="Expenses"
                        />
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={{ fill: "#8b5cf6", r: 4 }}
                            name="Forecast"
                        />
                        <Legend />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ReportCard>
    );
};

const ForecastTile = ({
    label,
    value,
    format,
    icon,
    className,
}: {
    label: string;
    value: number;
    format: ReportFormat;
    icon: ReactNode;
    className: string;
}) => (
    <motion.div
        className={cn("relative overflow-hidden rounded-2xl p-4 shadow-lg", className)}
        whileHover={{ scale: 1.02 }}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 text-white/80">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold text-white", value < 0 && "text-red-200")}>
                {value >= 0 ? "+" : ""}
                {format.currency(value)}
            </p>
        </div>
    </motion.div>
);
