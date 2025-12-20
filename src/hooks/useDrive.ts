/**
 * useDrive Hook
 *
 * Provides easy access to Google Drive operations with sync status tracking.
 * Automatically uses the access token from AuthContext.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
    DriveService,
    type SyncStatus,
    type BackupInfo,
} from "../services/DriveService";

interface UseDriveReturn {
    // Status
    isReady: boolean;
    syncStatus: SyncStatus;

    // Operations
    saveAppData: <T>(data: T) => Promise<void>;
    loadAppData: <T>() => Promise<T | null>;
    saveFinanceData: <T>(data: T) => Promise<void>;
    loadFinanceData: <T>() => Promise<T | null>;
    saveProgrammingData: <T>(data: T) => Promise<void>;
    loadProgrammingData: <T>() => Promise<T | null>;
    saveFreelancingProjects: <T>(data: T) => Promise<void>;
    loadFreelancingProjects: <T>() => Promise<T | null>;
    saveFreelancingTasks: <T>(data: T) => Promise<void>;
    loadFreelancingTasks: <T>() => Promise<T | null>;
    saveFreelancingStandalone: <T>(data: T) => Promise<void>;
    loadFreelancingStandalone: <T>() => Promise<T | null>;

    // Backup operations
    createBackup: <T>(data: T, prefix?: string) => Promise<void>;
    listBackups: () => Promise<BackupInfo[]>;

    // Utility
    hasDataInDrive: () => Promise<boolean>;
    getDriveInfo: () => Promise<{
        folderId: string;
        files: BackupInfo[];
        totalSize: number;
    }>;
}

export const useDrive = (): UseDriveReturn => {
    const { accessToken, isAuthenticated } = useAuth();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

    // Check if Drive is ready
    const isReady = isAuthenticated && !!accessToken && DriveService.isReady();

    // Subscribe to sync status changes
    useEffect(() => {
        const unsubscribe = DriveService.onSyncStatusChange(setSyncStatus);
        return unsubscribe;
    }, []);

    // Save app data
    const saveAppData = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveAppData(data);
        },
        [isReady]
    );

    // Load app data
    const loadAppData = useCallback(async <T>(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadAppData<T>();
    }, [isReady]);

    // Save finance data
    const saveFinanceData = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveFinanceData(data);
        },
        [isReady]
    );

    // Load finance data
    const loadFinanceData = useCallback(async <T>(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadFinanceData<T>();
    }, [isReady]);

    // Save programming data
    const saveProgrammingData = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveProgrammingData(data);
        },
        [isReady]
    );

    // Load programming data
    const loadProgrammingData = useCallback(async <T>(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadProgrammingData<T>();
    }, [isReady]);

    // Save freelancing projects
    const saveFreelancingProjects = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveFreelancingProjects(data);
        },
        [isReady]
    );

    // Load freelancing projects
    const loadFreelancingProjects = useCallback(async <
        T
    >(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadFreelancingProjects<T>();
    }, [isReady]);

    // Save freelancing tasks
    const saveFreelancingTasks = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveFreelancingTasks(data);
        },
        [isReady]
    );

    // Load freelancing tasks
    const loadFreelancingTasks = useCallback(async <T>(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadFreelancingTasks<T>();
    }, [isReady]);

    // Save freelancing standalone tasks
    const saveFreelancingStandalone = useCallback(
        async <T>(data: T): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.saveFreelancingStandalone(data);
        },
        [isReady]
    );

    // Load freelancing standalone tasks
    const loadFreelancingStandalone = useCallback(async <
        T
    >(): Promise<T | null> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.loadFreelancingStandalone<T>();
    }, [isReady]);

    // Create backup
    const createBackup = useCallback(
        async <T>(data: T, prefix?: string): Promise<void> => {
            if (!isReady) {
                throw new Error("Drive service not ready. Please sign in.");
            }
            await DriveService.createBackup(data, prefix);
        },
        [isReady]
    );

    // List backups
    const listBackups = useCallback(async (): Promise<BackupInfo[]> => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.listBackups();
    }, [isReady]);

    // Check if data exists in Drive
    const hasDataInDrive = useCallback(async (): Promise<boolean> => {
        if (!isReady) {
            return false;
        }
        return DriveService.hasDataInDrive();
    }, [isReady]);

    // Get Drive info
    const getDriveInfo = useCallback(async () => {
        if (!isReady) {
            throw new Error("Drive service not ready. Please sign in.");
        }
        return DriveService.getDriveInfo();
    }, [isReady]);

    return {
        isReady,
        syncStatus,
        saveAppData,
        loadAppData,
        saveFinanceData,
        loadFinanceData,
        saveProgrammingData,
        loadProgrammingData,
        saveFreelancingProjects,
        loadFreelancingProjects,
        saveFreelancingTasks,
        loadFreelancingTasks,
        saveFreelancingStandalone,
        loadFreelancingStandalone,
        createBackup,
        listBackups,
        hasDataInDrive,
        getDriveInfo,
    };
};

export default useDrive;
