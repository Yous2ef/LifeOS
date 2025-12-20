/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string;
    // Add more env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
