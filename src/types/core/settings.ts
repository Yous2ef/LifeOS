/**
 * Settings Types for LifeOS
 *
 * Contains application settings and user preferences.
 */

export type Theme = "light" | "dark" | "system";

// Auto-backup frequency options
export type BackupFrequency =
    | "disabled"
    | "daily"
    | "every2days"
    | "weekly"
    | "monthly";

export interface BackupSettings {
    autoBackupEnabled: boolean;
    frequency: BackupFrequency;
    lastBackupTime: number | null; // Unix timestamp in milliseconds
    maxBackups: number; // Maximum number of backups to keep
}

export interface SettingsData {
    theme: Theme;
    userName: string;
    email: string;
    backup?: BackupSettings;
}
