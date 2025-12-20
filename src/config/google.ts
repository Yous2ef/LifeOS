// Google OAuth Configuration

export const GOOGLE_CONFIG = {
    // Client ID from environment variable (or fallback to hardcoded for development)
    // Note: Client ID is PUBLIC - security comes from Authorized Origins in Google Cloud Console
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,

    // Scopes for Google Drive API
    // drive.appdata = access only to app-created files in user's Drive
    // drive.file = access to files created/opened by the app
    scopes: [
        "https://www.googleapis.com/auth/drive.appdata", // App-specific folder
        "https://www.googleapis.com/auth/drive.file", // Files created by app
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),

    // Discovery doc for Google Drive API
    discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    ],
};

// App folder name in Google Drive
export const DRIVE_FOLDER_NAME = "LifeOS";

// V2 Unified Storage - Single file for all app data
// This matches the new V2 storage architecture (single localStorage key: "lifeos")
export const DRIVE_FILE = "lifeos.json";

// Legacy V1 file names (kept for migration purposes only)
export const DRIVE_FILES_V1 = {
    MAIN_DATA: "lifeos_data.json",
    FINANCE_DATA: "lifeos_finance.json",
    PROGRAMMING_DATA: "lifeos_programming.json",
    FREELANCING_PROJECTS: "lifeos_freelancing_projects.json",
    FREELANCING_TASKS: "lifeos_freelancing_tasks.json",
    FREELANCING_STANDALONE: "lifeos_freelancing_standalone.json",
} as const;
