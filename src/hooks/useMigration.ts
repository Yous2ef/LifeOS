/**
 * useMigration Hook
 *
 * Handles the V1 → V2 storage migration with user interaction.
 * Provides state and callbacks for the MigrationModal component.
 */

import { useState, useCallback, useEffect } from "react";
import type { MigrationStatus } from "../components/common";
import { detectStorageVersion, saveData } from "../utils/storage";
import {
    backupV1Storage,
    consolidateV1Data,
    hasV1Backup,
} from "../utils/legacyStorage";

const MIGRATION_SKIPPED_KEY = "lifeos_migration_skipped";
const MIGRATION_SKIP_EXPIRES = 24 * 60 * 60 * 1000; // 24 hours

interface UseMigrationReturn {
    /** Whether the migration modal should be shown */
    showMigrationModal: boolean;
    /** Current migration status */
    migrationStatus: MigrationStatus;
    /** Error message if migration failed */
    migrationError: string | undefined;
    /** Whether V1 backup exists for rollback */
    hasBackup: boolean;
    /** Perform the migration */
    performMigration: () => Promise<void>;
    /** Skip migration (will ask again later) */
    skipMigration: () => void;
    /** Close the modal after success/failure */
    closeMigrationModal: () => void;
    /** Perform rollback to V1 */
    performRollback: () => Promise<boolean>;
}

export function useMigration(): UseMigrationReturn {
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const [migrationStatus, setMigrationStatus] =
        useState<MigrationStatus>("pending");
    const [migrationError, setMigrationError] = useState<string | undefined>();
    const [hasBackup, setHasBackup] = useState(false);

    // Check on mount if migration is needed
    useEffect(() => {
        const checkMigrationNeeded = () => {
            const version = detectStorageVersion();

            // Check if V1 backup exists
            setHasBackup(hasV1Backup());

            // Only show modal if V1 storage exists and user hasn't recently skipped
            if (version === "1.0.0") {
                const skipInfo = localStorage.getItem(MIGRATION_SKIPPED_KEY);
                if (skipInfo) {
                    const skipTime = parseInt(skipInfo, 10);
                    if (Date.now() - skipTime < MIGRATION_SKIP_EXPIRES) {
                        // User recently skipped, don't show again
                        return;
                    }
                }
                setShowMigrationModal(true);
            }
        };

        checkMigrationNeeded();
    }, []);

    const performMigration = useCallback(async (): Promise<void> => {
        setMigrationStatus("in-progress");
        setMigrationError(undefined);

        try {
            // 1. Create backup of V1 data
            console.log("🔄 Starting V1 → V2 migration...");
            backupV1Storage();

            // 2. Consolidate V1 data
            const consolidatedData = consolidateV1Data();

            // 3. Save as V2
            saveData(consolidatedData);

            // 4. Update backup status
            setHasBackup(true);

            // 5. Mark as complete
            setMigrationStatus("complete");
            console.log("✅ Migration complete!");

            // 6. Clear skip flag
            localStorage.removeItem(MIGRATION_SKIPPED_KEY);
        } catch (error) {
            console.error("❌ Migration failed:", error);
            setMigrationStatus("failed");
            setMigrationError(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during migration."
            );
        }
    }, []);

    const skipMigration = useCallback(() => {
        // Store skip time - will ask again after 24 hours
        localStorage.setItem(MIGRATION_SKIPPED_KEY, Date.now().toString());
        setShowMigrationModal(false);
    }, []);

    const closeMigrationModal = useCallback(() => {
        setShowMigrationModal(false);
    }, []);

    const performRollback = useCallback(async (): Promise<boolean> => {
        try {
            // Import the rollback function dynamically to avoid circular deps
            const { restoreV1FromBackup } = await import(
                "../utils/legacyStorage"
            );
            const { V2_STORAGE_KEY } = await import("../utils/storage");

            // 1. Restore V1 from backup
            const restored = restoreV1FromBackup();
            if (!restored) {
                throw new Error("No backup found to restore");
            }

            // 2. Remove V2 storage
            localStorage.removeItem(V2_STORAGE_KEY);

            // 3. Clear migration skip flag
            localStorage.removeItem(MIGRATION_SKIPPED_KEY);

            console.log("✅ Rollback complete - please refresh the page");
            return true;
        } catch (error) {
            console.error("❌ Rollback failed:", error);
            return false;
        }
    }, []);

    return {
        showMigrationModal,
        migrationStatus,
        migrationError,
        hasBackup,
        performMigration,
        skipMigration,
        closeMigrationModal,
        performRollback,
    };
}
