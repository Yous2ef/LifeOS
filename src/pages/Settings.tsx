import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useStorageContext } from "../context/StorageContext";
import { StorageService, STORAGE_KEYS } from "../services/StorageService";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Switch } from "../components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/Select";
import {
    Settings as SettingsIcon,
    Bell,
    Trash2,
    RotateCcw,
    Database,
    HardDrive,
    Download,
    Upload,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Cloud,
    CloudOff,
    Clock,
    RefreshCw,
    Save,
    Calendar,
} from "lucide-react";
import {
    detectStorageVersion,
    exportData,
    importData,
    V2_STORAGE_KEY,
} from "../utils/storage";
import { hasV1Backup, restoreV1FromBackup } from "../utils/legacyStorage";
import type { BackupFrequency, BackupSettings } from "../types/core/settings";
import type { BackupInfo } from "../services/DriveService";

export const Settings: React.FC = () => {
    const {
        data,
        updateData,
        dismissedNotifications,
        neverShowAgain,
        resetDismissedNotifications,
        refreshData,
    } = useApp();
    const { isAuthenticated } = useAuth();
    const { lastSyncTime, isCloudMode } = useStorageContext();

    const [showConfirm, setShowConfirm] = useState(false);
    const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [rollbackError, setRollbackError] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Cloud sync state
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [clearError, setClearError] = useState<string | null>(null);

    // Cloud backup list state
    const [cloudBackups, setCloudBackups] = useState<BackupInfo[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [createBackupSuccess, setCreateBackupSuccess] = useState(false);
    const [restoringBackupId, setRestoringBackupId] = useState<string | null>(
        null
    );
    const [deletingBackupId, setDeletingBackupId] = useState<string | null>(
        null
    );
    const [backupError, setBackupError] = useState<string | null>(null);

    // Storage info state
    const [storageVersion, setStorageVersion] = useState<string | null>(null);
    const [storageSize, setStorageSize] = useState<number>(0);
    const [hasBackup, setHasBackup] = useState(false);

    // Load storage info on mount
    useEffect(() => {
        const version = detectStorageVersion();
        setStorageVersion(version);
        setHasBackup(hasV1Backup());

        // Calculate storage size
        const v2Data = localStorage.getItem(V2_STORAGE_KEY);
        if (v2Data) {
            setStorageSize(new Blob([v2Data]).size);
        }
    }, []);

    const handleRollback = async () => {
        setIsRollingBack(true);
        setRollbackError(null);

        try {
            const success = restoreV1FromBackup();
            if (success) {
                // Remove V2 storage
                localStorage.removeItem(V2_STORAGE_KEY);
                // Reload the page to apply changes
                window.location.reload();
            } else {
                setRollbackError("No backup found to restore.");
            }
        } catch (error) {
            setRollbackError(
                error instanceof Error ? error.message : "Rollback failed"
            );
        } finally {
            setIsRollingBack(false);
        }
    };

    const handleExport = () => {
        exportData();
    };

    // Clear all data - both local and cloud
    const handleClearAllData = async () => {
        setIsClearing(true);
        setClearError(null);

        try {
            // Delete from storage (handles both local and cloud)
            await StorageService.delete(STORAGE_KEYS.MAIN_DATA);

            // Clear any legacy storage too
            localStorage.removeItem(V2_STORAGE_KEY);

            // Reload the page to reset the app
            window.location.reload();
        } catch (error) {
            setClearError(
                error instanceof Error ? error.message : "Failed to clear data"
            );
            setIsClearing(false);
        }
    };

    // Load cloud backups list
    const loadCloudBackups = async () => {
        if (!isCloudMode) return;

        setIsLoadingBackups(true);
        try {
            const backups = await StorageService.listCloudBackups();
            setCloudBackups(backups);
        } catch (error) {
            console.error("Failed to load backups:", error);
        } finally {
            setIsLoadingBackups(false);
        }
    };

    // Create a new cloud backup
    const handleCreateCloudBackup = async () => {
        setIsCreatingBackup(true);
        setBackupError(null);
        setCreateBackupSuccess(false);

        try {
            const result = await StorageService.createCloudBackup();
            if (result.success) {
                setCreateBackupSuccess(true);
                setTimeout(() => setCreateBackupSuccess(false), 3000);

                // Cleanup old backups if needed
                const maxBackups = data.settings?.backup?.maxBackups ?? 5;
                await StorageService.cleanupOldBackups(maxBackups);

                // Update last backup time in settings
                updateData({
                    settings: {
                        ...data.settings,
                        backup: {
                            ...(data.settings?.backup ?? {
                                autoBackupEnabled: false,
                                frequency: "weekly" as BackupFrequency,
                                maxBackups: 5,
                            }),
                            lastBackupTime: Date.now(),
                        },
                    },
                });

                // Refresh the backup list
                await loadCloudBackups();
            } else {
                setBackupError(result.error || "Backup failed");
            }
        } catch (error) {
            setBackupError(
                error instanceof Error ? error.message : "Backup failed"
            );
        } finally {
            setIsCreatingBackup(false);
        }
    };

    // Restore from a cloud backup
    const handleRestoreBackup = async (backup: BackupInfo) => {
        if (
            !confirm(
                `Are you sure you want to restore from "${backup.name}"? Your current data will be overwritten.`
            )
        ) {
            return;
        }

        setRestoringBackupId(backup.id);
        setBackupError(null);

        try {
            const result = await StorageService.restoreCloudBackup(
                backup.fileName
            );
            if (result.success) {
                // Reload the page to apply restored data
                window.location.reload();
            } else {
                setBackupError(result.error || "Restore failed");
            }
        } catch (error) {
            setBackupError(
                error instanceof Error ? error.message : "Restore failed"
            );
        } finally {
            setRestoringBackupId(null);
        }
    };

    // Delete a cloud backup
    const handleDeleteBackup = async (backup: BackupInfo) => {
        if (!confirm(`Are you sure you want to delete "${backup.name}"?`)) {
            return;
        }

        setDeletingBackupId(backup.id);
        setBackupError(null);

        try {
            const result = await StorageService.deleteCloudBackup(
                backup.fileName
            );
            if (result.success) {
                // Refresh the backup list
                await loadCloudBackups();
            } else {
                setBackupError(result.error || "Delete failed");
            }
        } catch (error) {
            setBackupError(
                error instanceof Error ? error.message : "Delete failed"
            );
        } finally {
            setDeletingBackupId(null);
        }
    };

    // Download a cloud backup as a JSON file
    const handleDownloadBackup = async (backup: BackupInfo) => {
        try {
            // Use DriveService directly to get the backup data without restoring
            const { DriveService } = await import("../services/DriveService");
            const backupData = await DriveService.restoreBackup(
                backup.fileName
            );

            if (backupData) {
                const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const date = new Date(backup.createdTime);
                a.download = `lifeos-backup-${
                    date.toISOString().split("T")[0]
                }.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                setBackupError("Failed to download backup");
            }
        } catch (error) {
            setBackupError(
                error instanceof Error ? error.message : "Download failed"
            );
        }
    };

    // Update backup settings
    const handleBackupSettingsChange = (settings: Partial<BackupSettings>) => {
        updateData({
            settings: {
                ...data.settings,
                backup: {
                    ...(data.settings?.backup ?? {
                        autoBackupEnabled: false,
                        frequency: "weekly" as BackupFrequency,
                        lastBackupTime: null,
                        maxBackups: 5,
                    }),
                    ...settings,
                },
            },
        });
    };

    // Load backups when cloud mode becomes available
    useEffect(() => {
        if (isCloudMode && isAuthenticated) {
            loadCloudBackups();
        }
    }, [isCloudMode, isAuthenticated]);

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);

        try {
            await importData(file);
            refreshData();
            // Reset the input
            event.target.value = "";
        } catch (error) {
            setImportError(
                error instanceof Error ? error.message : "Import failed"
            );
        } finally {
            setIsImporting(false);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Format date in a consistent way that works with RTL and LTR
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date): string => {
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDateTime = (date: Date): string => {
        return `${formatDate(date)} ${formatTime(date)}`;
    };

    const handleResetNotifications = () => {
        resetDismissedNotifications();
        setShowConfirm(false);
    };

    const activelyDismissedCount = dismissedNotifications.filter((n) => {
        if (!n.dismissUntil) return true; // Session-based dismissal
        return new Date(n.dismissUntil) > new Date(); // Still within time period
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <SettingsIcon className="text-primary" size={32} />
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            </div>

            {/* Notification Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">
                        Notification Settings
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-3xl font-bold text-primary">
                                {activelyDismissedCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Currently Dismissed
                            </div>
                        </div>
                        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                            <div className="text-3xl font-bold text-destructive">
                                {neverShowAgain.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Never Show Again
                            </div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {dismissedNotifications.length +
                                    neverShowAgain.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Total Dismissed
                            </div>
                        </div>
                    </div>

                    {/* Information */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <h3 className="font-semibold text-lg mb-3 text-foreground">
                            How Notification Dismissal Works
                        </h3>
                        <ul className="space-y-2 text-sm text-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>
                                    <strong>Session Only:</strong> Notification
                                    is hidden until you close and reopen the app
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 dark:text-green-400 mt-1">
                                    •
                                </span>
                                <span>
                                    <strong>For 1 Day:</strong> Notification
                                    will reappear after 24 hours
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                                    •
                                </span>
                                <span>
                                    <strong>For 1 Week:</strong> Notification
                                    will reappear after 7 days
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">•</span>
                                <span>
                                    <strong>Never Show Again:</strong>{" "}
                                    Notification is permanently hidden
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Dismissed Notifications List */}
                    {dismissedNotifications.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-3 text-foreground">
                                Dismissed Notifications
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {dismissedNotifications.map((notification) => {
                                    const isPastDue =
                                        notification.dismissUntil &&
                                        new Date(notification.dismissUntil) <
                                            new Date();
                                    const dismissType =
                                        !notification.dismissUntil
                                            ? "Until next session"
                                            : isPastDue
                                            ? "Expired (will show again)"
                                            : `Until ${formatDate(
                                                  new Date(
                                                      notification.dismissUntil
                                                  )
                                              )}`;

                                    return (
                                        <div
                                            key={notification.id}
                                            className="bg-muted/50 rounded p-3 border border-border flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-mono text-xs text-muted-foreground">
                                                    {notification.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {dismissType}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Never Show Again List */}
                    {neverShowAgain.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-3 text-foreground">
                                Never Show Again
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {neverShowAgain.map((id) => (
                                    <div
                                        key={id}
                                        className="bg-destructive/10 rounded p-3 border border-destructive/20 flex justify-between items-center">
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {id}
                                        </div>
                                        <span className="text-xs text-destructive">
                                            Permanently Hidden
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reset Button */}
                    <div className="pt-4 border-t border-border">
                        {!showConfirm ? (
                            <Button
                                variant="destructive"
                                onClick={() => setShowConfirm(true)}
                                disabled={
                                    dismissedNotifications.length === 0 &&
                                    neverShowAgain.length === 0
                                }>
                                <RotateCcw size={16} />
                                Reset All Dismissed Notifications
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                        <Trash2
                                            className="text-destructive mt-1"
                                            size={20}
                                        />
                                        <div>
                                            <p className="font-semibold text-destructive">
                                                Are you sure?
                                            </p>
                                            <p className="text-sm text-foreground mt-1">
                                                This will show all dismissed
                                                notifications again, including
                                                those marked as "Never Show
                                                Again".
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleResetNotifications}>
                                            Yes, Reset All
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setShowConfirm(false)
                                            }>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Other Settings Sections (Placeholder for future) */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Database className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">
                        Storage & Data
                    </h2>
                </div>

                <div className="space-y-6">
                    {/* Storage Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Storage Format
                            </div>
                            <div className="text-xl font-bold text-primary flex items-center gap-2">
                                {storageVersion === "2.0.0" ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        V2 (Unified)
                                    </>
                                ) : storageVersion === "1.0.0" ? (
                                    <>
                                        <AlertTriangle size={18} />
                                        V1 (Legacy)
                                    </>
                                ) : (
                                    "Fresh Install"
                                )}
                            </div>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Storage Size
                            </div>
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <HardDrive size={18} />
                                {formatBytes(storageSize)}
                            </div>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <div className="text-sm text-muted-foreground mb-1">
                                Backup Available
                            </div>
                            <div
                                className={`text-xl font-bold flex items-center gap-2 ${
                                    cloudBackups.length > 0 || hasBackup
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }`}>
                                {cloudBackups.length > 0
                                    ? `Yes (${cloudBackups.length} cloud)`
                                    : hasBackup
                                    ? "Yes (V1)"
                                    : "No"}
                            </div>
                        </div>
                    </div>

                    {/* Export/Import */}
                    <div className="border border-border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 text-foreground">
                            Export & Import Data
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Export your data as a JSON file for backup or
                            transfer to another device.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" onClick={handleExport}>
                                <Download size={16} />
                                Export Data
                            </Button>
                            <label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                    disabled={isImporting}
                                />
                                <Button
                                    variant="outline"
                                    asChild
                                    disabled={isImporting}>
                                    <span>
                                        {isImporting ? (
                                            <>
                                                <Loader2
                                                    className="animate-spin"
                                                    size={16}
                                                />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Import Data
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </label>
                        </div>
                        {importError && (
                            <p className="text-sm text-destructive mt-2">
                                {importError}
                            </p>
                        )}
                    </div>

                    {/* Rollback Section */}
                    {hasBackup && (
                        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                                <AlertTriangle
                                    className="text-amber-500"
                                    size={20}
                                />
                                Rollback to V1
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                If you're experiencing issues with the new
                                storage system, you can rollback to the previous
                                V1 format. Your V1 backup from the migration
                                will be restored.
                            </p>

                            {!showRollbackConfirm ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRollbackConfirm(true)}
                                    className="border-amber-500/50 hover:bg-amber-500/10">
                                    <RotateCcw size={16} />
                                    Rollback to V1
                                </Button>
                            ) : (
                                <div className="space-y-3 bg-amber-500/10 border border-amber-500/30 rounded p-4">
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                        Are you sure you want to rollback? This
                                        will:
                                    </p>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        <li>
                                            Restore your V1 data from backup
                                        </li>
                                        <li>Remove the V2 unified storage</li>
                                        <li>Reload the application</li>
                                    </ul>
                                    {rollbackError && (
                                        <p className="text-sm text-destructive">
                                            {rollbackError}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            onClick={handleRollback}
                                            disabled={isRollingBack}>
                                            {isRollingBack ? (
                                                <>
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={16}
                                                    />
                                                    Rolling back...
                                                </>
                                            ) : (
                                                "Yes, Rollback"
                                            )}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setShowRollbackConfirm(false)
                                            }
                                            disabled={isRollingBack}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Cloud Sync Settings - Only show for logged in users */}
            {isAuthenticated && (
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        {isCloudMode ? (
                            <Cloud className="text-primary" size={24} />
                        ) : (
                            <CloudOff
                                className="text-muted-foreground"
                                size={24}
                            />
                        )}
                        <h2 className="text-2xl font-bold text-foreground">
                            Cloud Sync
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {/* Sync Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                                <div className="text-sm text-muted-foreground mb-1">
                                    Sync Status
                                </div>
                                <div className="text-xl font-bold text-primary flex items-center gap-2">
                                    {isCloudMode ? (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Connected
                                        </>
                                    ) : (
                                        <>
                                            <CloudOff size={18} />
                                            Offline
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                                <div className="text-sm text-muted-foreground mb-1">
                                    Last Synced
                                </div>
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {lastSyncTime
                                        ? formatDateTime(lastSyncTime)
                                        : "Never"}
                                </div>
                            </div>
                        </div>

                        {/* Cloud Backup Management */}
                        <div className="border border-border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                                <Save size={18} className="text-primary" />
                                Cloud Backups
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create and manage backups stored directly in
                                your Google Drive. These backups can be restored
                                at any time.
                            </p>

                            {/* Create Backup Button */}
                            <div className="mb-4">
                                <Button
                                    onClick={handleCreateCloudBackup}
                                    disabled={isCreatingBackup || !isCloudMode}>
                                    {isCreatingBackup ? (
                                        <>
                                            <Loader2
                                                className="animate-spin"
                                                size={16}
                                            />
                                            Creating Backup...
                                        </>
                                    ) : createBackupSuccess ? (
                                        <>
                                            <CheckCircle2
                                                size={16}
                                                className="text-green-500"
                                            />
                                            Backup Created!
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Create Cloud Backup
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Backup Error */}
                            {backupError && (
                                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                    {backupError}
                                </div>
                            )}

                            {/* Backup List */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm text-muted-foreground">
                                        Your Backups
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={loadCloudBackups}
                                        disabled={isLoadingBackups}>
                                        <RefreshCw
                                            size={14}
                                            className={
                                                isLoadingBackups
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                    </Button>
                                </div>

                                {isLoadingBackups ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2
                                            className="animate-spin text-muted-foreground"
                                            size={24}
                                        />
                                    </div>
                                ) : cloudBackups.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No cloud backups found. Create one to
                                        get started.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {cloudBackups.map((backup) => {
                                            const backupDate = new Date(
                                                backup.createdTime
                                            );
                                            return (
                                                <div
                                                    key={backup.id}
                                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm">
                                                            Backup from{" "}
                                                            {formatDate(
                                                                backupDate
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatTime(
                                                                backupDate
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleRestoreBackup(
                                                                    backup
                                                                )
                                                            }
                                                            disabled={
                                                                restoringBackupId ===
                                                                backup.id
                                                            }
                                                            title="Restore this backup">
                                                            {restoringBackupId ===
                                                            backup.id ? (
                                                                <Loader2
                                                                    className="animate-spin"
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <RotateCcw
                                                                    size={14}
                                                                />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDownloadBackup(
                                                                    backup
                                                                )
                                                            }
                                                            title="Download this backup">
                                                            <Download
                                                                size={14}
                                                            />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDeleteBackup(
                                                                    backup
                                                                )
                                                            }
                                                            disabled={
                                                                deletingBackupId ===
                                                                backup.id
                                                            }
                                                            className="text-destructive hover:text-destructive"
                                                            title="Delete this backup">
                                                            {deletingBackupId ===
                                                            backup.id ? (
                                                                <Loader2
                                                                    className="animate-spin"
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    size={14}
                                                                />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Auto-Backup Settings */}
                        <div className="border border-border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Automatic Backups
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Schedule automatic backups to keep your data
                                safe. Backups are stored in your Google Drive.
                            </p>

                            <div className="space-y-4">
                                {/* Enable Toggle */}
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="auto-backup"
                                        className="cursor-pointer">
                                        Enable Automatic Backups
                                    </Label>
                                    <Switch
                                        id="auto-backup"
                                        checked={
                                            data.settings?.backup
                                                ?.autoBackupEnabled ?? false
                                        }
                                        onCheckedChange={(checked) =>
                                            handleBackupSettingsChange({
                                                autoBackupEnabled: checked,
                                            })
                                        }
                                    />
                                </div>

                                {/* Frequency Select */}
                                {data.settings?.backup?.autoBackupEnabled && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="backup-frequency">
                                                Backup Frequency
                                            </Label>
                                            <Select
                                                value={
                                                    data.settings?.backup
                                                        ?.frequency ?? "weekly"
                                                }
                                                onValueChange={(value) =>
                                                    handleBackupSettingsChange({
                                                        frequency:
                                                            value as BackupFrequency,
                                                    })
                                                }>
                                                <SelectTrigger id="backup-frequency">
                                                    <SelectValue placeholder="Select frequency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">
                                                        Daily
                                                    </SelectItem>
                                                    <SelectItem value="every2days">
                                                        Every 2 Days
                                                    </SelectItem>
                                                    <SelectItem value="weekly">
                                                        Weekly
                                                    </SelectItem>
                                                    <SelectItem value="monthly">
                                                        Monthly
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Max Backups */}
                                        <div className="space-y-2">
                                            <Label htmlFor="max-backups">
                                                Maximum Backups to Keep
                                            </Label>
                                            <Select
                                                value={String(
                                                    data.settings?.backup
                                                        ?.maxBackups ?? 5
                                                )}
                                                onValueChange={(value) =>
                                                    handleBackupSettingsChange({
                                                        maxBackups: parseInt(
                                                            value,
                                                            10
                                                        ),
                                                    })
                                                }>
                                                <SelectTrigger id="max-backups">
                                                    <SelectValue placeholder="Select max backups" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="3">
                                                        3 backups
                                                    </SelectItem>
                                                    <SelectItem value="5">
                                                        5 backups
                                                    </SelectItem>
                                                    <SelectItem value="10">
                                                        10 backups
                                                    </SelectItem>
                                                    <SelectItem value="20">
                                                        20 backups
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Older backups will be
                                                automatically deleted when this
                                                limit is reached.
                                            </p>
                                        </div>

                                        {/* Last Backup Time */}
                                        {data.settings?.backup
                                            ?.lastBackupTime && (
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Clock size={14} />
                                                Last auto-backup:{" "}
                                                {formatDateTime(
                                                    new Date(
                                                        data.settings.backup.lastBackupTime
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Clear All Data - Available for all users */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Trash2 className="text-destructive" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">
                        Danger Zone
                    </h2>
                </div>

                <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2 text-foreground flex items-center gap-2">
                        <Trash2 className="text-destructive" size={20} />
                        Clear All Data
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {isAuthenticated
                            ? "Permanently delete all your data from both local storage and Google Drive. This action cannot be undone. Make sure to download a backup first!"
                            : "Permanently delete all your local data. This action cannot be undone. Make sure to export your data first!"}
                    </p>

                    {!showClearConfirm ? (
                        <Button
                            variant="outline"
                            onClick={() => setShowClearConfirm(true)}
                            className="border-destructive/50 hover:bg-destructive/10 text-destructive">
                            <Trash2 size={16} />
                            Clear All Data
                        </Button>
                    ) : (
                        <div className="space-y-3 bg-destructive/10 border border-destructive/30 rounded p-4">
                            <p className="text-sm font-medium text-destructive">
                                Are you absolutely sure? This will permanently
                                delete:
                            </p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>All local storage data</li>
                                {isAuthenticated && (
                                    <li>All cloud data in Google Drive</li>
                                )}
                                <li>
                                    All your tasks, projects, finances, etc.
                                </li>
                            </ul>
                            {clearError && (
                                <p className="text-sm text-destructive">
                                    {clearError}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={handleClearAllData}
                                    disabled={isClearing}>
                                    {isClearing ? (
                                        <>
                                            <Loader2
                                                className="animate-spin"
                                                size={16}
                                            />
                                            Clearing...
                                        </>
                                    ) : (
                                        "Yes, Delete Everything"
                                    )}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowClearConfirm(false)}
                                    disabled={isClearing}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
