import React, { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ToastContainer } from "../ui/Toast";
import { BackupReminderNotification } from "../auth";
import { useApp } from "../../context/AppContext";
import { useNotifications } from "../../hooks/useNotifications";
import { importData } from "../../utils/storage";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { toasts, removeToast, showToast, refreshData } = useApp();
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // Initialize notification system
    useNotifications();

    const handleImportClick = () => {
        setShowImportModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        try {
            await importData(importFile);
            refreshData();
            showToast("Data imported successfully!", "success");
            setShowImportModal(false);
            setImportFile(null);
        } catch {
            showToast(
                "Failed to import data. Please check the file format.",
                "error"
            );
        }
    };

    return (
        <>
            {/* Mobile Navigation */}
            <MobileNav onImport={handleImportClick} />

            <div className="flex min-h-screen bg-background transition-colors">
                {/* Desktop Sidebar - hidden on mobile */}
                <div className="hidden lg:block">
                    <Sidebar onImport={handleImportClick} />
                </div>

                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            <ToastContainer toasts={toasts} onClose={removeToast} />

            <Modal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Import Data"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setShowImportModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleImport}
                            disabled={!importFile}>
                            Import
                        </Button>
                    </>
                }>
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Select a LifeOS backup file to import. This will replace
                        all current data.
                    </p>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-border transition-colors duration-200">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                    className="w-8 h-8 mb-4 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                    JSON file only
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".json"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                    {importFile && (
                        <p className="text-sm text-primary">
                            Selected: {importFile.name}
                        </p>
                    )}
                </div>
            </Modal>

            {/* Backup Reminder for Guest Users */}
            <BackupReminderNotification />
        </>
    );
};
