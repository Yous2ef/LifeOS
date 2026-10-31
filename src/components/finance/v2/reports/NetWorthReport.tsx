import type { ReactNode } from "react";
import { Landmark } from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { NetWorthPoint } from "@/utils/finance/reports";
import { AXIS_PROPS, TOOLTIP_STYLE, signed, type ReportFormat } from "./chartTheme";
import { ReportCard, StatTile } from "./ReportCard";

interface NetWorthReportProps {
    points: NetWorthPoint[];
    format: ReportFormat;
    scopeControl?: ReactNode;
}

/** Month-end net worth (balances + owed to you − you owe), from history */
export const NetWorthReport = ({ points, format, scopeControl }: NetWorthReportProps) => {
    const last = points[points.length - 1];
    const first = points[0];
    const growth = last && first ? last.netWorth - first.netWorth : 0;
    const formatTooltip = (value: number) => format.currency(value);

    return (
        <ReportCard
            icon={<Landmark className="w-5 h-5" />}
            gradient="from-indigo-500 to-violet-500"
            title="Net worth trend"
            subtitle="Balances + owed to you − you owe, at each month end"
            action={scopeControl}>
            {last && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <StatTile label="Net worth" value={format.currency(last.netWorth)} />
                    <StatTile
                        label="Change"
                        value={signed(growth, format.currency)}
                        hint={`Since ${first.month}`}
                        accent={growth >= 0 ? "text-emerald-500" : "text-rose-500"}
                    />
                    <StatTile label="Owed to you" value={format.currency(last.receivable)} />
                    <StatTile label="You owe" value={format.currency(last.payable)} />
                </div>
            )}
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points}>
                        <defs>
                            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                        <XAxis dataKey="month" {...AXIS_PROPS} />
                        <YAxis {...AXIS_PROPS} tickFormatter={format.axis} />
                        <Tooltip formatter={formatTooltip} contentStyle={TOOLTIP_STYLE} />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            name="Net worth"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#netWorthGradient)"
                            dot={{ r: 3, fill: "#6366f1" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            name="Balances"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            fill="none"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ReportCard>
    );
};
