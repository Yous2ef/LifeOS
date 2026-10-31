import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectReportRow } from "@/utils/finance/reports";
import { signed, type ReportFormat } from "./chartTheme";
import { ReportCard } from "./ReportCard";

interface ProjectReportProps {
    rows: ProjectReportRow[];
    /** Shows the charity share column (charity tracking on) */
    showCharity: boolean;
    format: ReportFormat;
}

/** Per project: paid, costs, net and its charity share */
export const ProjectReport = ({ rows, showCharity, format }: ProjectReportProps) => {
    const totals = rows.reduce(
        (sum, row) => ({
            paid: sum.paid + row.paid,
            costs: sum.costs + row.costs,
            net: sum.net + row.net,
            charityShare: sum.charityShare + row.charityShare,
        }),
        { paid: 0, costs: 0, net: 0, charityShare: 0 },
    );

    return (
        <ReportCard
            icon={<Briefcase className="w-5 h-5" />}
            gradient="from-indigo-500 to-blue-500"
            title="Projects"
            subtitle="All time · received income minus the project's expenses">
            {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No projects yet. Add one from an income or expense.
                </p>
            ) : (
                <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm min-w-[480px]">
                        <thead>
                            <tr className="text-xs text-muted-foreground text-right">
                                <th className="text-left font-medium px-2 py-2">Project</th>
                                <th className="font-medium px-2 py-2">Paid</th>
                                <th className="font-medium px-2 py-2">Costs</th>
                                <th className="font-medium px-2 py-2">Net</th>
                                {showCharity && (
                                    <th className="font-medium px-2 py-2">Charity share</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {rows.map((row) => (
                                <tr key={row.project.id} className="text-right tabular-nums">
                                    <td className="text-left px-2 py-2">
                                        <p className="font-medium">
                                            {row.project.name}
                                            {row.project.status === "done" && (
                                                <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                    Done
                                                </span>
                                            )}
                                        </p>
                                        {row.project.client && (
                                            <p className="text-xs text-muted-foreground">
                                                {row.project.client}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-emerald-500">
                                        {format.currency(row.paid)}
                                    </td>
                                    <td className="px-2 py-2 text-rose-500">
                                        {format.currency(row.costs)}
                                    </td>
                                    <td
                                        className={cn(
                                            "px-2 py-2 font-semibold",
                                            row.net < 0 && "text-rose-500",
                                        )}>
                                        {signed(row.net, format.currency)}
                                    </td>
                                    {showCharity && (
                                        <td className="px-2 py-2 text-teal-500">
                                            {format.currency(row.charityShare)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="text-right tabular-nums font-bold border-t border-border">
                                <td className="text-left px-2 py-2">Total</td>
                                <td className="px-2 py-2">{format.currency(totals.paid)}</td>
                                <td className="px-2 py-2">{format.currency(totals.costs)}</td>
                                <td className="px-2 py-2">{signed(totals.net, format.currency)}</td>
                                {showCharity && (
                                    <td className="px-2 py-2">
                                        {format.currency(totals.charityShare)}
                                    </td>
                                )}
                            </tr>
                        </tfoot>
                    </table>
                    {showCharity && (
                        <p className="text-xs text-muted-foreground mt-3 px-2">
                            Charity share counts only eligible income and work costs since the start date. It's a per-project view; what you owe is one running total.
                        </p>
                    )}
                </div>
            )}
        </ReportCard>
    );
};
