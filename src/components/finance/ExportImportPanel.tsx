import { useState } from "react";
import {
    Download,
    Upload,
    FileJson,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    Trash2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/Card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import type { FinanceData } from "@/types/modules/finance";

interface ExportImportPanelProps {
    onImport: (data: FinanceData) => void;
    onExport: () => FinanceData;
    onReset: () => void;
}

export const ExportImportPanel = ({
    onImport,
    onExport,
    onReset,
}: ExportImportPanelProps) => {
    const [importStatus, setImportStatus] = useState<
        "idle" | "success" | "error"
    >("idle");
    const [importMessage, setImportMessage] = useState("");
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Export as JSON
    const handleExportJSON = () => {
        try {
            const data = onExport();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lifeos-finance-backup-${
                new Date().toISOString().split("T")[0]
            }.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            console.error("Export failed");
        }
    };

    // Export as CSV
    const handleExportCSV = () => {
        try {
            const data = onExport();

            // Create CSV for transactions (expenses + incomes)
            const transactions: Array<{
                type: string;
                title: string;
                amount: number;
                category: string;
                date: string;
                notes: string;
            }> = [];

            // Add expenses
            data.expenses.forEach((expense) => {
                const category = data.categories.find(
                    (c) => c.id === expense.categoryId
                );
                transactions.push({
                    type: "Expense",
                    title: expense.title,
                    amount: -expense.amount,
                    category: category?.name || "Unknown",
                    date: expense.date,
                    notes: expense.notes || "",
                });
            });

            // Add incomes
            data.incomes.forEach((income) => {
                transactions.push({
                    type: "Income",
                    title: income.title,
                    amount: income.amount,
                    category: income.category || "Income",
                    date:
                        income.actualDate ||
                        income.expectedDate ||
                        income.createdAt,
                    notes: income.notes || "",
                });
            });

            // Sort by date
            transactions.sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Create CSV content
            const headers = [
                "Type",
                "Title",
                "Amount",
                "Category",
                "Date",
                "Notes",
            ];
            const csvContent = [
                headers.join(","),
                ...transactions.map((t) =>
                    [
                        t.type,
                        `"${t.title.replace(/"/g, '""')}"`,
                        t.amount,
                        `"${t.category.replace(/"/g, '""')}"`,
                        t.date,
                        `"${t.notes.replace(/"/g, '""')}"`,
                    ].join(",")
                ),
            ].join("\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lifeos-finance-transactions-${
                new Date().toISOString().split("T")[0]
            }.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            console.error("CSV export failed");
        }
    };

    // Handle file import
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as FinanceData;

                // Validate the data structure
                if (!data.incomes || !data.expenses || !data.categories) {
                    throw new Error("Invalid file structure");
                }

                onImport(data);
                setImportStatus("success");
                setImportMessage("Data imported successfully!");
                setTimeout(() => setImportStatus("idle"), 3000);
            } catch {
                setImportStatus("error");
                setImportMessage(
                    "Invalid file format. Please use a valid LifeOS Finance backup file."
                );
                setTimeout(() => setImportStatus("idle"), 5000);
            }
        };

        reader.readAsText(file);
        event.target.value = ""; // Reset input
    };

    // Handle reset
    const handleReset = () => {
        onReset();
        setShowResetConfirm(false);
    };

    return (
        <>
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Data Management
                    </CardTitle>
                    <CardDescription>
                        Export, import, or reset your financial data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Export Section */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-foreground">
                            Export Data
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Download your financial data for backup or use in
                            other applications.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportJSON}
                                className="flex items-center gap-2">
                                <FileJson className="h-4 w-4" />
                                Export JSON
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportCSV}
                                className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-3 pt-4 border-t">
                        <h3 className="font-medium text-sm text-foreground">
                            Import Data
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Restore from a previous backup (JSON format only).
                            This will replace your current data.
                        </p>
                        <div className="flex flex-col gap-2">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 w-full sm:w-auto"
                                    asChild>
                                    <span>
                                        <Upload className="h-4 w-4" />
                                        Import from JSON
                                    </span>
                                </Button>
                            </label>

                            {importStatus === "success" && (
                                <div className="flex items-center gap-2 text-green-600 text-sm animate-fade-in">
                                    <CheckCircle className="h-4 w-4" />
                                    {importMessage}
                                </div>
                            )}

                            {importStatus === "error" && (
                                <div className="flex items-center gap-2 text-red-600 text-sm animate-fade-in">
                                    <AlertCircle className="h-4 w-4" />
                                    {importMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reset Section */}
                    <div className="space-y-3 pt-4 border-t">
                        <h3 className="font-medium text-sm text-foreground text-destructive">
                            Danger Zone
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Reset all financial data. This action cannot be
                            undone.
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Reset All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reset Confirmation Dialog */}
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Reset
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to reset all financial data?
                            This will permanently delete:
                        </p>
                        <ul className="mt-3 text-sm space-y-1 text-muted-foreground list-disc list-inside">
                            <li>All income records</li>
                            <li>All expense records</li>
                            <li>All installments</li>
                            <li>All budgets</li>
                            <li>All financial goals</li>
                            <li>Custom categories</li>
                        </ul>
                        <p className="mt-4 text-sm font-medium text-destructive">
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowResetConfirm(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReset}>
                            Yes, Reset Everything
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Quick export button for use in header/navbar
export const QuickExportButton = ({
    onExport,
}: {
    onExport: () => FinanceData;
}) => {
    const handleQuickExport = () => {
        try {
            const data = onExport();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lifeos-finance-backup-${
                new Date().toISOString().split("T")[0]
            }.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            console.error("Export failed");
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleQuickExport}
            title="Quick Export">
            <Download className="h-4 w-4" />
        </Button>
    );
};
