import React, { Suspense, lazy, useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./components/theme-provider";
import { Layout } from "./components/layout/Layout";
import { WelcomeModal, MigrationModal } from "./components/common";
import { isFirstTime, markFirstTimeComplete } from "./utils/storage";
import { useMigration } from "./hooks/useMigration";

// Lazy load all page components for code splitting
const Dashboard = lazy(() =>
    import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const University = lazy(() =>
    import("./pages/University").then((m) => ({ default: m.University }))
);
const SubjectDetails = lazy(() =>
    import("./pages/SubjectDetails").then((m) => ({
        default: m.SubjectDetails,
    }))
);
const Freelancing = lazy(() =>
    import("./pages/Freelancing").then((m) => ({ default: m.Freelancing }))
);
const FreelancingProjectDetail = lazy(() =>
    import("./pages/FreelancingProjectDetail").then((m) => ({
        default: m.FreelancingProjectDetail,
    }))
);
const Programming = lazy(() =>
    import("./pages/Programming").then((m) => ({ default: m.Programming }))
);
const ProgrammingProjectDetail = lazy(() =>
    import("./pages/ProgrammingProjectDetail").then((m) => ({
        default: m.ProgrammingProjectDetail,
    }))
);
const Home = lazy(() =>
    import("./pages/Home").then((m) => ({ default: m.Home }))
);
const Misc = lazy(() =>
    import("./pages/Misc").then((m) => ({ default: m.Misc }))
);
const Settings = lazy(() =>
    import("./pages/Settings").then((m) => ({ default: m.Settings }))
);
const Finance = lazy(() =>
    import("./pages/Finance").then((m) => ({ default: m.Finance }))
);

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
    </div>
);

// Inner component that has access to AppContext
const AppContent: React.FC = () => {
    const { data, updateData } = useApp();
    const [showWelcome, setShowWelcome] = useState(false);

    // Migration hook
    const {
        showMigrationModal,
        migrationStatus,
        migrationError,
        performMigration,
        skipMigration,
        closeMigrationModal,
    } = useMigration();

    useEffect(() => {
        // Check if this is the first time the user opens the app
        if (isFirstTime()) {
            setShowWelcome(true);
        }
    }, []);

    const handleWelcomeComplete = (name: string) => {
        // Update the user's name in settings
        updateData({
            settings: {
                ...data.settings,
                userName: name,
            },
        });

        // Mark first-time setup as complete
        markFirstTimeComplete();

        // Close the welcome modal
        setShowWelcome(false);
    };

    return (
        <>
            <HashRouter>
                <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route
                                path="/university"
                                element={<University />}
                            />
                            <Route
                                path="/university/subject/:subjectId"
                                element={<SubjectDetails />}
                            />
                            <Route
                                path="/freelancing"
                                element={<Freelancing />}
                            />
                            <Route
                                path="/freelancing/project/:projectId"
                                element={<FreelancingProjectDetail />}
                            />
                            <Route
                                path="/programming"
                                element={<Programming />}
                            />
                            <Route
                                path="/programming/project/:projectId"
                                element={<ProgrammingProjectDetail />}
                            />
                            <Route path="/home" element={<Home />} />
                            <Route path="/finance" element={<Finance />} />
                            <Route path="/misc" element={<Misc />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </Suspense>
                </Layout>
            </HashRouter>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                    },
                }}
            />
            <WelcomeModal
                isOpen={showWelcome}
                onComplete={handleWelcomeComplete}
            />
            <MigrationModal
                isOpen={showMigrationModal && !showWelcome}
                onMigrate={performMigration}
                onSkip={
                    migrationStatus === "complete"
                        ? closeMigrationModal
                        : skipMigration
                }
                status={migrationStatus}
                error={migrationError}
            />
        </>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <ThemeProvider defaultTheme="dark">
                <AppContent />
            </ThemeProvider>
        </AppProvider>
    );
};

export default App;
