/**
 * Settings Types for LifeOS
 *
 * Contains application settings and user preferences.
 */

export type Theme = "light" | "dark" | "system";

export interface SettingsData {
    theme: Theme;
    userName: string;
    email: string;
}
