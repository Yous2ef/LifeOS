/**
 * Google Drive Service (V2 - Unified Storage)
 *
 * Handles all Google Drive API operations for LifeOS data storage.
 * Uses the hidden appDataFolder in user's Google Drive (invisible to users).
 *
 * V2 Architecture:
 * - Single file: "lifeos.json" containing all app data
 * - Legacy V1 files are kept for migration reference only
 */

import { DRIVE_FILE, DRIVE_FILES_V1 } from "../config/google";

// Google Drive API endpoints
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

// Types for Drive API responses
interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    createdTime?: string;
    size?: string;
    parents?: string[];
}

interface DriveFileList {
    files: DriveFile[];
    nextPageToken?: string;
}

interface DriveError {
    error: {
        code: number;
        message: string;
        errors: Array<{
            domain: string;
            reason: string;
            message: string;
        }>;
    };
}

// Backup metadata type
export interface BackupInfo {
    id: string;
    name: string;
    fileName: string;
    modifiedTime: string;
    createdTime: string;
    size: number;
}

// Sync status type
export type SyncStatus = "idle" | "syncing" | "success" | "error";

/**
 * DriveService class - Singleton pattern for Google Drive operations
 */
class DriveServiceClass {
    private accessToken: string | null = null;
    private appFolderId: string | null = null;
    private backupsFolderId: string | null = null;
    private backupsFolderPromise: Promise<string> | null = null;
    private syncStatus: SyncStatus = "idle";
    private syncListeners: Set<(status: SyncStatus) => void> = new Set();

    /**
     * Set the access token for API calls
     */
    setAccessToken(token: string | null): void {
        this.accessToken = token;
        // Reset folder IDs when token changes (different user might login)
        if (!token) {
            this.appFolderId = null;
            this.backupsFolderId = null;
            this.backupsFolderPromise = null;
        }
    }

    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus {
        return this.syncStatus;
    }

    /**
     * Subscribe to sync status changes
     */
    onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
        this.syncListeners.add(listener);
        return () => this.syncListeners.delete(listener);
    }

    /**
     * Update sync status and notify listeners
     */
    private setSyncStatus(status: SyncStatus): void {
        this.syncStatus = status;
        this.syncListeners.forEach((listener) => listener(status));
    }

    /**
     * Check if the service is ready (has access token)
     */
    isReady(): boolean {
        return !!this.accessToken;
    }

    /**
     * Make authenticated API request to Google Drive
     */
    private async request<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        if (!this.accessToken) {
            throw new Error("Not authenticated. Please sign in with Google.");
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error: DriveError = await response.json();
            console.error("Drive API Error:", error);

            // Handle token expiration
            if (response.status === 401) {
                throw new Error("Session expired. Please sign in again.");
            }

            throw new Error(
                error.error?.message || `Drive API error: ${response.status}`
            );
        }

        // Handle empty responses (like delete operations)
        const text = await response.text();
        if (!text) {
            return {} as T;
        }

        return JSON.parse(text) as T;
    }

    /**
     * Get the hidden app data folder in Google Drive
     * Uses the special 'appDataFolder' which is invisible to users
     * but accessible only by this app
     */
    async getOrCreateAppFolder(): Promise<string> {
        // The appDataFolder is a special folder ID that Google Drive provides
        // It's hidden from users and only accessible by this app
        // We don't need to create it - it always exists
        this.appFolderId = "appDataFolder";
        return this.appFolderId;
    }

    /**
     * Find or create the Backups subfolder inside the app folder
     * Uses promise locking to prevent duplicate folder creation
     */
    async getOrCreateBackupsFolder(): Promise<string> {
        // Return cached folder ID if available
        if (this.backupsFolderId) {
            return this.backupsFolderId;
        }

        // If a folder creation is already in progress, wait for it
        if (this.backupsFolderPromise) {
            return this.backupsFolderPromise;
        }

        // Create the promise and store it to prevent race conditions
        this.backupsFolderPromise = this._createBackupsFolder();

        try {
            const folderId = await this.backupsFolderPromise;
            return folderId;
        } catch (error) {
            // Reset promise on error so it can be retried
            this.backupsFolderPromise = null;
            throw error;
        }
    }

    /**
     * Internal method to actually create/find the Backups folder
     */
    private async _createBackupsFolder(): Promise<string> {
        const appFolderId = await this.getOrCreateAppFolder();
        const backupsFolderName = "Backups";

        // Search for existing Backups folder inside app data folder
        const query = `name='${backupsFolderName}' and '${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
            query
        )}&spaces=appDataFolder&fields=files(id,name)`;

        const result = await this.request<DriveFileList>(searchUrl);

        if (result.files && result.files.length > 0) {
            this.backupsFolderId = result.files[0].id;
            console.log("Found existing Backups folder:", this.backupsFolderId);
            return this.backupsFolderId;
        }

        // Create new Backups folder in app data folder
        const folderMetadata = {
            name: backupsFolderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: [appFolderId],
        };

        const createResponse = await this.request<DriveFile>(
            `${DRIVE_API_BASE}/files`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(folderMetadata),
            }
        );

        this.backupsFolderId = createResponse.id;
        console.log("Created new Backups folder:", this.backupsFolderId);
        return this.backupsFolderId;
    }

    /**
     * Find a file by name in the app data folder
     */
    private async findFile(fileName: string): Promise<DriveFile | null> {
        const folderId = await this.getOrCreateAppFolder();

        const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
        const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
            query
        )}&spaces=appDataFolder&fields=files(id,name,modifiedTime,createdTime,size)`;

        const result = await this.request<DriveFileList>(searchUrl);

        return result.files && result.files.length > 0 ? result.files[0] : null;
    }

    /**
     * Save data to Google Drive
     * Creates a new file or updates existing one
     */
    async saveData<T>(fileName: string, data: T): Promise<DriveFile> {
        this.setSyncStatus("syncing");

        try {
            const folderId = await this.getOrCreateAppFolder();
            const existingFile = await this.findFile(fileName);

            const metadata = {
                name: fileName,
                mimeType: "application/json",
                ...(existingFile ? {} : { parents: [folderId] }),
            };

            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: "application/json" });

            // Create multipart request body
            const boundary = "-------lifeos_boundary";
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const body = new Blob([
                delimiter,
                "Content-Type: application/json; charset=UTF-8\r\n\r\n",
                JSON.stringify(metadata),
                delimiter,
                "Content-Type: application/json\r\n\r\n",
                blob,
                closeDelimiter,
            ]);

            let url: string;
            let method: string;

            if (existingFile) {
                // Update existing file
                url = `${DRIVE_UPLOAD_API}/files/${existingFile.id}?uploadType=multipart&fields=id,name,modifiedTime,createdTime,size`;
                method = "PATCH";
            } else {
                // Create new file
                url = `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,createdTime,size`;
                method = "POST";
            }

            const result = await this.request<DriveFile>(url, {
                method,
                headers: {
                    "Content-Type": `multipart/related; boundary=${boundary}`,
                },
                body,
            });

            console.log(`Saved ${fileName} to Drive:`, result.id);
            this.setSyncStatus("success");

            // Reset status after a delay
            setTimeout(() => {
                if (this.syncStatus === "success") {
                    this.setSyncStatus("idle");
                }
            }, 3000);

            return result;
        } catch (error) {
            console.error(`Error saving ${fileName} to Drive:`, error);
            this.setSyncStatus("error");
            throw error;
        }
    }

    /**
     * Load data from Google Drive
     */
    async loadData<T>(fileName: string): Promise<T | null> {
        this.setSyncStatus("syncing");

        try {
            const file = await this.findFile(fileName);

            if (!file) {
                console.log(`File ${fileName} not found in Drive`);
                this.setSyncStatus("idle");
                return null;
            }

            // Download file content
            const url = `${DRIVE_API_BASE}/files/${file.id}?alt=media`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`);
            }

            const data = (await response.json()) as T;
            console.log(`Loaded ${fileName} from Drive`);
            this.setSyncStatus("success");

            setTimeout(() => {
                if (this.syncStatus === "success") {
                    this.setSyncStatus("idle");
                }
            }, 3000);

            return data;
        } catch (error) {
            console.error(`Error loading ${fileName} from Drive:`, error);
            this.setSyncStatus("error");
            throw error;
        }
    }

    /**
     * Delete a file from Google Drive
     */
    async deleteFile(fileName: string): Promise<boolean> {
        try {
            const file = await this.findFile(fileName);

            if (!file) {
                console.log(`File ${fileName} not found, nothing to delete`);
                return false;
            }

            await this.request(`${DRIVE_API_BASE}/files/${file.id}`, {
                method: "DELETE",
            });

            console.log(`Deleted ${fileName} from Drive`);
            return true;
        } catch (error) {
            console.error(`Error deleting ${fileName} from Drive:`, error);
            throw error;
        }
    }

    /**
     * List all backup files in the Backups folder
     */
    async listBackups(): Promise<BackupInfo[]> {
        try {
            const backupsFolderId = await this.getOrCreateBackupsFolder();

            // List all backup files in the Backups folder (in hidden app data)
            const query = `'${backupsFolderId}' in parents and trashed=false and name contains 'backup_'`;
            const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
                query
            )}&spaces=appDataFolder&fields=files(id,name,modifiedTime,createdTime,size)&orderBy=modifiedTime desc`;

            const result = await this.request<DriveFileList>(url);

            if (!result.files) {
                return [];
            }

            return result.files.map((file) => ({
                id: file.id,
                name: file.name.replace(".json", "").replace(/_/g, " "),
                fileName: file.name,
                modifiedTime: file.modifiedTime || new Date().toISOString(),
                createdTime: file.createdTime || new Date().toISOString(),
                size: parseInt(file.size || "0", 10),
            }));
        } catch (error) {
            console.error("Error listing backups:", error);
            throw error;
        }
    }

    /**
     * Find a file in the Backups folder (in hidden app data)
     */
    private async findBackupFile(fileName: string): Promise<DriveFile | null> {
        const backupsFolderId = await this.getOrCreateBackupsFolder();

        const query = `name='${fileName}' and '${backupsFolderId}' in parents and trashed=false`;
        const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
            query
        )}&spaces=appDataFolder&fields=files(id,name,modifiedTime,createdTime,size)`;

        const result = await this.request<DriveFileList>(searchUrl);

        return result.files && result.files.length > 0 ? result.files[0] : null;
    }

    /**
     * Restore data from a backup file in the Backups folder
     */
    async restoreBackup<T>(backupFileName: string): Promise<T | null> {
        console.log(`🔄 Restoring from backup: ${backupFileName}`);

        try {
            const file = await this.findBackupFile(backupFileName);

            if (!file) {
                console.log(`Backup file not found: ${backupFileName}`);
                return null;
            }

            const url = `${DRIVE_API_BASE}/files/${file.id}?alt=media`;
            const data = await this.request<T>(url);

            console.log(`Loaded backup: ${backupFileName}`);
            return data;
        } catch (error) {
            console.error(`Error loading backup ${backupFileName}:`, error);
            throw error;
        }
    }

    /**
     * Delete a backup file from the Backups folder
     */
    async deleteBackup(backupFileName: string): Promise<boolean> {
        console.log(`🗑️ Deleting backup: ${backupFileName}`);

        try {
            const file = await this.findBackupFile(backupFileName);

            if (!file) {
                console.log(
                    `Backup file not found for deletion: ${backupFileName}`
                );
                return false;
            }

            await this.request(`${DRIVE_API_BASE}/files/${file.id}`, {
                method: "DELETE",
            });

            console.log(`Deleted backup: ${backupFileName}`);
            return true;
        } catch (error) {
            console.error(`Error deleting backup ${backupFileName}:`, error);
            throw error;
        }
    }

    /**
     * Create a timestamped backup in the Backups folder
     */
    async createBackup<T>(
        data: T,
        prefix: string = "backup"
    ): Promise<DriveFile> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${prefix}_${timestamp}.json`;

        const backupsFolderId = await this.getOrCreateBackupsFolder();

        const metadata = {
            name: fileName,
            mimeType: "application/json",
            parents: [backupsFolderId],
        };

        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });

        // Create multipart request body
        const boundary = "-------lifeos_boundary";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const body = new Blob([
            delimiter,
            "Content-Type: application/json; charset=UTF-8\r\n\r\n",
            JSON.stringify(metadata),
            delimiter,
            "Content-Type: application/json\r\n\r\n",
            blob,
            closeDelimiter,
        ]);

        const url = `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,createdTime,size`;

        const result = await this.request<DriveFile>(url, {
            method: "POST",
            headers: {
                "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body,
        });

        console.log(`Created backup: ${fileName}`);
        return result;
    }

    /**
     * Download a backup file content
     */
    async downloadBackup<T>(backupFileName: string): Promise<T | null> {
        return this.restoreBackup<T>(backupFileName);
    }

    /**
     * Save all app data to Drive (V2 unified file)
     */
    async saveAppData<T>(data: T): Promise<DriveFile> {
        return this.saveData(DRIVE_FILE, data);
    }

    /**
     * Load all app data from Drive (V2 unified file)
     */
    async loadAppData<T>(): Promise<T | null> {
        return this.loadData<T>(DRIVE_FILE);
    }

    // =========================================================================
    // LEGACY V1 METHODS (Deprecated - kept for migration only)
    // =========================================================================

    /**
     * @deprecated Use saveAppData with unified data instead
     */
    async saveFinanceData<T>(data: T): Promise<DriveFile> {
        console.warn("⚠️ saveFinanceData is deprecated. Use unified storage.");
        return this.saveData(DRIVE_FILES_V1.FINANCE_DATA, data);
    }

    /**
     * @deprecated Use loadAppData with unified data instead
     */
    async loadFinanceData<T>(): Promise<T | null> {
        console.warn("⚠️ loadFinanceData is deprecated. Use unified storage.");
        return this.loadData<T>(DRIVE_FILES_V1.FINANCE_DATA);
    }

    /**
     * @deprecated Use saveAppData with unified data instead
     */
    async saveProgrammingData<T>(data: T): Promise<DriveFile> {
        console.warn(
            "⚠️ saveProgrammingData is deprecated. Use unified storage."
        );
        return this.saveData(DRIVE_FILES_V1.PROGRAMMING_DATA, data);
    }

    /**
     * @deprecated Use loadAppData with unified data instead
     */
    async loadProgrammingData<T>(): Promise<T | null> {
        console.warn(
            "⚠️ loadProgrammingData is deprecated. Use unified storage."
        );
        return this.loadData<T>(DRIVE_FILES_V1.PROGRAMMING_DATA);
    }

    /**
     * @deprecated Use saveAppData with unified data instead
     */
    async saveFreelancingProjects<T>(data: T): Promise<DriveFile> {
        console.warn(
            "⚠️ saveFreelancingProjects is deprecated. Use unified storage."
        );
        return this.saveData(DRIVE_FILES_V1.FREELANCING_PROJECTS, data);
    }

    /**
     * @deprecated Use loadAppData with unified data instead
     */
    async loadFreelancingProjects<T>(): Promise<T | null> {
        console.warn(
            "⚠️ loadFreelancingProjects is deprecated. Use unified storage."
        );
        return this.loadData<T>(DRIVE_FILES_V1.FREELANCING_PROJECTS);
    }

    /**
     * @deprecated Use saveAppData with unified data instead
     */
    async saveFreelancingTasks<T>(data: T): Promise<DriveFile> {
        console.warn(
            "⚠️ saveFreelancingTasks is deprecated. Use unified storage."
        );
        return this.saveData(DRIVE_FILES_V1.FREELANCING_TASKS, data);
    }

    /**
     * @deprecated Use loadAppData with unified data instead
     */
    async loadFreelancingTasks<T>(): Promise<T | null> {
        console.warn(
            "⚠️ loadFreelancingTasks is deprecated. Use unified storage."
        );
        return this.loadData<T>(DRIVE_FILES_V1.FREELANCING_TASKS);
    }

    /**
     * @deprecated Use saveAppData with unified data instead
     */
    async saveFreelancingStandalone<T>(data: T): Promise<DriveFile> {
        console.warn(
            "⚠️ saveFreelancingStandalone is deprecated. Use unified storage."
        );
        return this.saveData(DRIVE_FILES_V1.FREELANCING_STANDALONE, data);
    }

    /**
     * @deprecated Use loadAppData with unified data instead
     */
    async loadFreelancingStandalone<T>(): Promise<T | null> {
        console.warn(
            "⚠️ loadFreelancingStandalone is deprecated. Use unified storage."
        );
        return this.loadData<T>(DRIVE_FILES_V1.FREELANCING_STANDALONE);
    }

    /**
     * Check if data exists in Drive (V2 unified file)
     */
    async hasDataInDrive(): Promise<boolean> {
        try {
            // Check for V2 file first
            const v2File = await this.findFile(DRIVE_FILE);
            if (v2File !== null) {
                return true;
            }

            // Fallback: Check for legacy V1 main data file
            const v1File = await this.findFile(DRIVE_FILES_V1.MAIN_DATA);
            return v1File !== null;
        } catch (error) {
            console.error("Error checking Drive data:", error);
            return false;
        }
    }

    /**
     * Get metadata about the app folder and files
     */
    async getDriveInfo(): Promise<{
        folderId: string;
        files: BackupInfo[];
        totalSize: number;
    }> {
        const folderId = await this.getOrCreateAppFolder();
        const files = await this.listBackups();
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        return {
            folderId,
            files,
            totalSize,
        };
    }
}

// Export singleton instance
export const DriveService = new DriveServiceClass();

// Export types
export type { DriveFile, DriveFileList };
